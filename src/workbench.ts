import { initialize, getService, IEditorService, IWorkbenchLayoutService, LogLevel } from '@codingame/monaco-vscode-api';
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri';
import { registerExtension, ExtensionHostKind } from '@codingame/monaco-vscode-api/extensions';
import 'vscode/localExtensionHost';
import getWorkbenchServiceOverride, { Parts } from '@codingame/monaco-vscode-workbench-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override/common';
import getExtensionsServiceOverride from '@codingame/monaco-vscode-extensions-service-override';
import { createIndexedDBProviders, IndexedDB, IndexedDBFileSystemProvider, registerFileSystemOverlay, initFile } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride, { initUserKeybindings } from '@codingame/monaco-vscode-keybindings-service-override';
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override';
import getNotificationsServiceOverride from '@codingame/monaco-vscode-notifications-service-override';
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getWorkingCopyServiceOverride from '@codingame/monaco-vscode-working-copy-service-override';
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override';
import getSnippetsServiceOverride from '@codingame/monaco-vscode-snippets-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getQuickaccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override';
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override';
import getAccessibilityServiceOverride from '@codingame/monaco-vscode-accessibility-service-override';
import getBulkEditServiceOverride from '@codingame/monaco-vscode-bulk-edit-service-override';
import editorWorkerUrl from 'monaco-editor/esm/vs/editor/editor.worker.js?worker&url';
import extensionWorkerUrl from '@codingame/monaco-vscode-api/workers/extensionHost.worker?worker&url';
import textmateWorkerUrl from '@codingame/monaco-vscode-textmate-service-override/worker?worker&url';
import searchWorkerUrl from '@codingame/monaco-vscode-search-service-override/worker?worker&url';
import '@codingame/monaco-vscode-all-language-default-extensions';
import '@codingame/monaco-vscode-markdown-language-features-default-extension';
import '@codingame/monaco-vscode-markdown-math-default-extension';
import '@codingame/monaco-vscode-mermaid-markdown-features-default-extension';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-theme-seti-default-extension';
import { installFileCommands } from './file-commands';
import './style.css';

const workerUrls: Record<string, string> = {
  editorWorkerService: editorWorkerUrl,
  extensionHostWorkerMain: extensionWorkerUrl,
  TextMateWorker: textmateWorkerUrl,
  LocalFileSearchWorker: searchWorkerUrl,
};
(window as any).MonacoEnvironment = {
  getWorkerUrl: (_: string, label: string) => workerUrls[label],
  getWorkerOptions: () => ({ type: 'module' }),
};

await createIndexedDBProviders();
const database = await IndexedDB.create('markdown-studio-files-v1', 1, ['files']);
const filesystem = new IndexedDBFileSystemProvider('file', database, 'files', true);
registerFileSystemOverlay(10, filesystem);
const root = URI.file('/Markdown');
const welcome = URI.joinPath(root, 'Markdown 语法大全.md');
const examples = import.meta.glob<string>('./example/**/*', { query: '?raw', import: 'default', eager: true });
const marker = URI.file('/.markdown-studio-seeded');
let firstVisit = false;
try { await filesystem.stat(marker); } catch { firstVisit = true; }
if (firstVisit) {
  await filesystem.mkdir(root);
  for (const [path, text] of Object.entries(examples)) {
    const relative = path.replace('./example/', '');
    const parts = relative.split('/');
    for (let i = 1; i < parts.length; i++) {
      await filesystem.mkdir(URI.joinPath(root, ...parts.slice(0, i)));
    }
    await initFile(URI.joinPath(root, relative), text);
  }
  await initFile(marker, '1');
}

await initUserConfiguration(JSON.stringify({
  'workbench.colorTheme': 'Default Dark Modern',
  'workbench.iconTheme': 'vs-seti',
  'workbench.startupEditor': 'none',
  'workbench.editor.enablePreview': false,
  'workbench.editor.empty.hint': 'hidden',
  'workbench.secondarySideBar.defaultVisibility': 'hidden',
  'workbench.activityBar.location': 'default',
  'window.menuBarVisibility': 'classic',
  'window.commandCenter': false,
  'window.title': '${activeEditorShort}${separator}Markdown',
  'editor.fontSize': 14,
  'editor.fontFamily': "Consolas, 'Cascadia Code', 'Microsoft YaHei', monospace",
  'editor.minimap.enabled': false,
  'editor.wordWrap': 'on',
  'editor.unicodeHighlight.ambiguousCharacters': false,
  'editor.unicodeHighlight.nonBasicASCII': false,
  'editor.stickyScroll.enabled': true,
  'editor.quickSuggestions': { other: true, comments: false, strings: false },
  'breadcrumbs.enabled': true,
  'files.autoSave': 'afterDelay',
  'files.autoSaveDelay': 600,
  'files.hotExit': 'onExitAndWindowClose',
  'files.defaultLanguage': 'markdown',
  'explorer.confirmDelete': true,
  'explorer.confirmDragAndDrop': false,
  'security.workspace.trust.enabled': false,
  'markdown.preview.scrollPreviewWithEditor': true,
  'markdown.preview.scrollEditorWithPreview': true,
  'markdown.preview.doubleClickToSwitchToEditor': true,
  'markdown.updateLinksOnFileMove.enabled': 'always',
  'markdown.math.enabled': true,
  'chat.disableAIFeatures': true,
  'telemetry.telemetryLevel': 'off',
  'outline.showVariables': false,
}));
await initUserKeybindings(JSON.stringify([
  { key: 'ctrl+n', mac: 'cmd+n', command: 'markdownLab.newFile' },
  { key: 'ctrl+o', mac: 'cmd+o', command: 'markdownLab.importFiles' },
  { key: 'ctrl+shift+s', mac: 'cmd+shift+s', command: 'markdownLab.downloadFile' },
]));

const localExtension = registerExtension({
  name: 'markdown-studio', publisher: 'markdown-lab', version: '1.0.0',
  engines: { vscode: '*' },
  contributes: {
    customEditors: [{
      viewType: 'markdownLab.imagePreview', displayName: '图片预览', priority: 'default',
      selector: [{ filenamePattern: '*.{svg,png,jpg,jpeg,gif,webp,avif,bmp,ico}' }],
    }],
    commands: [
      { command: 'markdownLab.newFile', title: '新建 Markdown 文件', icon: '$(new-file)' },
      { command: 'markdownLab.importFiles', title: '导入本地文件…', icon: '$(folder-opened)' },
      { command: 'markdownLab.importFolder', title: '导入本地文件夹…', icon: '$(folder-opened)' },
      { command: 'markdownLab.downloadFile', title: '下载当前文件', icon: '$(cloud-download)' },
      { command: 'markdownLab.downloadWorkspace', title: '下载整个练习目录（ZIP）', icon: '$(desktop-download)' },
      { command: 'markdownLab.openExample', title: 'Markdown: 打开语法大全', icon: '$(book)' },
    ],
    menus: {
      'editor/title': [
        { command: 'markdownLab.downloadFile', when: "resourceScheme == file", group: 'navigation@20' },
      ],
      'view/title': [
        { command: 'markdownLab.importFiles', when: "view == workbench.explorer.fileView", group: 'navigation@20' },
      ],
      'explorer/context': [
        { command: 'markdownLab.importFiles', when: 'explorerResourceIsFolder', group: '2_workspace@1' },
        { command: 'markdownLab.downloadFile', when: '!explorerResourceIsFolder', group: '2_workspace@2' },
      ],
    },
  },
}, ExtensionHostKind.LocalProcess);

await initialize({
  ...getExtensionsServiceOverride({ enableWorkerExtensionHost: true, iframeAlternateDomain: location.origin + '/' }),
  ...getModelServiceOverride(), ...getConfigurationServiceOverride(),
  ...getKeybindingsServiceOverride(), ...getNotificationsServiceOverride(),
  ...getDialogsServiceOverride(), ...getTextmateServiceOverride(),
  ...getThemeServiceOverride(), ...getLanguagesServiceOverride(),
  ...getPreferencesServiceOverride(),
  ...getStorageServiceOverride({ fallbackOverride: { 'workbench.activity.showAccounts': false } }),
  ...getLifecycleServiceOverride(), ...getWorkingCopyServiceOverride(),
  ...getOutlineServiceOverride(), ...getSnippetsServiceOverride(),
  ...getSearchServiceOverride(), ...getExplorerServiceOverride(),
  ...getQuickaccessServiceOverride({ shouldUseGlobalPicker: () => true, isKeybindingConfigurationVisible: () => true }),
  ...getMarkersServiceOverride(), ...getAccessibilityServiceOverride(),
  ...getBulkEditServiceOverride(), ...getTitleBarServiceOverride(),
  ...getWorkbenchServiceOverride(undefined, location.origin + '/'),
}, document.getElementById('workbench')!, {
  workspaceProvider: { workspace: { folderUri: root }, trusted: true, open: async () => false },
  productConfiguration: { nameShort: 'Markdown', nameLong: 'Markdown Studio', applicationName: 'markdown-studio' },
  configurationDefaults: { 'workbench.startupEditor': 'none' },
  developmentOptions: { logLevel: LogLevel.Warning },
  defaultLayout: { editors: [{ uri: welcome }], views: [{ id: 'workbench.explorer.fileView' }] },
}, { userHome: URI.file('/') });

await localExtension.setAsDefaultApi();
const api = await localExtension.getApi();
installFileCommands(api, root, welcome);
const editorService = await getService(IEditorService);
if (!editorService.activeEditor) await api.window.showTextDocument(welcome);
if (firstVisit) {
  const layout = await getService(IWorkbenchLayoutService);
  layout.setSize(Parts.SIDEBAR_PART, { ...layout.getSize(Parts.SIDEBAR_PART), width: Math.min(240, window.innerWidth * 0.23) });
  await api.commands.executeCommand('markdown.showPreviewToSide', welcome);
  await api.commands.executeCommand('workbench.action.focusFirstEditorGroup');
}
document.getElementById('loading')?.remove();

// Read-only diagnostics are also useful when checking a published build.
document.documentElement.dataset.ready = 'true';
