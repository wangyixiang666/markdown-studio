import type * as VSCode from 'vscode';
import DebugWorker from './worker?worker';

type Message = { seq: number; type: string; command?: string; arguments?: any; [key: string]: any };
const normalize = (path: string) => path.replaceAll('\\', '/').replace(/^file:\/\//, '');

class PythonDebugAdapter implements VSCode.DebugAdapter {
  private emitter: VSCode.EventEmitter<any>;
  readonly onDidSendMessage: VSCode.Event<any>;
  private seq = 1;
  private requestId = 1;
  private breakpointId = 1;
  private breakpoints: Record<string, any[]> = {};
  private filters = ['uncaught'];
  private worker?: Worker;
  private control?: SharedArrayBuffer;
  private pending = new Map<number, { resolve: (result: any) => void; reject: (error: Error) => void }>();
  private queue: any[] = [];
  private busy = false;
  private ready = false;
  private ended = false;
  private launch: any;

  constructor(private api: typeof VSCode, private root: VSCode.Uri) {
    this.emitter = new api.EventEmitter<any>();
    this.onDidSendMessage = this.emitter.event;
  }
  private event(event: string, body: any = {}) {
    this.emitter.fire({ seq: this.seq++, type: 'event', event, body });
  }
  private respond(request: Message, body: any = {}, error?: string) {
    this.emitter.fire({ seq: this.seq++, type: 'response', request_seq: request.seq,
      command: request.command, success: !error, body, ...(error ? { message: error } : {}) });
  }
  handleMessage(request: Message) {
    void this.handle(request).catch(error => this.respond(request, {}, String(error)));
  }
  private async handle(request: Message) {
    const args = request.arguments ?? {};
    switch (request.command) {
      case 'initialize':
        this.respond(request, {
          supportsConfigurationDoneRequest: true, supportsEvaluateForHovers: true,
          supportsConditionalBreakpoints: true, supportsHitConditionalBreakpoints: true,
          supportsLogPoints: true, supportsSetVariable: true, supportsTerminateRequest: true,
          supportsExceptionInfoRequest: true,
          exceptionBreakpointFilters: [
            { filter: 'uncaught', label: '未捕获的异常', default: true },
            { filter: 'all', label: '所有异常', default: false },
          ],
        });
        this.event('initialized');
        return;
      case 'launch':
        this.launch = args;
        this.respond(request);
        return;
      case 'configurationDone':
        this.respond(request);
        await this.start();
        return;
      case 'setBreakpoints': {
        const path = normalize(args.source.path);
        const points = (args.breakpoints ?? []).map((bp: any) => ({ ...bp, id: this.breakpointId++, verified: true }));
        this.breakpoints[path] = points;
        const verified = this.worker ? (await this.command('setBreakpoints', { path, breakpoints: points })).breakpoints : points;
        this.respond(request, { breakpoints: verified.map((bp: any) => ({ ...bp, source: { path } })) });
        return;
      }
      case 'setExceptionBreakpoints':
        this.filters = args.filters ?? [];
        if (this.worker) await this.command('setExceptionBreakpoints', args);
        this.respond(request);
        return;
      case 'threads':
        this.respond(request, { threads: [{ id: 1, name: 'Python 主线程' }] });
        return;
      case 'disconnect': case 'terminate':
        this.respond(request);
        this.finish();
        return;
      case 'source': {
        const bytes = await this.api.workspace.fs.readFile(this.api.Uri.file(normalize(args.source.path)));
        this.respond(request, { content: new TextDecoder().decode(bytes), mimeType: 'text/x-python' });
        return;
      }
      case 'stackTrace': case 'scopes': case 'variables': case 'evaluate': case 'setVariable':
      case 'continue': case 'next': case 'stepIn': case 'stepOut': case 'pause': case 'exceptionInfo':
        this.respond(request, await this.command(request.command, args));
        return;
      case 'setFunctionBreakpoints':
        this.respond(request, { breakpoints: [] });
        return;
      default:
        this.respond(request, {}, `不支持的请求：${request.command}`);
    }
  }
  private command(method: string, args: any): Promise<any> {
    if (this.ended) return Promise.reject(new Error('调试已结束，请重新运行。'));
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pending.set(id, { resolve, reject });
      this.queue.push({ id, method, args });
      this.flush();
    });
  }
  private flush() {
    if (!this.ready || this.busy || !this.control || this.queue.length === 0) return;
    const item = this.queue.shift();
    const data = new TextEncoder().encode(JSON.stringify(item));
    if (data.length > this.control.byteLength - 16) {
      this.pending.get(item.id)?.reject(new Error('调试表达式过长。'));
      this.pending.delete(item.id);
      this.flush();
      return;
    }
    this.busy = true;
    new Uint8Array(this.control, 16).set(data);
    const header = new Int32Array(this.control, 0, 4);
    Atomics.store(header, 0, data.length);
    Atomics.notify(header, 0);
  }
  private async start() {
    if (!this.launch) throw new Error('缺少启动配置。');
    if (!window.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
      this.event('output', { category: 'stderr', output: '调试需要跨源隔离。请在独立浏览器标签页打开本站并刷新，再按 F5。\n' });
      this.finish();
      return;
    }
    await this.api.workspace.saveAll();
    const files: { path: string; bytes: Uint8Array }[] = [];
    async function gather(api: typeof VSCode, directory: VSCode.Uri) {
      for (const [name, type] of await api.workspace.fs.readDirectory(directory)) {
        const uri = api.Uri.joinPath(directory, name);
        if (type & api.FileType.Directory) await gather(api, uri);
        else {
          const stat = await api.workspace.fs.stat(uri);
          if (stat.size <= 5 * 1024 * 1024) files.push({ path: uri.path, bytes: await api.workspace.fs.readFile(uri) });
        }
      }
    }
    await gather(this.api, this.root);
    this.control = new SharedArrayBuffer(256 * 1024);
    this.worker = new DebugWorker();
    this.event('output', { category: 'console', output: '正在启动 Python…\n' });
    this.worker.onerror = error => {
      this.event('output', { category: 'stderr', output: error.message + '\n' });
      this.finish();
    };
    this.worker.onmessage = ({ data }) => {
      if (data.kind === 'ready') {
        this.ready = true;
        this.event('output', { category: 'console', output: 'Python 已就绪。\n' });
        this.flush();
      } else if (data.kind === 'response') {
        const request = this.pending.get(data.id);
        if (data.success) request?.resolve(data.result);
        else request?.reject(new Error(data.error));
        this.pending.delete(data.id);
        this.busy = false;
        this.flush();
      } else if (data.kind === 'event') {
        if (data.event === 'terminated') this.finish();
        else this.event(data.event, data.body);
      }
    };
    this.worker.postMessage({
      control: this.control, files,
      runtimeBase: new URL('python/', document.baseURI).href,
      config: { ...this.launch, program: normalize(this.launch.program), breakpoints: this.breakpoints, filters: this.filters },
    });
  }
  private finish() {
    if (this.ended) return;
    this.ended = true;
    this.worker?.terminate();
    for (const promise of this.pending.values()) promise.reject(new Error('调试会话已结束。'));
    this.pending.clear();
    this.queue = [];
    this.event('terminated');
  }
  dispose() {
    this.finish();
    this.emitter.dispose();
  }
}

export function installDebugger(api: typeof VSCode, root: VSCode.Uri) {
  const type = 'python-browser';
  api.debug.onDidStartDebugSession(session => {
    if (session.type === type) void api.commands.executeCommand('workbench.view.debug');
  });
  api.debug.registerDebugAdapterDescriptorFactory(type, {
    createDebugAdapterDescriptor: () => new api.DebugAdapterInlineImplementation(new PythonDebugAdapter(api, root)),
  });
  api.debug.registerDebugConfigurationProvider(type, {
    resolveDebugConfiguration(_folder, config) {
      const current = api.window.activeTextEditor?.document;
      config.type = type;
      config.request ??= 'launch';
      config.name ??= 'Python：当前文件';
      config.program = (config.program ?? '${file}').replace('${workspaceFolder}', root.path)
        .replace('${file}', current?.languageId === 'python' ? current.uri.path : root.path + '/debug/01_循环边界.py');
      config.stopOnEntry ??= true;
      return config;
    },
  });
  api.commands.registerCommand('markdownLab.debugCurrent', async () => {
    const document = api.window.activeTextEditor?.document;
    const uri = document?.languageId === 'python' ? document.uri : api.Uri.joinPath(root, 'debug/01_循环边界.py');
    await api.window.showTextDocument(uri);
    await api.debug.startDebugging(api.workspace.workspaceFolders?.[0], {
      type, request: 'launch', name: uri.path.split('/').pop() || 'Python', program: uri.path, stopOnEntry: true,
    });
  });
  api.commands.registerCommand('markdownLab.openDebugLesson', async () => {
    const uri = api.Uri.joinPath(root, '调试入门.md');
    await api.window.showTextDocument(uri);
    await api.commands.executeCommand('markdown.showPreviewToSide', uri);
  });
}
