/// <reference lib="webworker" />
import runtime from './runtime.py?raw';

const worker = self as unknown as DedicatedWorkerGlobalScope;
worker.onmessage = async (event) => {
  const { control, runtimeBase, files, config } = event.data;
  const header = new Int32Array(control, 0, 4);
  const payload = new Uint8Array(control, 16);
  const decoder = new TextDecoder();
  const send = (data: any) => worker.postMessage(data);
  try {
    const { loadPyodide } = await import(/* @vite-ignore */ runtimeBase + 'pyodide.mjs');
    const py = await loadPyodide({ indexURL: runtimeBase });
    py.setStdout({ batched: (output: string) => send({ kind: 'event', event: 'output', body: { category: 'stdout', output: output + '\n' } }) });
    py.setStderr({ batched: (output: string) => send({ kind: 'event', event: 'output', body: { category: 'stderr', output: output + '\n' } }) });
    for (const file of files) {
      py.FS.mkdirTree(file.path.slice(0, file.path.lastIndexOf('/')));
      py.FS.writeFile(file.path, file.bytes);
    }
    py.globals.set('_debug_send', (json: string) => send(JSON.parse(json)));
    py.globals.set('_debug_poll', () => Atomics.load(header, 0) > 0);
    py.globals.set('_debug_receive', () => {
      while (Atomics.load(header, 0) === 0) Atomics.wait(header, 0, 0);
      const length = Atomics.load(header, 0);
      const text = decoder.decode(payload.slice(0, length));
      Atomics.store(header, 0, 0);
      return text;
    });
    py.runPython(runtime);
    const verify = py.globals.get('verify_breakpoints');
    for (const [path, breakpoints] of Object.entries(config.breakpoints)) {
      const verified = JSON.parse(verify(path, JSON.stringify(breakpoints)));
      config.breakpoints[path] = verified.filter((bp: any) => bp.verified);
      for (const bp of verified) send({ kind: 'event', event: 'breakpoint', body: { reason: 'changed', breakpoint: { ...bp, source: { path } } } });
    }
    verify.destroy();
    send({ kind: 'ready' });
    const run = py.globals.get('debug_entry');
    run(JSON.stringify(config));
    run.destroy();
  } catch (error) {
    send({ kind: 'event', event: 'output', body: { category: 'stderr', output: String(error) + '\n' } });
    send({ kind: 'event', event: 'terminated', body: {} });
  }
};
