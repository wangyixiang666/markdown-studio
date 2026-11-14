// GitHub Pages does not expose custom response headers. This worker adds the
// isolation headers needed by the original VS Code browser extension host.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  event.respondWith((async () => {
    const response = await fetch(request);
    if (response.status === 0 || response.type === 'opaque') return response;
    const headers = new Headers(response.headers);
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  })());
});
