import fs from 'node:fs';
import path from 'node:path';

// monaco-vscode-api 39.0.4 begins indexing asynchronously in its constructor.
// Markdown's language server can search before indexing finishes. Wait for the
// existing initialization promise instead of rejecting that first request.
const base = path.resolve('node_modules/@codingame/monaco-vscode-search-service-override/service-override/tools');
const providerPath = path.join(base, 'search-utils/base-provider.js');
const searchPath = path.join(base, 'search-providers/workspace-search-provider.js');
const original = fs.readFileSync(providerPath, 'utf8');
const search = fs.readFileSync(searchPath, 'utf8');
if (!original.includes('this.initialization = this.initializeProvider();')) {
  if (!original.includes('this.initializeProvider();') || !search.includes("throw new Error('Search provider not initialized');")) {
    throw new Error('Search initialization patch needs review for this dependency version.');
  }
  fs.writeFileSync(providerPath, original.replace('this.initializeProvider();', 'this.initialization = this.initializeProvider();'));
  fs.writeFileSync(searchPath, search.replaceAll("throw new Error('Search provider not initialized');", 'await this.initialization;'));
}

// The webview worker owns /assets/ and supersedes our root isolation worker.
// Preserve isolation for its HTML and worker navigations on static hosting.
const webviewWorkerPath = path.resolve('node_modules/@codingame/monaco-vscode-view-common-service-override/service-override/viewCommon/vs/workbench/contrib/webview/browser/pre/service-worker.js');
const webviewWorker = fs.readFileSync(webviewWorkerPath, 'utf8');
if (!webviewWorker.includes('markdown-studio: preserve static-host isolation')) {
  const anchor = "\tconst requestUrl = new URL(event.request.url);";
  if (!webviewWorker.includes(anchor)) throw new Error('Webview isolation patch needs review for this dependency version.');
  fs.writeFileSync(webviewWorkerPath, webviewWorker.replace(anchor, `${anchor}
  // markdown-studio: preserve static-host isolation
  if (requestUrl.origin === sw.location.origin) {
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
    return event.respondWith(fetch(event.request).then(response => {
      if (response.status === 0 || response.type === 'opaque') return response;
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }));
  }
`));
}
