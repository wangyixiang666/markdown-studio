import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: './',
  build: { target: 'esnext', chunkSizeWarningLimit: 20000 },
  worker: { format: 'es' },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: { port: 4173 },
  plugins: [{
    name: 'bundle-python-runtime',
    generateBundle() {
      for (const name of ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
        this.emitFile({ type: 'asset', fileName: 'python/' + name, source: fs.readFileSync(path.resolve('node_modules/pyodide', name)) });
      }
    },
  }, {
    name: 'vscode-css',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('.css')) return;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && /node_modules\/(?:@codingame\/monaco-vscode|vscode|monaco-editor).*\.css$/.test(resolved.id.replaceAll('\\', '/'))) {
        return { ...resolved, id: resolved.id + '?inline' };
      }
    },
  }],
  optimizeDeps: { include: ['vscode/localExtensionHost'], esbuildOptions: { target: 'esnext' } },
});
