const item = (id, title, description, source, preview = '', after = '', files = '') => ({ id, title, description, source, preview, after, files });
const math = body => `<math xmlns="http://www.w3.org/1998/Math/MathML">${body}</math>`;
export const topics = [
  { id: 'headings', title: '标题、加粗与引用', intro: '标题用来区分章节，加粗用来标出重点。符号要用英文半角字符。', items: [
    item('heading-levels', '标题', '在一行的开头写 <code>#</code>，留一个空格，再写标题。一个 <code>#</code> 是一级标题，两个是二级标题，最多写六个。', '# 我的大学第一周\n\n## 本周课程\n\n### 高等数学', '<h1>我的大学第一周</h1><h2>本周课程</h2><h3>高等数学</h3>', '一级标题写整篇笔记的名称，二级标题写各个部分。标题下换一行就可以写正文；前后各空一行会更容易阅读。'),
    item('bold', '加粗', '把要加粗的文字放在两对星号中间。星号和文字之间不要留空格。', '明天交 **程序设计作业**。', '<p>明天交 <strong>程序设计作业</strong>。</p>', '<code>**重点**</code> 能加粗；<code>** 重点 **</code> 通常会把星号也显示出来。'),
    item('italic-strike', '斜体和删除线', '两边各一个星号是斜体，各两个波浪号是删除线。', '*Introduction to Algorithms*\n\n~~周三提交~~ 改为周五提交。', '<p><em>Introduction to Algorithms</em></p><p><del>周三提交</del> 改为周五提交。</p>'),
    item('quote', '引用', '在引用内容前写 <code>&gt;</code>，后面留一个空格。引用多段文字时，中间的空行也可以写一个 <code>&gt;</code>。', '> 学而不思则罔。\n>\n> 思而不学则殆。', '<blockquote><p>学而不思则罔。</p><p>思而不学则殆。</p></blockquote>'),
    item('horizontal-rule', '分隔线', '把三个减号单独放一行，前后各空一行。预览里会出现一条横线。', '上半部分。\n\n---\n\n下半部分。', '<p>上半部分。</p><hr><p>下半部分。</p>', '不要紧接着正文写一行 <code>---</code>，那种写法可能把上一行变成二级标题。'),
  ] },
  { id: 'breaks', title: '回车、空行与换行', intro: '编辑区里的回车和预览里的换行不是一回事。下面几段文字只改了行末的写法，可以直接比较效果。', items: [
    item('soft-break', '只按一次回车', '两行文字之间没有空行时，默认仍属于同一段。预览会根据宽度排版，不一定在你按回车的位置换行。', '今天学习 Markdown。\n明天整理课堂笔记。', '<p>今天学习 Markdown。 明天整理课堂笔记。</p>', '窗口变窄时，长句也会自动折到下一行。这只是显示宽度变了，并没有多出一个段落。'),
    item('paragraphs', '空一行：另起一段', '在两段文字中间留一个空行，也就是在第一段末尾连按两次回车。', '第一段。\n\n第二段。\n\n\n\n第三段。', '<p>第一段。</p><p>第二段。</p><p>第三段。</p>', '空一行和空三行都只是分段，通常不会让预览中的间距继续增加。'),
    item('two-spaces', '行末两个空格：在段内换行', '写完第一行，按两次空格，再按回车。下面行末标出的两个位置都是空格，复制按钮会保留它们。', '第一行。  \n第二行。', '<p>第一行。<br>第二行。</p>', '一个空格不够。这种换行仍在同一段里，所以两行之间没有新段落的间距。'),
    item('backslash-break', '行末反斜杠：另一种换行写法', '在第一行末尾写一个反斜杠 <code>&#92;</code>，然后按回车。它比看不见的行末空格更容易检查。', '第一行。\\\n第二行。', '<p>第一行。<br>第二行。</p>', '这里是反斜杠 <code>&#92;</code>，不是路径中常用的斜杠 <code>/</code>。'),
    item('html-break', '用 <br> 换行', '<code>&lt;br&gt;</code> 是 HTML 的换行标签。写到哪里，就从哪里换行；表格单元格内也能用。', '周一<br>高等数学\n\n周二<br><br>程序设计', '<p>周一<br>高等数学</p><p>周二<br><br>程序设计</p>', '连续写两个 <code>&lt;br&gt;</code> 会多空一行。普通正文分段直接留空行就可以。'),
    item('preview-breaks', '让普通回车也换行', '如果希望每次回车都在预览中换行，可以修改 VS Code 的预览设置。', 'markdown.preview.breaks', '', '打开设置，搜索上面的完整名称，勾选对应选项。本文的例子按默认关闭的效果展示；代码块里的换行不受这项设置影响。'),
  ] },
  { id: 'lists', title: '列表与缩进', intro: '一项写一行。标记后面要有空格；同一级的标记对齐。', items: [
    item('unordered', '无序列表', '在每一项前写减号和一个空格。加号、星号也可以作列表标记，一份列表里统一使用一种即可。', '- 阅读讲义\n- 整理笔记\n- 完成练习', '<ul><li>阅读讲义</li><li>整理笔记</li><li>完成练习</li></ul>'),
    item('ordered', '有序列表', '用数字、英文句点和空格开头。后面的序号由预览自动排列，所以源码也可以全写 <code>1.</code>。', '1. 打开网页\n1. 新建文件\n1. 观察预览', '<ol><li>打开网页</li><li>新建文件</li><li>观察预览</li></ol>', '第一项的数字决定起始编号。如果第一项写 <code>7.</code>，预览就从 7 开始。'),
    item('nested', '嵌套列表', '子项目在前面加四个空格。返回上一级时，去掉这四个空格，让标记和同级项目对齐。', '- 周一\n    - 高等数学\n    - 程序设计\n- 周二\n    1. 预习\n    2. 复习', '<ul><li>周一<ul><li>高等数学</li><li>程序设计</li></ul></li><li>周二<ol><li>预习</li><li>复习</li></ol></li></ul>', '这里的四个空格适用于这个示例。如果父项编号很长，子项还需要缩进到父项正文开始的位置之后。'),
    item('list-paragraph', '同一项里再写一段', '先空一行，再缩进到该项正文开始的位置。下面 <code>1. </code> 占三个字符，所以续写的段落前面留三个空格。', '1. 观察现象\n\n   先记录实际结果。\n\n2. 尝试修改\n\n   再用相同输入检查。', '<ol><li><p>观察现象</p><p>先记录实际结果。</p></li><li><p>尝试修改</p><p>再用相同输入检查。</p></li></ol>'),
    item('task-list', '任务列表', '<code>[ ]</code> 表示未完成，<code>[x]</code> 表示已完成。方括号里面的空格不能漏。', '- [ ] 阅读讲义\n- [x] 完成练习', '', 'GitHub 会把它们显示成复选框。本练习网页沿用 VS Code 原生 Markdown 预览，可能直接显示 <code>[ ]</code> 和 <code>[x]</code>；这不代表你写错了。'),
  ] },
  { id: 'paths', title: '链接、图片与路径', intro: '相对路径从当前这份 .md 文件所在的文件夹开始算。先确定笔记在哪里，再找链接或图片在哪里。', items: [
    item('web-link', '插入网页链接', '方括号里写显示的文字，小括号里写网址。注意括号都用英文符号。', '[南京大学](https://www.nju.edu.cn)', '<p><a href="https://www.nju.edu.cn" target="_blank" rel="noopener">南京大学</a></p>', '预览中会显示“南京大学”，点击后打开网址。直接在编辑区看时，括号和网址都会保留。'),
    item('file-link', '链接到另一份笔记', '如果当前笔记和 notes 文件夹放在一起，就用下面的路径打开 notes 里的文件。', '[打开笔记](./notes/链接目标.md)', '', '练习目录已经包含这份“链接目标.md”，可以直接试。链接到自己的文件时，把路径和文件名换成实际位置。'),
    item('image', '插入图片', '图片的写法比链接多一个感叹号。方括号里写图片说明，小括号里写图片地址。', '![山间日出](./assets/山间日出.svg)', '<img src="sunrise.svg" alt="山间日出" width="600" height="360" loading="lazy">', '这张图已经放在练习目录的 assets 文件夹里。如果用自己的图片，先通过“文件 → 导入本地文件…”把图片导入，再写它的实际路径。'),
    item('current-folder', '. 表示当前文件夹', '假设“我的笔记.md”和 assets 文件夹放在一起，文件结构如下。', '![山间日出](./assets/山间日出.svg)', '', '<code>./</code> 从当前文件夹开始，<code>assets/</code> 进入 assets，再找到图片。这里的 <code>./</code> 也可以省略，写成 <code>assets/山间日出.svg</code>。', 'Markdown/\n├── 我的笔记.md\n└── assets/\n    └── 山间日出.svg'),
    item('parent-folder', '.. 表示上一级文件夹', '如果笔记放在 notes 里面，就需要先退出 notes，再进入 assets。', '![山间日出](../assets/山间日出.svg)', '', '<code>../</code> 向上走一级，<code>../../</code> 向上走两级。路径里统一用 <code>/</code>，不要直接粘贴 Windows 的 <code>C:&#92;…</code> 地址。', 'Markdown/\n├── notes/\n│   └── 课堂笔记.md\n└── assets/\n    └── 山间日出.svg'),
  ] },
  { id: 'code', title: '行内代码与代码块', intro: 'Markdown 里的代码是用来展示的。要运行 Python，请打开 .py 文件，再启动调试。', items: [
    item('inline-code', '一句话里的代码', '把函数名、文件名或命令放在一对反引号中间。反引号通常在键盘 Esc 下方，和单引号不是同一个符号。', '用 `print()` 输出结果。\n\n把文件保存为 `notes.md`。', '<p>用 <code>print()</code> 输出结果。</p><p>把文件保存为 <code>notes.md</code>。</p>'),
    item('fenced-code', '多行代码', '第一行写三个反引号，再写语言名；最后另起一行，写三个反引号结束。代码按原来的缩进和换行显示。', '```python\nname = "南大"\nprint("你好，" + name)\n```', '<pre class="preview-code"><code><span class="syntax-name">name</span> = <span class="syntax-string">"南大"</span>\n<span class="syntax-call">print</span>(<span class="syntax-string">"你好，"</span> + name)</code></pre>', '<code>python</code> 用来选择代码配色，不会启动 Python。也可以写 <code>c</code>、<code>javascript</code>、<code>bash</code>；不写语言名也能显示代码块。'),
    item('literal-backtick', '在行内代码中显示反引号', '内容里已经有一个反引号时，外面用两个反引号包起来。', '``这里有一个 ` 符号``', '<p><code>这里有一个 ` 符号</code></p>'),
  ] },
  { id: 'table', title: '表格', intro: '竖线分隔列，一行代表一行内容。表头下面的分隔行不能漏。', items: [
    item('simple-table', '先写一个两列表格', '第一行写表头，第二行每列写三个减号，从第三行开始写数据。源码里的列宽不必完全对齐。', '| 课程 | 星期 |\n| --- | --- |\n| 高等数学 | 周一 |\n| 程序设计 | 周三 |', '<table><thead><tr><th>课程</th><th>星期</th></tr></thead><tbody><tr><td>高等数学</td><td>周一</td></tr><tr><td>程序设计</td><td>周三</td></tr></tbody></table>'),
    item('table-align', '设置列的对齐方式', '冒号在左边表示左对齐，两边都有表示居中，在右边表示右对齐。只改第二行，就能改变整列的对齐方式。', '| 课程 | 星期 | 学分 |\n| :--- | :---: | ---: |\n| 高数 | 一 | 5 |\n| 程设 | 三 | 4 |', '<table><thead><tr><th class="left">课程</th><th class="center">星期</th><th class="right">学分</th></tr></thead><tbody><tr><td class="left">高数</td><td class="center">一</td><td class="right">5</td></tr><tr><td class="left">程设</td><td class="center">三</td><td class="right">4</td></tr></tbody></table>'),
    item('table-content', '单元格里换行、写竖线', '单元格内换行用 <code>&lt;br&gt;</code>。如果内容本身需要竖线，在竖线前加反斜杠，避免它被当成分列标记。', '| 内容 | 写法 |\n| --- | --- |\n| 第一行<br>第二行 | 换行 |\n| A \\| B | 竖线 |', '<table><thead><tr><th>内容</th><th>写法</th></tr></thead><tbody><tr><td>第一行<br>第二行</td><td>换行</td></tr><tr><td>A | B</td><td>竖线</td></tr></tbody></table>'),
  ] },
  { id: 'math', title: '数学公式', intro: '这个练习网页支持 LaTeX 数学公式。一句话里的公式用一对 $，单独占一行的公式用两对 $$。', items: [
    item('inline-math', '行内公式', '把公式放在两个美元符号中间。开头的 <code>$</code> 后、结尾的 <code>$</code> 前都不要留空格。', '面积为 $S=\\pi r^2$。', `<p>面积为 ${math('<mi>S</mi><mo>=</mo><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup>')}。</p>`),
    item('display-math', '独立公式', '开始和结束各用一行 <code>$$</code>，中间写公式，整块前后各空一行。', '求和公式：\n\n$$\n\\sum_{i=1}^{n} i=\\frac{n(n+1)}{2}\n$$', `<p>求和公式：</p><div class="display-math">${math('<munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>i</mi><mo>=</mo><mfrac><mrow><mi>n</mi><mo>(</mo><mi>n</mi><mo>+</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></mfrac>')}</div>`),
    item('subscript', '上下标和花括号', '<code>_</code> 是下标，<code>^</code> 是上标。上标或下标有多个字符时，用花括号括住。', '$x_i^2$\n\n$x_{ij}^{10}$', `<p>${math('<msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup>')}</p><p>${math('<msubsup><mi>x</mi><mrow><mi>i</mi><mi>j</mi></mrow><mn>10</mn></msubsup>')}</p>`, '<code>x^10</code> 只会把 1 放到上标里，0 仍在后面。要写 10 次方，用 <code>x^{10}</code>。'),
    item('fraction-root', '分数和根号', '<code>&#92;frac</code> 后面的第一组花括号放分子，第二组放分母；<code>&#92;sqrt</code> 后的花括号放被开方的内容。', '$\\frac{a+b}{c}$\n\n$\\sqrt{x+1}$', `<p>${math('<mfrac><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mi>c</mi></mfrac>')}</p><p>${math('<msqrt><mi>x</mi><mo>+</mo><mn>1</mn></msqrt>')}</p>`),
    item('greek', '希腊字母和常用符号', '这些命令以反斜杠开头。字母名称的大小写会影响结果。', '$\\alpha + \\beta$\n\n$x \\leq 5$\n\n$a \\times b$\n\n$\\infty$', `<p>${math('<mi>α</mi><mo>+</mo><mi>β</mi>')}</p><p>${math('<mi>x</mi><mo>≤</mo><mn>5</mn>')}</p><p>${math('<mi>a</mi><mo>×</mo><mi>b</mi>')}</p><p>${math('<mi>∞</mi>')}</p>`, '公式显示不出来时，先检查美元符号、反斜杠和花括号是否完整。'),
  ] },
  { id: 'mermaid', title: '流程图', intro: '在标记为 mermaid 的代码块里写步骤和连线，预览会画成图。', items: [
    item('flowchart', '画三个相连的步骤', '<code>flowchart TD</code> 表示从上到下画。A、B、C 是节点名称；方括号里的文字显示在方框中；箭头连接两个节点。', '```mermaid\nflowchart TD\n    A[观察问题] --> B[提出猜想]\n    B --> C[动手验证]\n```', '<div class="flow" role="img" aria-label="观察问题，接着提出猜想，最后动手验证"><div>观察问题</div><span aria-hidden="true">↓</span><div>提出猜想</div><span aria-hidden="true">↓</span><div>动手验证</div></div>', '把 <code>TD</code> 改成 <code>LR</code>，图就会从左到右排列。代码块开头必须写 <code>mermaid</code>，写成 <code>python</code> 或不写，就只会显示代码。'),
    item('flow-branch', '加入判断分支', '判断节点用花括号。两条连线后面分别写条件，让读者知道沿哪条线继续。', '```mermaid\nflowchart TD\n    A{结果正确吗} -->|是| B[结束]\n    A -->|否| C[检查代码]\n    C --> A\n```', '', '同一个节点名称会指向同一个节点。最后一行 <code>C --&gt; A</code> 把“检查代码”连回前面的判断。'),
  ] },
  { id: 'html', title: '折叠、注释与转义', intro: '折叠和注释用到少量 HTML。照着下面的完整写法输入，并保留开始与结束标签。', items: [
    item('details', '折叠一段内容', '<code>&lt;details&gt;</code> 是整个折叠区域的开始，<code>&lt;/details&gt;</code> 是结束。<code>&lt;summary&gt;</code> 和 <code>&lt;/summary&gt;</code> 中间写可以点击的标题。', '<details>\n<summary>查看答案</summary>\n\n答案是 **15**。\n\n</details>', '<details><summary>查看答案</summary><p>答案是 <strong>15</strong>。</p></details>', '标题后空一行再写正文，正文和结束标签之间也空一行，这样正文中的加粗、列表等 Markdown 写法才能正常解析。点右侧“查看答案”可以试一下。'),
    item('comments', '在源码中留备注', '把备注放进 <code>&lt;!--</code> 和 <code>--&gt;</code> 之间，预览中不会显示这部分文字。', '这段文字会显示。\n\n<!-- 这里留给自己做备注 -->', '<p>这段文字会显示。</p>', '备注仍然保存在 .md 文件里。把源文件发给别人时，对方也能看到备注。'),
    item('escape', '让符号按原样显示', '如果希望星号、井号直接显示出来，而不是参与排版，在符号前加反斜杠。', '\\*\\*重点\\*\\*\n\n\\# 这不是标题', '<p>**重点**</p><p># 这不是标题</p>', '展示整段语法时，行内代码或代码块通常更方便，不需要逐个转义符号。'),
  ] },
];
