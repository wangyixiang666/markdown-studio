document.querySelectorAll('.copy').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.parentElement.querySelector('code').textContent);button.textContent='已复制';setTimeout(()=>button.textContent='复制示例',1500)}catch{button.textContent='请选中代码复制'}}));
document.querySelectorAll('[data-task]').forEach(input=>{try{input.checked=localStorage.getItem('workshop-task-'+input.dataset.task)==='1'}catch{}input.addEventListener('change',()=>{try{localStorage.setItem('workshop-task-'+input.dataset.task,input.checked?'1':'0')}catch{}})});
const sections=[...document.querySelectorAll('main section')];const links=document.querySelectorAll('nav a');
function updateCurrentTopic(){const active=sections.filter(section=>section.getBoundingClientRect().top<=window.innerHeight*.28).at(-1)||sections[0];links.forEach(link=>link.setAttribute('aria-current',String(link.hash==='#'+active.id)))}
let scrollPending=false;
window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{updateCurrentTopic();scrollPending=false})},{passive:true});
window.addEventListener('hashchange',updateCurrentTopic);updateCurrentTopic();
