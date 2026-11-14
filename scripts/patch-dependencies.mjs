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
