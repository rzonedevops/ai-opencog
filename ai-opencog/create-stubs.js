const fs = require('fs');
const path = require('path');

// Create stub directories
const dirs = [
  'node_modules/@theia/core/shared',
  'node_modules/@theia/core/lib/common',
  'node_modules/@theia/core/lib/browser/widgets',
  'node_modules/@theia/editor/lib/browser',
  'node_modules/@theia/filesystem/lib/common',
  'node_modules/@theia/filesystem/lib/browser',
  'node_modules/@theia/monaco/lib/browser',
  'node_modules/@theia/workspace/lib/browser',
  'node_modules/@theia/workspace/lib/common',
  'node_modules/@theia/variable-resolver/lib',
  'node_modules/@theia/variable-resolver/lib/browser',
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
  'node_modules/@theia/monaco-editor-core/esm/vs/editor/common',
  'node_modules/@theia/monaco-editor-core/esm/vs/editor/common/core',
  'node_modules/react',
  'node_modules/@types/react'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Ensure @types/node directory exists and create comprehensive Node.js types
fs.mkdirSync('node_modules/@types/node', { recursive: true });
fs.writeFileSync('node_modules/@types/node/index.d.ts', `
declare var process: NodeJS.Process;
declare var Buffer: BufferConstructor;
declare var __dirname: string;
declare var __filename: string;
declare var require: NodeRequire;
declare var module: NodeModule;
declare var exports: any;
declare var global: NodeJS.Global;
declare var console: Console;

declare namespace NodeJS {
  interface Process {
    platform: string;
    env: ProcessEnv;
    cwd(): string;
    [key: string]: any;
  }
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
  interface Global {
    [key: string]: any;
  }
  interface Timeout {
    ref(): this;
    unref(): this;
  }
  interface Timer extends Timeout {}
  interface CpuUsage {
    user: number;
    system: number;
  }
}

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
declare function clearTimeout(timeoutId: NodeJS.Timeout): void;
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
declare function clearInterval(intervalId: NodeJS.Timeout): void;

interface NodeRequire {
  (id: string): any;
}

interface NodeModule {
  exports: any;
}

interface BufferConstructor {
  from(str: string, encoding?: string): Buffer;
  alloc(size: number): Buffer;
}

interface Buffer {
  toString(encoding?: string): string;
  length: number;
}

declare module "crypto" {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string): any;
}
`);

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Create comprehensive stub files
const stubs = {
  'node_modules/@theia/core/shared/inversify.d.ts': `
export declare function injectable<T>(): (target: T) => T;
export declare function inject(token: any): any;
export declare function named(name: string): any;
export declare function postConstruct(): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
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
  description?: string;
  variables?: string[];
  prompts?: any[];
  functions?: string[];
  languageModelRequirements?: LanguageModelRequirement[];
  agentSpecificVariables?: any[];
}
export interface LanguageModelRequirement {
  purpose: string;
  identifier: string;
  [key: string]: any;
}
export { LanguageModelRequirement };
`,
  'node_modules/@theia/ai-chat/lib/common/chat-agents.d.ts': `
export interface ChatAgent {
  id: string;
  name: string;
  invoke: any;
}
export abstract class AbstractStreamParsingChatAgent implements ChatAgent {
  readonly id: string;
  readonly name: string;
  readonly description: string;
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
  pushAll(...disposables: Disposable[]): void;
  push(disposable: Disposable): Disposable;
  dispose(): void;
}
`,
  'node_modules/@theia/core/lib/browser/widgets.d.ts': `
export const codicon: any;
export class BaseWidget {
  constructor();
  id: string;
  title: any;
  node: HTMLElement;
  onActivateRequest(msg?: any): void;
  update(): void;
  dispose(): void;
}
export class Widget {
  id: string;
  title: any;
  node: HTMLElement;
  update(): void;
}
export interface WidgetManager {
  getWidgets(name: string): any[];
  getWidget(name: string): any;
  activateWidget(name: string): Promise<any>;
}
`,
  'node_modules/@theia/core/lib/common/command.d.ts': `
export interface Command {
  id: string;
  category?: string;
  label?: string;
}
export interface CommandHandler {
  execute?(...args: any[]): any;
  isEnabled?(...args: any[]): boolean;
  isVisible?(...args: any[]): boolean;
}
export class CommandRegistry {
  registerCommand(command: Command, handler?: CommandHandler): any;
  registerHandler(id: string, handler: CommandHandler): any;
}
export namespace Command {
  export function toLocalizedCommand(command: Command, key?: string): Command;
  export function toDefaultLocalizedCommand(command: Command): Command;
}
`,
  'node_modules/@theia/editor/lib/browser/editor-manager.d.ts': `
export class EditorManager {
  onCreated: any;
  onCurrentEditorChanged: any;
  onActiveEditorChanged: any;
  all: any[];
  open: any;
  activeEditor: any;
  currentEditor: any;
}
`,
  'node_modules/@theia/editor/lib/browser/index.d.ts': `
export class EditorManager {
  onCreated: any;
  onCurrentEditorChanged: any;
  onActiveEditorChanged: any;
  all: any[];
  open: any;
  activeEditor: any;
  currentEditor: any;
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
  onWorkspaceChanged: any;
}
`,
  'node_modules/@theia/workspace/lib/browser/index.d.ts': `
export class Workspace {
  readonly roots: any[];
  tryGetRoots(): any[];
}
export class WorkspaceService {
  workspace: any;
  roots: any[];
  readFile(uri: any): Promise<string>;
  onWorkspaceChanged: any;
}
`,
  'node_modules/@theia/workspace/lib/common/index.d.ts': `
export class WorkspaceServer {
  getMostRecentlyUsedWorkspace(): Promise<string | undefined>;
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
      command?: any;
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
export enum PreferenceScope {
  User = "user",
  Workspace = "workspace", 
  Folder = "folder"
}
`,
  'node_modules/@theia/task/lib/common/task-protocol.d.ts': `
export interface TaskConfiguration {
  label: string;
  type: string;
  [key: string]: any;
}
export enum TaskScope {
  Workspace = "workspace",
  Global = "global"
}
`,
  'node_modules/@theia/debug/lib/common/debug-common.d.ts': `
export interface DebugConfiguration {
  type: string;
  request: string;
  name: string;
  [key: string]: any;
}
export enum DebugSessionOptions {
  workspace = "workspace",
  user = "user",
  folder = "folder"
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
export class PreferenceService {
  set(key: string, value: any): Promise<void>;
  get(key: string): any;
}
export class BaseWidget {
  constructor();
  id: string;
  title: any;
  node: HTMLElement;
  update(): void;
  focus(): void;
  protected onActivateRequest(msg?: any): void;
  dispose(): void;
}
export const codicon: any;
export class Message {
  constructor(...args: any[]);
}
export class AbstractViewContribution<T> {
  constructor(...args: any[]);
  viewDidChange: any;
}
export class FrontendApplication {
  [key: string]: any;
}
`,
  'node_modules/@theia/core/lib/common/command.d.ts': `
export interface CommandRegistry {
  registerCommand(command: any): void;
}
export interface Command {
  id: string;
  label?: string;
  [key: string]: any;
}
`,
  'node_modules/@theia/core/lib/common/menu.d.ts': `
export interface MenuModelRegistry {
  registerMenuAction(menuPath: any, action: any): void;
}
export const MAIN_MENU_BAR: any;
`,

  'node_modules/@theia/core/lib/common/nls.d.ts': `
export const nls: any;
export function localize(key: string, defaultValue: string, ...args: any[]): string;
`,
  'node_modules/@theia/core/shared/react.d.ts': `
export * from 'react';
import * as React from 'react';
export = React;

export namespace React {
  type ReactNode = any;
  type KeyboardEvent<T = Element> = any;
  type FC<P = {}> = any;
  interface Component<P = {}, S = {}> {
    render(): any;
  }
  interface ComponentClass<P = {}> {
    new (props: P): Component<P, any>;
  }
  interface RefObject<T> {
    readonly current: T | null;
  }
  function createElement(type: any, props?: any, ...children: any[]): any;
  function createRef<T>(): RefObject<T>;
  function useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  const Fragment: any;
}

export function createRef<T>(): React.RefObject<T>;
export const Fragment: any;
export function createElement(type: any, props?: any, ...children: any[]): any;
`,
  'node_modules/@theia/core/lib/common/index.d.ts': `
export interface CommandContribution {
  registerCommands(registry: any): void;
}
export interface MenuContribution {
  registerMenus(menus: any): void;
}
export class Emitter<T> {
  readonly event: Event<T>;
  fire(event: T): void;
  dispose(): void;
}
export interface Event<T> {
  (listener: (e: T) => any): any;
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
  'node_modules/@theia/variable-resolver/lib/browser/index.d.ts': `
export class VariableResolverService {
  resolve(value: string, context?: any): Promise<string>;
}
`,
  'node_modules/react/index.d.ts': `
import * as React from 'react';
export = React;
export as namespace React;
declare namespace React {
  type ReactNode = any;
  type KeyboardEvent<T = any> = any;
  type SyntheticEvent = any;
  type FC<P = {}> = any;
  interface Component<P = {}, S = {}> {
    render(): any;
  }
  interface ComponentClass<P = {}> {
    new (props: P): Component<P, any>;
  }
  interface RefObject<T> {
    readonly current: T | null;
  }
  function createElement(type: any, props?: any, ...children: any[]): any;
  function createRef<T>(): RefObject<T>;
  function useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  const Fragment: any;
}
`,
  'node_modules/@types/react/index.d.ts': `
declare module 'react' {
  type ReactNode = any;
  type KeyboardEvent<T = any> = any;
  type SyntheticEvent = any;
  interface Component<P = {}, S = {}> {
    render(): any;
  }
  interface ComponentClass<P = {}> {
    new (props: P): Component<P, any>;
  }
  interface RefObject<T> {
    readonly current: T | null;
  }
  function createElement(type: any, props?: any, ...children: any[]): any;
  function createRef<T>(): RefObject<T>;
  function useState<T>(initialState: T | (() => T)): [T, (value: T) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  const Fragment: any;
}
`,
  'node_modules/@theia/core/lib/browser/widgets/react-widget.d.ts': `
export class ReactWidget {
  constructor();
  id: string;
  title: any;
  node: HTMLElement;
  protected render(): React.ReactNode;
  protected onActivateRequest(msg?: any): void;
  protected onCloseRequest(msg?: any): void;
  update(): void;
  dispose(): void;
}
`,
  'node_modules/@theia/core/lib/common/message-service.d.ts': `
export class MessageService {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  log(message: string): void;
}
export interface Message {
  text: string;
  type?: MessageType;
  options?: MessageOptions;
}
export enum MessageType {
  Info = 1,
  Warning = 2,
  Error = 3,
  Log = 4,
  Progress = 5
}
export interface MessageOptions {
  timeout?: number;
}
`,
  'node_modules/@theia/monaco-editor-core/esm/vs/editor/common/model.d.ts': `
export interface ITextModel {
  getValue(): string;
  getLineCount(): number;
  [key: string]: any;
}
`,
  'node_modules/@theia/monaco-editor-core/esm/vs/editor/common/core/range.d.ts': `
export class Range {
  constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number);
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}
`
};

Object.entries(stubs).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
});

console.log('Stub files created successfully');

// Auto-fix enhancements
const enhancedStubs = {
  'node_modules/@theia/core/lib/common/disposable.d.ts': `
export interface Disposable {
  dispose(): void;
}
export class DisposableCollection implements Disposable {
  push(disposable: Disposable): Disposable;
  pushAll(...disposables: Disposable[]): void;
  dispose(): void;
}
`,
  'node_modules/@theia/core/lib/browser/preferences/preference-service.d.ts': `
export class PreferenceService {
  set: any;
  get: any;
}
export enum PreferenceScope {
  User = "user",
  Workspace = "workspace",
  Folder = "folder"
}
`,
  'node_modules/@theia/task/lib/common/task-protocol.d.ts': `
export interface TaskConfiguration {
  label: string;
  type: string;
  [key: string]: any;
}
export enum TaskScope {
  Workspace = "workspace",
  Global = "global"
}
`,
  'node_modules/@theia/debug/lib/common/debug-common.d.ts': `
export interface DebugConfiguration {
  type: string;
  request: string;
  name: string;
  [key: string]: any;
}
export enum DebugSessionOptions {
  workspace = "workspace",
  user = "user",
  folder = "folder"
}
`
};

// Apply enhanced stubs
Object.entries(enhancedStubs).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content);
});

console.log('Enhanced stubs applied for auto-fix');
