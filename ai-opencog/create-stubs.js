const fs = require('fs');
const path = require('path');

// Create stub directories
const dirs = [
  'node_modules/@theia/core/shared',
  'node_modules/@theia/core/lib/common',
  'node_modules/@theia/editor/lib/browser',
  'node_modules/@theia/filesystem/lib/common',
  'node_modules/@theia/monaco/lib/browser',
  'node_modules/@theia/workspace/lib/browser',
  'node_modules/@theia/variable-resolver/lib',
  'node_modules/@theia/navigator/lib/browser',
  'node_modules/@theia/terminal/lib/browser/base',
  'node_modules/@theia/task/lib/browser',
  'node_modules/@theia/debug/lib/browser',
  'node_modules/@theia/ai-chat/lib',
  'node_modules/@theia/ai-core/lib'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Create comprehensive stub files
const stubs = {
  'node_modules/@theia/core/shared/inversify.d.ts': `
export declare function injectable(): <T>(target: T) => T;
export declare function inject(token: any): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => void;
export const Container: any;
export const ContainerModule: any;
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
}
`,
  'node_modules/@theia/debug/lib/browser/debug-service.d.ts': `
export class DebugService {
  onDidStartDebugSession: any;
  onDidTerminateDebugSession: any;
}
`
};

Object.entries(stubs).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
});

console.log('Stub files created successfully');
