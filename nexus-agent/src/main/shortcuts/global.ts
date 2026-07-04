import { globalShortcut } from 'electron'
import { focusCommandInput } from '../window/manager'
import { getShortcutConfig, saveShortcutConfig } from './config'
import type { SetShortcutSettingsRequest, ShortcutSettingsDto } from '../../shared/types/ipc'

interface ShortcutState extends ShortcutSettingsDto {
  lastActivationAt: number | null
}

let state: ShortcutState = {
  enabled: true,
  accelerator: 'CommandOrControl+Shift+A',
  registered: false,
  lastError: null,
  lastActivationAt: null,
}

export function initializeGlobalShortcut(): ShortcutSettingsDto {
  return registerShortcut(getShortcutConfig())
}

export function updateGlobalShortcutConfig(req: SetShortcutSettingsRequest): ShortcutSettingsDto {
  return registerShortcut(saveShortcutConfig(req))
}

export function unregisterGlobalShortcut(): void {
  if (state.registered) globalShortcut.unregister(state.accelerator)
  state = { ...state, registered: false }
}

export function handleShortcutActivated(): boolean {
  state = { ...state, lastActivationAt: Date.now() }
  return focusCommandInput()
}

export function getShortcutState(): ShortcutState {
  return { ...state }
}

function registerShortcut(config: { enabled: boolean; accelerator: string }): ShortcutSettingsDto {
  unregisterGlobalShortcut()
  state = { ...state, ...config, registered: false, lastError: null }
  if (!config.enabled) return toDto()

  try {
    const registered = globalShortcut.register(config.accelerator, handleShortcutActivated)
    state = {
      ...state,
      registered,
      lastError: registered ? null : `Failed to register ${config.accelerator}`,
    }
  } catch (error) {
    state = { ...state, registered: false, lastError: getErrorMessage(error) }
  }
  return toDto()
}

function toDto(): ShortcutSettingsDto {
  const { enabled, accelerator, registered, lastError } = state
  return { enabled, accelerator, registered, lastError }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
