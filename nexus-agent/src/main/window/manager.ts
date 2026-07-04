import { BrowserWindow } from 'electron'
import { createMainWindow } from '../window'
import { resolveTrustedProjectRoot } from '../security/projectTrust'
import { IPC_EVENTS } from '../../shared/types/ipc'
import type { WebContents } from 'electron'

interface ManagedWindow {
  window: BrowserWindow
  projectPath: string | null
}

const windows = new Map<number, ManagedWindow>()

export async function createManagedWindow(projectPath?: string): Promise<BrowserWindow> {
  const trustedProjectPath = projectPath ? resolveTrustedProjectRoot(projectPath) : undefined
  const window = await createMainWindow({ projectPath: trustedProjectPath })
  windows.set(window.id, { window, projectPath: trustedProjectPath ?? null })
  window.on('closed', () => {
    windows.delete(window.id)
  })
  return window
}

export function getManagedWindowCount(): number {
  return windows.size
}

export function getWindowSnapshot(): Array<{ id: number; projectPath: string | null }> {
  return Array.from(windows.values()).map((entry) => ({
    id: entry.window.id,
    projectPath: entry.projectPath,
  }))
}

export function setProjectForSender(sender: WebContents, projectPath: string): { windowId: number; projectPath: string } {
  const window = BrowserWindow.fromWebContents(sender)
  if (!window) throw new Error('Window not found for project switch')
  const trustedProjectPath = resolveTrustedProjectRoot(projectPath)
  const existing = windows.get(window.id)
  windows.set(window.id, { window, projectPath: trustedProjectPath })
  if (!existing) {
    window.on('closed', () => {
      windows.delete(window.id)
    })
  }
  return { windowId: window.id, projectPath: trustedProjectPath }
}

export function getFocusedOrFirstWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

export function focusMainWindow(): boolean {
  const window = getFocusedOrFirstWindow()
  if (!window || window.isDestroyed()) return false
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
  return true
}

export function focusCommandInput(): boolean {
  const window = getFocusedOrFirstWindow()
  if (!window || window.isDestroyed()) return false
  focusMainWindow()
  window.webContents.send(IPC_EVENTS.FOCUS_COMMAND_INPUT)
  return true
}
