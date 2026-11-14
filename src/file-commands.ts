import type * as VSCode from 'vscode';
import { MenuId, MenuRegistry } from '@codingame/monaco-vscode-api/vscode/vs/platform/actions/common/actions';
import { zipSync } from 'fflate';

export function installFileCommands(api: typeof VSCode, root: VSCode.Uri, welcome: VSCode.Uri) {
  api.commands.registerCommand('markdownLab.openTutorial', () => api.env.openExternal(api.Uri.parse(new URL('tutorial/', window.location.href).href)));
  const tutorial = api.window.createStatusBarItem(api.StatusBarAlignment.Left, 100);
  tutorial.text = '$(book) 课堂教程';
  tutorial.tooltip = '按主题查语法、复制示例、查看课堂任务';
  tutorial.command = 'markdownLab.openTutorial';
  tutorial.show();
  function register(id: string, handler: (...args: any[]) => any) {
    api.commands.registerCommand(id, async (...args: any[]) => {
      try { await handler(...args); }
      catch (error) { await api.window.showErrorMessage(error instanceof Error ? error.message : String(error)); }
    });
  }
  function download(bytes: Uint8Array, name: string, type = 'application/octet-stream') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  const exists = async (uri: VSCode.Uri) => {
    try { await api.workspace.fs.stat(uri); return true; } catch { return false; }
  };
  register('markdownLab.newFile', async () => {
    const name = await api.window.showInputBox({
      title: '新建 Markdown 文件', value: '未命名.md', valueSelection: [0, 3],
      validateInput: value => !value.trim() || /[\\/:*?"<>|]/.test(value) || value === '.' || value === '..' ? '请输入有效的文件名' : undefined,
    });
    if (!name) return;
    const uri = api.Uri.joinPath(root, /\.md(?:own|arkdown)?$/i.test(name) ? name : name + '.md');
    if (await exists(uri)) { await api.window.showTextDocument(uri); return; }
    await api.workspace.fs.writeFile(uri, new Uint8Array());
    await api.window.showTextDocument(uri, { preview: false });
  });

  function importFiles(folder = false, destination = root) {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true;
    if (folder) input.setAttribute('webkitdirectory', '');
    input.addEventListener('change', async () => {
      try {
        let firstMarkdown: VSCode.Uri | undefined;
        for (const file of Array.from(input.files ?? [])) {
          const relative = file.webkitRelativePath || file.name;
          const pieces = relative.split('/').filter(part => part && part !== '.' && part !== '..');
          const uri = api.Uri.joinPath(destination, ...pieces);
          if (await exists(uri)) {
            const answer = await api.window.showWarningMessage(`“${relative}”已存在，是否替换？`, { modal: true }, '替换');
            if (answer !== '替换') continue;
          }
          await api.workspace.fs.createDirectory(api.Uri.joinPath(destination, ...pieces.slice(0, -1)));
          await api.workspace.fs.writeFile(uri, new Uint8Array(await file.arrayBuffer()));
          if (!firstMarkdown && /\.(md|markdown)$/i.test(file.name)) firstMarkdown = uri;
        }
        if (firstMarkdown) await api.window.showTextDocument(firstMarkdown, { preview: false });
      } catch (error) { await api.window.showErrorMessage(`导入失败：${String(error)}`); }
    }, { once: true });
    input.click();
  }
  register('markdownLab.importFiles', async (resource?: VSCode.Uri) => {
    const destination = resource?.scheme === 'file' && ((await api.workspace.fs.stat(resource)).type & api.FileType.Directory) ? resource : root;
    importFiles(false, destination);
  });
  register('markdownLab.importFolder', () => importFiles(true));
  register('markdownLab.downloadFile', async (resource?: VSCode.Uri) => {
    const document = api.window.activeTextEditor?.document;
    const uri = resource?.scheme ? resource : document?.uri;
    if (!uri) { await api.window.showInformationMessage('请先打开要下载的文件。'); return; }
    if (document && document.uri.toString() === uri.toString()) {
      await document.save();
      download(new TextEncoder().encode(document.getText()), uri.path.split('/').pop() || '未命名.md', 'text/plain;charset=utf-8');
    } else {
      download(await api.workspace.fs.readFile(uri), uri.path.split('/').pop() || '文件');
    }
  });
  register('markdownLab.downloadWorkspace', async () => {
    await api.workspace.saveAll();
    const files: Record<string, Uint8Array> = {};
    async function walk(uri: VSCode.Uri, prefix: string) {
      for (const [name, type] of await api.workspace.fs.readDirectory(uri)) {
        if (type & api.FileType.SymbolicLink) continue;
        const child = api.Uri.joinPath(uri, name);
        if (type & api.FileType.Directory) await walk(child, prefix + name + '/');
        else files[prefix + name] = await api.workspace.fs.readFile(child);
      }
    }
    await walk(root, 'Markdown/');
    download(zipSync(files), 'Markdown-练习目录.zip', 'application/zip');
  });
  register('markdownLab.openExample', async () => {
    if (!await exists(welcome)) { await api.window.showInformationMessage('示例文档已被删除。可从网站源码中的 src/example 重新下载。'); return; }
    await api.window.showTextDocument(welcome);
    await api.commands.executeCommand('markdown.showPreviewToSide', welcome);
  });
  api.window.registerCustomEditorProvider('markdownLab.imagePreview', {
    async openCustomDocument(uri) { return { uri, dispose() {} }; },
    async resolveCustomEditor(document, panel) {
      panel.webview.options = { localResourceRoots: [root], enableScripts: false };
      const src = panel.webview.asWebviewUri(document.uri);
      panel.webview.html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} data: blob:; style-src 'unsafe-inline';"><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:var(--vscode-editor-background);overflow:auto}img{max-width:100%;max-height:100vh;object-fit:contain}</style></head><body><img src="${src}" alt="图片预览"></body></html>`;
    },
  });
  for (const [id, title, order] of [
    ['markdownLab.newFile', '新建 Markdown 文件', 0],
    ['markdownLab.importFiles', '导入本地文件…', 1],
    ['markdownLab.importFolder', '导入本地文件夹…', 2],
    ['markdownLab.downloadFile', '下载当前文件', 3],
    ['markdownLab.downloadWorkspace', '下载整个练习目录（ZIP）', 4],
  ] as const) {
    MenuRegistry.appendMenuItem(MenuId.MenubarFileMenu, { command: { id, title }, group: '0_markdown', order });
  }
}
