# Markdown Studio

给还没安装 VS Code 的同学使用的 Markdown 与 Python 调试工作台。

**在线体验：https://wangyixiang666.github.io/markdown-studio/**

直接运行 VS Code 的工作台、编辑器和内置 Markdown Web 扩展，通过 CodinGame 的 `monaco-vscode-api` 在静态网站中集成。不是重新实现一套相似的 Markdown 解析器。

## 课堂学习

- [Markdown 与断点调试图文教程](https://wangyixiang666.github.io/markdown-studio/tutorial/)
- [课堂任务与检查清单](https://wangyixiang666.github.io/markdown-studio/tutorial/#exercise)
- [GitHub 任务列表的显示效果](docs/任务列表示例.md)

## 功能

- VS Code 中文界面、原生主题、资源管理器、标签页、拆分编辑器、大纲与命令面板。
- 原生 Markdown 编辑、TextMate 高亮、补全、标题导航、重命名、链接检查与查找替换。
- 原生 Markdown 预览、同步滚动、双击回到源码、锁定预览、跨文件链接。
- 内置数学扩展与 Mermaid 扩展；所有内置语言的代码围栏高亮。
- 本地文件与文件夹导入、图片查看、文件下载与完整目录 ZIP 导出。
- IndexedDB 保存工作区，自动保存编辑内容；刷新恢复布局和文件。
- 自带 `src/example` 目录，包含语法演示、本地 SVG 图片、附属文档、CSV 和 JSON。
- 五份适合大一新生的 Python 调试练习：循环边界、条件边界、函数参数、列表共享和越界异常。
- 原生 VS Code 调试界面：断点、条件断点、命中次数、日志点、单步进入/跳过/跳出、变量、监视、调用堆栈、表达式求值和修改变量。
- Python 通过本地托管的 Pyodide 在 Web Worker 中真实运行，调试适配器使用 CPython 执行帧与 VS Code DAP，不是预录制的调试演示。

网页保留浏览器允许的编辑和预览操作。浏览器可能占用某些快捷键，命令面板与菜单提供对应操作。磁盘文件通过导入和下载读写；`Ctrl+S` 保存到浏览器工作区。清除网站数据会移除工作区，请用 ZIP 导出保留副本。需要桌面扩展、外部进程或 Copilot 的功能不在此静态网站中提供。

## 版本与来源

- 集成包：`@codingame/monaco-vscode-*` **39.0.4**，锁文件固定依赖。
- 包内 VS Code 源版本：**1.145.2**，commit `c4453f8ea430795f941c1b2ff6c9321135a74a02`。
- 解析与预览：`vscode.markdown-language-features` **10.0.0**；保留原扩展的解析器、预览脚本和 CSS。
- 公式：`vscode.markdown-math`；图表：`vscode.mermaid-markdown-features`。
- Python：Pyodide **314.0.8**，自有教学 DAP 适配器。支持基础 Python 和内置标准库，不提供系统终端、任意 pip 包、C/C++ 编译或桌面 Python 扩展。
- 工作台集成：[CodinGame/monaco-vscode-api](https://github.com/CodinGame/monaco-vscode-api)。
- 功能参考：[VS Code Markdown 文档](https://code.visualstudio.com/docs/languages/markdown)。

这是独立教学项目，不是 Microsoft 的官方站点。

## 本地构建

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run preview
```

发布版本预览在 `http://127.0.0.1:4173/`。首次访问会注册站点范围内的 Service Worker 并刷新一次，为 GitHub Pages 上的扩展宿主提供 COOP/COEP 响应头。预览 Webview 使用 VS Code 自己的隔离与资源加载逻辑。

`scripts/patch-dependencies.mjs` 修正集成库 39.0.4 的搜索索引启动竞态：首次搜索等待已有的初始化完成。该补丁不修改 Markdown 解析器。依赖升级时会检查补丁能否适用。

`npm test` 使用真实 Pyodide 执行程序，检查单步操作、栈帧、变量、表达式求值、修改变量、条件断点、命中次数、日志点、异常暂停，以及全部练习与参考答案。调试运行采用启动时的文件快照；编辑后需重新开始。调试时暂停的 Python Worker 使用 SharedArrayBuffer，因此需要支持跨源隔离的现代桌面浏览器，并在独立标签页访问本站。

推送到 `main` 后，GitHub Actions 构建并发布到 GitHub Pages。GitHub Pages 的发布源须设为 GitHub Actions。

## 许可证

项目代码与示例采用 MIT 许可证。VS Code 源码与 CodinGame 集成库采用 MIT 许可证；第三方库保留各自许可证。`THIRD_PARTY_NOTICES.md` 记录主要来源。
