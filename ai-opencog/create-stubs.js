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
  'node_modules/@theia/ai-chat/lib/common',
  'node_modules/@theia/ai-core',
  'node_modules/@theia/ai-core/lib',
  'node_modules/@theia/ai-core/lib/common',
  'node_modules/@theia/core/lib/browser/preferences',
  'node_modules/@theia/core/lib/browser',
  'node_modules/@theia/core/lib/common',
  'node_modules/@theia/core',
  'node_modules/@theia/monaco-editor-core',
  'node_modules/react',
  'node_modules/@types/react'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Create comprehensive stub files
const stubs = {
  'node_modules/@theia/core/shared/inversify.d.ts': `
export declare function injectable<T>(): (target: T) => T;
export declare function inject(token: any): any;
export declare function named(name: string): any;
export declare function postConstruct(): any;
export declare class Container {
  get(token: any): any;
  bind(token: any): any;
}
export declare class ContainerModule {
  constructor(callback: (bind: any) => void);
}
`,
  'node_modules/@theia/core/lib/common/messaging.d.ts': `
export class ConnectionHandler {}
export class RpcConnectionHandler extends ConnectionHandler {
  constructor(path: string, factory: () => any);
}
`,
  'node_modules/@theia/ai-core/lib/common/agent.d.ts': `
export interface Agent {
  id: string;
  name: string;
}
`,
  'node_modules/@theia/ai-chat/lib/common/chat-agents.d.ts': `
export interface ChatAgent {
  id: string;
  name: string;
  invoke: any;
}
`,
  'node_modules/@theia/ai-core/lib/common/agent-service.d.ts': `
export class AgentService {
  getAgents(): any[];
  registerAgent(agent: any): void;
}
`,
  'node_modules/@theia/workspace/lib/browser/index.d.ts': `
export class WorkspaceService {
  workspace: any;
  roots: any[];
}
`,
  'node_modules/@theia/core/lib/browser/widget-manager.d.ts': `
export class WidgetManager {
  findWidgets(name: string): any[];
}
`,
  'node_modules/@theia/core/index.d.ts': `
export class MessageService {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
export class Agent {
  constructor(...args: any[]);
  [key: string]: any;
}
export interface LanguageModelRequirement {
  [key: string]: any;
}
export interface PromptVariantSet {
  [key: string]: any;
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
  getModel(): any;
}
`,
  'node_modules/@theia/filesystem/lib/browser/file-service.d.ts': `
export class FileService {
  resolve: any;
  read: any;
  write: any;
  onDidFilesChange: any;
}
`,
  'node_modules/@theia/monaco/lib/browser/monaco-editor.d.ts': `
export class MonacoEditor {
  onCursorPositionChanged: any;
  onSelectionChanged: any;
  onDocumentContentChanged: any;
  onDispose: any;
  getControl: any;
}
`,
  'node_modules/@theia/workspace/lib/browser/workspace-service.d.ts': `
export class Workspace {
  readonly roots: any[];
  tryGetRoots(): any[];
}
export class WorkspaceService {
  workspace: any;
  roots: any[];
  readFile(uri: any): Promise<string>;
}
`,
  'node_modules/@theia/core/lib/common/uri.d.ts': `
declare class URI {
  static parse(value: string): URI;
  constructor(value?: string);
  toString(): string;
}
export default URI;
`,
  'node_modules/@theia/monaco-editor-core/index.d.ts': `
declare namespace monaco {
  namespace editor {
    const createModel: any;
    const setModelMarkers: any;
    interface ITextModel {
      [key: string]: any;
    }
    interface IMarkerData {
      severity: any;
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      message: string;
    }
  }
  namespace languages {
    const registerCodeActionProvider: any;
    const registerCompletionItemProvider: any;
    const registerHoverProvider: any;
    interface CodeAction {
      title: string;
      kind?: string;
      edit?: any;
    }
  }
  class Range {
    constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
  }
  enum MarkerSeverity {
    Error = 8,
    Warning = 4,
    Info = 2,
    Hint = 1
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
  'node_modules/@theia/ai-core/index.d.ts': `
export declare class Agent {
  constructor(...args: any[]);
  [key: string]: any;
}
export const Agent: any;
export interface LanguageModelRequirement {
  [key: string]: any;
}
export interface PromptVariantSet {
  [key: string]: any;
}
`,
  'node_modules/@theia/core/lib/common/rpc-proxy.d.ts': `
export interface RpcProxy<T> extends T {
}
export class RpcProxyImpl<T> implements RpcProxy<T> {
  constructor(target: T, connectionProvider: any);
}
`,
  'node_modules/@theia/core/lib/browser/index.d.ts': `
export interface FrontendApplicationContribution {
  initialize?(): void;
  configure?(app: any): void;
}
export interface WidgetFactory {
  createWidget(options?: any): any;
}
export class BaseWidget {
  id: string;
  title: any;
  node: HTMLElement;
  update(): void;
  focus(): void;
}
export const codicon: any;
export class Message {
  constructor(...args: any[]);
}
`,
  'node_modules/@theia/core/lib/common/nls.d.ts': `
export const nls: any;
export function localize(key: string, defaultValue: string, ...args: any[]): string;
`,
  'node_modules/@theia/core/shared/react.d.ts': `
export * from 'react';
`,
  'node_modules/@theia/core/lib/common/index.d.ts': `
export interface CommandContribution {
  registerCommands(registry: any): void;
}
export interface MenuContribution {
  registerMenus(menus: any): void;
}
`,
  'node_modules/@theia/core/lib/common/logger.d.ts': `
export interface ILogger {
  log(level: string, message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}
export class Logger implements ILogger {
  log(level: string, message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}
export const ILogger: symbol;
`,
  'node_modules/@theia/core/lib/common/event.d.ts': `
export class Emitter<T> {
  readonly event: any;
  fire(event: T): void;
  dispose(): void;
}
export interface Event<T> {
  (listener: (e: T) => any): any;
}
`,
  'node_modules/react/index.d.ts': `
import * as React from 'react';
export = React;
export as namespace React;
declare namespace React {
  interface Component<P = {}, S = {}> {
    render(): any;
  }
  interface ComponentClass<P = {}> {
    new (props: P): Component<P, any>;
  }
  function createElement(type: any, props?: any, ...children: any[]): any;
  const Fragment: any;
}
`,
  'node_modules/@types/react/index.d.ts': `
declare module 'react' {
  interface Component<P = {}, S = {}> {
    render(): any;
  }
  interface ComponentClass<P = {}> {
    new (props: P): Component<P, any>;
  }
  function createElement(type: any, props?: any, ...children: any[]): any;
  const Fragment: any;
}
`
};

Object.entries(stubs).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
});

console.log('Stub files created successfully');
