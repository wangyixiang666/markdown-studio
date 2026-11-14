document.querySelectorAll('.copy').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.closest('.example').querySelector('code').textContent);
      button.textContent = '已复制';
      setTimeout(() => { button.textContent = '复制示例'; }, 1600);
    } catch {
      button.textContent = '请选中代码复制';
    }
  });
});

document.querySelectorAll('[data-task]').forEach(input => {
  const key = 'workshop-task-' + input.dataset.task;
  try { input.checked = localStorage.getItem(key) === '1'; } catch {}
  input.addEventListener('change', () => {
    try { localStorage.setItem(key, input.checked ? '1' : '0'); } catch {}
  });
});

const sections = [...document.querySelectorAll('main > section')];
const links = [...document.querySelectorAll('nav a')];
const search = document.querySelector('#topic-search');
const content = new Map(sections.map(section => [section.id, section.textContent.toLowerCase()]));
function updateCurrentTopic() {
  const visible = sections.filter(section => !section.hidden);
  const active = visible.filter(section => section.getBoundingClientRect().top <= window.innerHeight * .28).at(-1) || visible[0];
  links.forEach(link => {
    if (active && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function filter() {
  const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  sections.forEach(section => { section.hidden = !words.every(word => content.get(section.id).includes(word)); });
  links.forEach(link => { link.hidden = document.querySelector(link.hash).hidden; });
  document.querySelector('#search-empty').hidden = sections.some(section => !section.hidden);
  updateCurrentTopic();
}
search.addEventListener('input', filter);
search.addEventListener('keydown', event => {
  if (event.key === 'Escape') { search.value = ''; filter(); }
});
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  const target = document.getElementById(link.hash.slice(1));
  if (target?.hidden) { search.value = ''; filter(); }
}));
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { updateCurrentTopic(); scrollPending = false; });
}, { passive: true });
window.addEventListener('hashchange', updateCurrentTopic);
updateCurrentTopic();

async function setupTrace(root) {
  const response = await fetch('trace.json');
  if (!response.ok) throw new Error('Trace could not be loaded');
  const data = await response.json();
  let variant = 'original', position = 0;
  const editor = root.querySelector('.trace-code');
  const variables = root.querySelector('.trace-values');
  const previous = root.querySelector('[data-trace-prev]');
  const next = root.querySelector('[data-trace-next]');
  const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  function render() {
    const run = data[variant], step = run.steps[position], prior = run.steps[position - 1];
    editor.innerHTML = run.source.split('\n').map((line, index) => `<span${step.event === 'line' && step.line === index + 1 ? ' class="active"' : ''}>${escape(line) || ' '}</span>`).join('');
    variables.innerHTML = ['n', 'i', 'total'].map(name => `<div${prior && prior.variables[name] !== step.variables[name] ? ' class="changed"' : ''}><dt>${name}</dt><dd>${escape(step.variables[name] ?? '未赋值')}</dd></div>`).join('');
    root.querySelector('.trace-caption').textContent = step.event === 'return'
      ? `函数结束，返回 ${step.value}。${variant === 'original' ? 'i 最后是 4，循环没有加上 5。' : 'i 最后是 5，结果是 15。'}`
      : '黄色行还没有执行。点“下一步”执行它，再看变量有没有变化。';
    root.querySelector('.trace-count').textContent = `${position + 1} / ${run.steps.length}`;
    previous.disabled = position === 0;
    next.disabled = position === run.steps.length - 1;
    root.querySelectorAll('[data-variant]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.variant === variant)));
  }
  previous.addEventListener('click', () => { position = Math.max(0, position - 1); render(); });
  next.addEventListener('click', () => { position = Math.min(data[variant].steps.length - 1, position + 1); render(); });
  root.querySelector('[data-trace-reset]').addEventListener('click', () => { position = 0; render(); });
  root.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => { variant = button.dataset.variant; position = 0; render(); }));
  render();
}
document.querySelectorAll('[data-trace]').forEach(root => {
  setupTrace(root).catch(() => {
    root.querySelector('.trace-caption').textContent = '执行记录暂时没加载出来。刷新页面重试，或按上面的步骤在练习网页里操作。';
    root.querySelectorAll('button').forEach(button => { button.disabled = true; });
  });
});
