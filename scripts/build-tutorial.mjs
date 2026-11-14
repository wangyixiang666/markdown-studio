import fs from 'node:fs/promises';
import { topics } from './tutorial-content.mjs';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const code = text => esc(text).replace(/ {2}(?=\n)/g, '<mark class="spaces">  </mark>');
const snippet = text => `<div class="example"><div class="example-bar"><span>写法</span><button class="copy" type="button">复制示例</button></div><pre><code>${code(text)}</code></pre></div>`;
let html = await fs.readFile('scripts/tutorial-page.html', 'utf8');
const navigation = topics.map(t => `<a href="#${t.id}">${esc(t.title)}</a>`).join('');
const lessons = topics.map(topic => `<section id="${topic.id}"><h2>${esc(topic.title)}</h2><p class="intro">${topic.intro}</p>${topic.items.map(item => `<article id="${item.id}"><h3>${esc(item.title)}</h3><p>${item.description}</p>${item.files ? `<div class="file-tree"><p>文件位置</p><pre>${esc(item.files)}</pre></div>` : ''}<div class="comparison${item.preview ? '' : ' source-only'}">${snippet(item.source)}${item.preview ? `<div class="result"><div class="result-label">预览效果</div><div class="rendered">${item.preview}</div></div>` : ''}</div>${item.after ? `<p>${item.after}</p>` : ''}</article>`).join('')}</section>`).join('');
html = html.replace('<!-- TOPIC_LINKS -->', () => navigation).replace('<!-- LESSONS -->', () => lessons);
html = html.replace(/<pre data-copy><code>([\s\S]*?)<\/code><\/pre>/g, (_, text) => `<div class="example"><div class="example-bar"><span>写法</span><button class="copy" type="button">复制示例</button></div><pre><code>${text}</code></pre></div>`);
await fs.mkdir('public/tutorial', { recursive: true });
await fs.writeFile('public/tutorial/index.html', html);
await fs.copyFile('src/example/assets/山间日出.svg', 'public/tutorial/sunrise.svg');
console.log(`Tutorial: ${topics.length} syntax topics, ${topics.reduce((n, topic) => n + topic.items.length, 0)} examples`);
