import fs from 'node:fs/promises';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const topics=[
['headings','标题、强调与引用','先把文章的层次写出来，再标出重点。',[
['标题','# 一级标题\n\n## 二级标题\n\n### 三级标题','# 后留一个空格。1～6 个 # 对应六级标题。'],
['强调','**重点内容**\n\n*英文书名*\n\n~~已经过时~~','两边各两个星号是加粗，一个星号是斜体，两个波浪号是删除线。'],
['引用与分隔线','> 学而不思则罔。\n\n---\n\n下面开始新的内容。','> 用来引用别人的话；--- 单独放一行，前后空一行更清楚。']]],
['breaks','回车、空行与换行','编辑器里换了一行，预览不一定换行。先分清这几种情况。',[
['普通回车','今天学习 Markdown。\n明天整理课堂笔记。','默认设置下仍是同一段，通常连着显示。窗口变窄引起的自动折行，也不会新增段落。'],
['空一行分段','第一段。\n\n第二段。\n\n\n\n第三段。','一个空行分开两个段落；多空几行通常不会增加预览中的间距。'],
['行末两个空格','第一行后面有两个空格。  \n第二行仍在同一段。','在第一行末尾按两次空格，再按回车。点“复制示例”会保留这两个空格。'],
['行末反斜杠','第一行以反斜杠结尾。\\\n第二行仍在同一段。','也可以在行末写一个反斜杠，再回车。'],
['用 <br> 换行','周一<br>上高数课\n\n周二<br><br>上程序设计课','<br> 是 HTML 换行标签。连续两个会空出一行，表格单元格内也能用它。'],
['VSCode 的设置','markdown.preview.breaks','默认关闭。开启后，普通回车也会换行。课堂示例按默认关闭的效果讲解；代码块会保留自己的换行。']]],
['lists','列表与缩进','同一级顶格写，下一层向右缩进。',[
['无序列表','- 阅读讲义\n- 整理笔记\n- 完成练习','-、+、* 都能作标记，后面要有空格。一个列表尽量统一用同一种。'],
['自动编号','1. 打开网页\n1. 新建文件\n1. 观察预览','预览会自动排成 1、2、3。若第一项写 7.，这组列表就从 7 开始。'],
['嵌套列表','- 周一\n    - 高等数学\n    - 程序设计\n- 周二\n    1. 预习\n    2. 复习','子列表缩进到父项正文之后。本例统一用 4 个空格；不要把同层项目错缩成子层。'],
['列表里的第二段','1. 观察现象\n\n   先记录实际结果。\n\n2. 尝试修改\n\n   再用相同输入检查。','续写的段落与该项正文对齐。本例 1. 后的正文从第 4 列开始，所以续段前留 3 个空格。空行会让列表更疏朗。'],
['任务列表','- [ ] 阅读讲义\n- [x] 完成练习','GitHub 会显示复选框；本工作坊保留 VSCode 原生预览行为，可能显示 [ ] 与 [x] 文本。不同平台的扩展语法会有差别。']]],
['paths','链接、图片与相对路径','从当前这份 Markdown 文件所在的文件夹出发找目标。',[
['链接','[南京大学](https://www.nju.edu.cn)\n\n[打开笔记](./notes/课堂笔记.md)','方括号里是显示的文字，小括号里是地址。点击预览里的文字可以打开目标。'],
['图片','![山间日出](./assets/山间日出.svg)','图片比链接多一个 !。方括号中是替代文字；图片打不开时先检查文件名和路径。'],
['. 表示当前文件夹','Markdown/\n├── 我的笔记.md\n└── assets/\n    └── 山间日出.svg\n\n./assets/山间日出.svg','在“我的笔记.md”中写上面的路径：先从当前文件夹进入 assets，再找到图片。开头的 ./ 也可以省略。'],
['.. 表示上一级文件夹','Markdown/\n├── notes/\n│   └── 课堂笔记.md\n└── assets/\n    └── 山间日出.svg\n\n../assets/山间日出.svg','在 notes/课堂笔记.md 中：.. 先回到 Markdown，再进入 assets。../../ 表示连续向上两级。路径统一用 /。']]],
['code','行内代码与代码块','把代码展示给别人看，并不会自动运行它。',[
['行内代码','用 `print()` 输出结果。','短函数名、文件名或命令，用一对反引号包起来。反引号通常在键盘 Esc 下方。'],
['代码块','```python\nname = "南大"\nprint("你好，" + name)\n```','第一行三个反引号开始，最后一行三个反引号结束。python 只用来指定语法高亮。要运行程序，请打开 .py 文件并启动调试。']]],
['table','表格','先写表头，再用分隔行告诉预览如何对齐。',[
['三列课程表','| 课程 | 星期 | 学分 |\n| :--- | :---: | ---: |\n| 高数 | 一 | 5 |\n| 程设 | 三 | 4 |','| 分列，第二行不能漏。:--- 左对齐，:---: 居中，---: 右对齐。单元格里换行可以用 <br>。']]],
['math','LaTeX 数学公式','一句话中的公式用一对 $，单独展示的公式用两对 $$。',[
['行内与独立公式','行内公式：$E=mc^2$。\n\n$$\n\\sum_{i=1}^{n} i=\\frac{n(n+1)}{2}\n$$','公式由 VSCode 的数学扩展渲染。独立公式前后空一行，源码更好读。'],
['常用写法','$x_i^2$\n\n$\\frac{a+b}{c}$\n\n$\\sqrt{x}$\n\n$\\alpha + \\beta$','_ 是下标，^ 是上标，frac 是分数，sqrt 是根号。多个字符要用花括号分组。']]],
['mermaid','Mermaid 流程图','在 mermaid 代码块里写出节点和连接关系。',[
['三个步骤','```mermaid\nflowchart TD\n    A[观察问题] --> B[提出猜想]\n    B --> C[动手验证]\n```','TD 表示从上到下，LR 表示从左到右。方括号里的文字显示在节点中，--> 连接两个节点。']]],
['html','折叠、注释与转义','需要补充排版时，可以用少量 HTML。',[
['折叠答案','<details>\n<summary>点这里看答案</summary>\n\n答案是 **15**。\n\n</details>','summary 是可点击的标题。正文前后各空一行，让其中的 Markdown 正常解析。'],
['只留在源码里的备注','这段文字会显示。\n\n<!-- 这里留给自己做备注 -->','<!-- 和 --> 之间的内容不在预览中显示，但仍保存在文件里。'],
['原样显示符号','\\*\\*重点\\*\\*\n\n\\# 这不是标题','在特殊符号前加反斜杠，让它失去排版作用。也可以用行内代码展示完整写法。']]],
];
let html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>求真工作坊 · 课堂教程</title><link rel="stylesheet" href="style.css"></head><body><header><a class="brand" href="#">求真工作坊</a><a class="practice" href="../" target="_blank" rel="noopener">打开练习网页 ↗</a></header><div class="layout"><nav aria-label="教程目录"><a href="#start">从这里开始</a>${topics.map(x=>`<a href="#${x[0]}">${x[1]}</a>`).join('')}<a href="#exercise">课堂任务</a><a href="#debug">代码调试</a></nav><main><section id="start" class="hero"><h1>忘记写法？<br>来这里查一查。</h1><p>Markdown 与代码调试课堂教程</p><div class="actions"><a href="#exercise">查看课堂任务 →</a><a href="#breaks">回车为什么没换行？</a></div></section>`;
for(const [id,title,intro,examples] of topics)html+=`<section id="${id}"><h2>${title}</h2><p class="intro">${esc(intro)}</p>${examples.map(([t,code,tip])=>`<article><h3>${esc(t)}</h3><div class="example"><pre><code>${esc(code)}</code></pre><button class="copy" type="button">复制示例</button></div><p>${esc(tip)}</p></article>`).join('')}</section>`;
html+=`<section id="exercise"><h2>课堂任务：我的大学第一周</h2><p class="intro">在练习网页按 Ctrl + N，新建“我的大学第一周.md”。完成下面六项，再打开预览检查。</p><div class="checklist">${['用一个一级标题写笔记名称，再写至少两个二级标题。','写一份至少三项的列表；任选一项加粗。','插入 assets 文件夹里的“山间日出.svg”，让图片正常显示。','写一个行内公式或独立公式。','插入一个带 python 语言标记的代码块，至少写两行代码。','检查预览，再按 Ctrl + Shift + S 下载文件；含图片的笔记用“文件 → 下载整个练习目录”一起保存。'].map((t,i)=>`<label><input type="checkbox" data-task="${i}"><span>${t}</span></label>`).join('')}</div><p>遇到不会的语法，直接点左侧目录。你也可以打开编辑器里的“Markdown 语法大全.md”查更多例子。</p><a class="practice" href="../" target="_blank" rel="noopener">开始动手 →</a></section><section id="debug"><h2>让程序停下来，看一眼</h2><p class="intro">打开 debug/01_循环边界.py。目标是算出 1 + 2 + 3 + 4 + 5 = 15。</p><ol><li>点击 total = total + i 左侧的行号空白处，设一个红色断点。</li><li>按 F5 启动，首次运行会加载 Python。</li><li>暂停后，查看左侧变量 n、i、total。黄色行是下一步将要执行的代码。</li><li>反复按 F10，观察 i 最后取到了几。</li><li>修改循环范围，再运行一次，确认结果是 15。</li></ol><div class="keys"><p><kbd>F9</kbd> 设置 / 取消断点</p><p><kbd>F5</kbd> 启动 / 继续</p><p><kbd>F10</kbd> 单步跳过</p><p><kbd>Alt + F11</kbd> 单步进入（网页）</p><p><kbd>Shift + F11</kbd> 单步跳出</p><p><kbd>Shift + F5</kbd> 停止</p></div><h3>再选一个小问题</h3><ul><li>条件边界：满 100 元是否免运费？试试 99、100、101。</li><li>函数参数：原价 36 元、优惠 5 元，为什么算出 -31？</li><li>列表共享：改了新名单，原名单为什么也变了？</li><li>列表下标：第 3 位同学应该用哪个下标？</li></ul><p>参考答案在 debug/参考答案/答案与检验.py。先观察，再修改，最后用原来出错的输入验证。</p></section></main></div><script src="tutorial.js"></script></body></html>`;
await fs.mkdir('public/tutorial',{recursive:true});await fs.writeFile('public/tutorial/index.html',html);
