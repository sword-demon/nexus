import { Menu, Tray, app, nativeImage } from 'electron'
import { focusMainWindow } from '../window/manager'
import type { AgentStatus } from '../../shared/types/ipc'
import type { NativeImage } from 'electron'

type TrayVisualStatus = 'idle' | 'executing' | 'done' | 'error'

interface TrayState {
  initialized: boolean
  status: TrayVisualStatus
  color: string
  lastError: string | null
}

const COLORS: Record<TrayVisualStatus, string> = {
  idle: '#8a8f98',
  executing: '#f59e0b',
  done: '#22c55e',
  error: '#ef4444',
}

let tray: Tray | null = null
let state: TrayState = {
  initialized: false,
  status: 'idle',
  color: COLORS.idle,
  lastError: null,
}

export function initializeTray(): TrayState {
  if (tray) return getTrayState()
  try {
    tray = new Tray(createIcon(state.status))
    tray.setToolTip('Nexus Agent')
    tray.setContextMenu(buildMenu())
    state = { ...state, initialized: true, lastError: null }
  } catch (error) {
    state = { ...state, initialized: false, lastError: getErrorMessage(error) }
  }
  return getTrayState()
}

export function updateTrayStatus(status: AgentStatus): TrayState {
  const visualStatus = normalizeStatus(status)
  state = { ...state, status: visualStatus, color: COLORS[visualStatus] }
  if (tray) {
    tray.setImage(createIcon(visualStatus))
    tray.setContextMenu(buildMenu())
  }
  return getTrayState()
}

export function getTrayState(): TrayState {
  return { ...state }
}

function normalizeStatus(status: AgentStatus): TrayVisualStatus {
  if (status === 'done' || status === 'error' || status === 'idle') return status
  return 'executing'
}

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: `状态: ${state.status}`, enabled: false },
    { type: 'separator' },
    {
      label: '显示',
      click: () => {
        focusMainWindow()
      },
    },
    {
      label: '退出',
      click: () => {
        app.quit()
      },
    },
  ])
}

function createIcon(status: TrayVisualStatus): NativeImage {
  const color = COLORS[status]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" fill="${color}"/><circle cx="9" cy="9" r="3" fill="#111827"/></svg>`
  return nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
