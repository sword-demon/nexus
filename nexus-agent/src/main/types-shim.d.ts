/**
 * Minimal Electron type shim — local-only, used while sandbox cannot reach
 * the npm registry. When `electron@^39.0.0` installs for real this shim
 * becomes redundant; delete it then.
 *
 * Covers only the symbols Phase 2 IPC + window + bootstrap code touches.
 */

// ponytail: type assertions cover Phase 2 surface only. Real `@types/electron`
// arrives when registry is reachable and supersedes this shim.

declare module 'electron' {
  export interface IpcMainInvokeEvent {
    sender: WebContents
  }

  export interface IpcRendererEvent {
    sender: IpcRenderer
  }

  export interface WebContents {
    on(event: string, listener: (...args: unknown[]) => void): void
    send(channel: string, ...args: unknown[]): void
    openDevTools(options?: { mode?: 'right' | 'bottom' | 'left' | 'detach' }): void
  }

  // ponytail: handler is typed as a generic function so callers can supply
  // any parameter / return shape without the shim rejecting typed handlers.
  export interface IpcMain {
    handle<TFunc extends (...args: never) => unknown>(
      channel: string,
      listener: TFunc,
    ): void
    on(channel: string, listener: (...args: unknown[]) => void): void
    removeListener(channel: string, listener: (...args: unknown[]) => void): void
  }

  export const ipcMain: IpcMain

  export interface IpcRenderer {
    invoke<TReturn = unknown>(channel: string, ...args: unknown[]): Promise<TReturn>
    send(channel: string, ...args: unknown[]): void
    on<TPayload = unknown>(
      channel: string,
      listener: (event: IpcRendererEvent, payload: TPayload) => void,
    ): void
    removeListener<TArgs extends unknown[] = unknown[]>(
      channel: string,
      listener: (...args: TArgs) => void,
    ): void
  }

  export const ipcRenderer: IpcRenderer

  export interface BrowserWindowConstructorOptions {
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    title?: string
    backgroundColor?: string
    webPreferences?: {
      preload?: string
      contextIsolation?: boolean
      nodeIntegration?: boolean
      sandbox?: boolean
    }
    show?: boolean
  }

  export interface BrowserWindow {
    loadURL(url: string): Promise<void>
    loadFile(path: string): Promise<void>
    on(event: string, listener: (...args: unknown[]) => void): void
    once(event: string, listener: (...args: unknown[]) => void): void
    show(): void
    webContents: WebContents
    isMinimized(): boolean
    restore(): void
    focus(): void
  }

  export class BrowserWindow {
    static getAllWindows(): BrowserWindow[]
    constructor(options: BrowserWindowConstructorOptions)
  }

  export interface App {
    on(event: string, listener: (...args: unknown[]) => void): void
    whenReady(): Promise<void>
    quit(): void
    exit(code?: number): void
    requestSingleInstanceLock(): boolean
    setName(name: string): void
    getPath(name: 'home' | 'appData' | 'userData' | 'cache' | 'temp'): string
  }

  export const app: App

  export interface ContextBridge {
    exposeInMainWorld(apiKey: string, api: object): void
  }

  export const contextBridge: ContextBridge
}

declare module 'node:fs' {
  export interface Promises {
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
    appendFile(path: string, data: string, encoding: 'utf8'): Promise<void>
    readFile(path: string, encoding: 'utf8'): Promise<string>
  }
  export const promises: Promises
  export function existsSync(path: string): boolean
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void
  export function renameSync(oldPath: string, newPath: string): void
}

declare module 'node:path' {
  export function join(...paths: string[]): string
  export function dirname(path: string): string
  export function resolve(...paths: string[]): string
}

declare module 'node:crypto' {
  export function randomUUID(): string
}

declare const process: {
  env: Record<string, string | undefined>
  platform: NodeJS.Platform
}

declare const __dirname: string

// ponytail: ES2022 lib does not include `console`; declare minimal shape.
interface ConsoleLike {
  error(...args: unknown[]): void
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  info(...args: unknown[]): void
}
declare const console: ConsoleLike
