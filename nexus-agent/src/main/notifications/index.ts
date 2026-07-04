import { BrowserWindow, Notification } from 'electron'

export interface NotificationRequest {
  title: string
  body: string
}

export type NotificationStatus = 'shown' | 'suppressed' | 'unsupported' | 'error'

export interface NotificationState extends NotificationRequest {
  status: NotificationStatus
  lastError: string | null
}

let lastNotification: NotificationState | null = null

export function notify(req: NotificationRequest): NotificationState {
  if (shouldSuppress()) {
    lastNotification = { ...req, status: 'suppressed', lastError: null }
    return getLastNotification()
  }
  if (!Notification.isSupported()) {
    lastNotification = { ...req, status: 'unsupported', lastError: 'Notification is not supported' }
    return getLastNotification()
  }
  try {
    new Notification(req).show()
    lastNotification = { ...req, status: 'shown', lastError: null }
  } catch (error) {
    lastNotification = { ...req, status: 'error', lastError: getErrorMessage(error) }
  }
  return getLastNotification()
}

export function getLastNotification(): NotificationState {
  return lastNotification ?? {
    title: '',
    body: '',
    status: 'suppressed',
    lastError: null,
  }
}

function shouldSuppress(): boolean {
  if (process.env.NEXUS_SMOKE_NOTIFY_ALWAYS === '1') return false
  return Boolean(BrowserWindow.getFocusedWindow()?.isFocused())
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
