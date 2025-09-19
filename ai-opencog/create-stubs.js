const fs = require('fs');
const path = require('path');

// Create stub directories
const dirs = [
  'node_modules/@theia/core/shared',
  'node_modules/@theia/core/lib/common',
  'node_modules/@theia/editor/lib/browser',
  'node_modules/@theia/filesystem/lib/common',
  'node_modules/@theia/filesystem/lib/browser',
  'node_modules/@theia/monaco/lib/browser',
  'node_modules/@theia/workspace/lib/browser',
  'node_modules/@theia/variable-resolver/lib',
  'node_modules/@theia/navigator/lib/browser',
  'node_modules/@theia/terminal/lib/browser/base',
  'node_modules/@theia/task/lib/browser',
  'node_modules/@theia/task/lib/common',
  'node_modules/@theia/debug/lib/browser',
  'node_modules/@theia/debug/lib/common',
  'node_modules/@theia/ai-chat/lib',
  'node_modules/@theia/ai-core/lib',
  'node_modules/@theia/core/lib/browser/preferences',
  'node_modules/@theia/monaco-editor-core'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Create comprehensive stub files
const stubs = {
  'node_modules/@theia/core/shared/inversify.d.ts': `
export declare function injectable<T>(): (target: T) => T;
export declare function inject(token: any): any;
export declare class Container {
  get(token: any): any;
  bind(token: any): any;
}
export declare class ContainerModule {
  constructor(callback: (bind: any) => void);
}
`,
  'node_modules/@theia/core/lib/common/disposable.d.ts': `
export interface Disposable {
  dispose(): void;
}
export class DisposableCollection implements Disposable {
  push(...disposables: Disposable[]): void;
  dispose(): void;
}
`,
  'node_modules/@theia/editor/lib/browser/editor-manager.d.ts': `
export class EditorManager {
  onCreated: any;
  onCurrentEditorChanged: any;
  all: any[];
  open: any;
}
`,
  'node_modules/@theia/navigator/lib/browser/navigator-contribution.d.ts': `
export class NavigatorContribution {}
`,
  'node_modules/@theia/terminal/lib/browser/base/terminal-service.d.ts': `
export class TerminalService {
  onDidCreateTerminal: any;
  onDidChangeActiveTerminal: any;
}
`,
  'node_modules/@theia/task/lib/browser/task-service.d.ts': `
export class TaskService {
  onDidStartTask: any;
  onDidEndTask: any;
  run: any;
  getTasks: any;
}
`,
  'node_modules/@theia/debug/lib/browser/debug-service.d.ts': `
export class DebugService {
  onDidStartDebugSession: any;
  onDidTerminateDebugSession: any;
  start: any;
}
`,
  'node_modules/@theia/filesystem/lib/browser/file-service.d.ts': `
export class FileService {
  resolve: any;
  read: any;
  write: any;
}
`,
  'node_modules/@theia/monaco/lib/browser/monaco-editor.d.ts': `
export class MonacoEditor {
  onCursorPositionChanged: any;
  onSelectionChanged: any;
  onDocumentContentChanged: any;
  getControl: any;
}
`,
  'node_modules/@theia/workspace/lib/browser/workspace-service.d.ts': `
export class Workspace {
  readonly roots: any[];
}
`,
  'node_modules/@theia/core/lib/common/uri.d.ts': `
declare class URI {
  static parse(value: string): URI;
  toString(): string;
}
export default URI;
`,
  'node_modules/@theia/monaco-editor-core/index.d.ts': `
declare namespace monaco {
  namespace editor {
    const createModel: any;
  }
  namespace languages {
    const registerCodeActionProvider: any;
  }
}
export = monaco;
`,
  'node_modules/@theia/core/lib/browser/preferences/preference-service.d.ts': `
export class PreferenceService {
  set: any;
  get: any;
}
`,
  'node_modules/@theia/task/lib/common/task-protocol.d.ts': `
export interface TaskConfiguration {
  label: string;
  type: string;
  [key: string]: any;
}
`,
  'node_modules/@theia/debug/lib/common/debug-common.d.ts': `
export interface DebugConfiguration {
  type: string;
  request: string;
  name: string;
  [key: string]: any;
}
`,
};

Object.entries(stubs).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
});

console.log('Stub files created successfully');
