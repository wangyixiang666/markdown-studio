import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';

// VS Code embeds executable assets and nested webviews. Serve the exact static
// build in development too, so service-worker and resource URLs match Pages.
const vite = path.resolve('node_modules/vite/bin/vite.js');
const build = spawnSync(process.execPath, [vite, 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const server = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1'], { stdio: 'inherit' });
server.on('exit', code => process.exit(code ?? 0));
process.on('SIGINT', () => server.kill());
