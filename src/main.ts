async function start() {
  if (!window.crossOriginIsolated && 'serviceWorker' in navigator) {
    await navigator.serviceWorker.register(new URL('isolation-sw.js', document.baseURI).href, { scope: './' });
    await navigator.serviceWorker.ready;
    if (!sessionStorage.getItem('md-isolation-attempt')) {
      sessionStorage.setItem('md-isolation-attempt', '1');
      location.reload();
      return;
    }
  }
  // Upgrade the nested worker before opening any webviews. An older worker at
  // this scope could otherwise serve an unisolated iframe before it can update.
  if ('serviceWorker' in navigator) {
    const webviewWorker = new URL('../node_modules/@codingame/monaco-vscode-view-common-service-override/service-override/viewCommon/vs/workbench/contrib/webview/browser/pre/service-worker.js', import.meta.url);
    const registration = await navigator.serviceWorker.register(webviewWorker.href, { type: 'module' });
    const worker = registration.installing ?? registration.waiting;
    if (worker && worker.state !== 'activated') {
      await new Promise<void>((resolve, reject) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve();
          if (worker.state === 'redundant') reject(new Error('预览组件加载失败，请刷新重试。'));
        });
      });
    }
  }
  await import('@codingame/monaco-vscode-language-pack-zh-hans');
  await import('./workbench');
}

start().catch((error) => {
  console.error(error);
  const loading = document.getElementById('loading')!;
  loading.replaceChildren();
  const title = document.createElement('div');
  title.textContent = '工作台暂时未能加载';
  const detail = document.createElement('div');
  detail.textContent = error instanceof Error ? error.message : String(error);
  detail.style.cssText = 'max-width:560px;line-height:1.7;overflow-wrap:anywhere;padding:0 20px';
  const retry = document.createElement('button');
  retry.textContent = '重新加载';
  retry.onclick = () => location.reload();
  loading.append(title, detail, retry);
});
