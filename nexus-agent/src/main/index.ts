import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { registerIpcHandlers } from './ipc'
import { logger } from './logger'
import { installBuiltinSkills } from './skills/builtin'
import { installAppMenu } from './menu'
import { initializeTray } from './tray'
import { initializeGlobalShortcut, unregisterGlobalShortcut } from './shortcuts/global'
import { createManagedWindow, focusMainWindow } from './window/manager'

const APP_NAME = 'Nexus Agent'
const VERSION = '0.1.0'
const USER_DATA_DIR = 'Nexus'

async function bootstrap(): Promise<void> {
  app.setName(APP_NAME)
  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA ?? path.join(app.getPath('appData'), USER_DATA_DIR))

  await logger.info('main', `${APP_NAME} v${VERSION} starting`)

  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    focusMainWindow()
  })

  await app.whenReady()
  installBuiltinSkills()

  registerIpcHandlers()
  installAppMenu()
  initializeTray()
  initializeGlobalShortcut()
  await createManagedWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createManagedWindow()
    }
  })

  app.on('will-quit', () => {
    unregisterGlobalShortcut()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  await logger.info('main', `${APP_NAME} v${VERSION} ready`)
}

// Bootstrap catch-all: if logger itself fails we still want to surface
// the failure to stderr so the user sees something rather than a silent crash.
bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[nexus] bootstrap failed:', err)
  app.exit(1)
})
