import { BrowserWindow, app } from 'electron'
import path from 'node:path'
import { logger } from './logger'

const DEV_URL = 'http://localhost:5173'

interface CreateWindowOptions {
  projectPath?: string
}

export async function createMainWindow(options: CreateWindowOptions = {}): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    title: 'Nexus Agent',
    backgroundColor: '#0f2a1f',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  window.once('ready-to-show', () => {
    if (process.env.NEXUS_SMOKE_HIDE_WINDOW !== '1') {
      window.show()
    }
  })

  window.webContents.on('did-finish-load', () => {
    void logger.info('window', `loaded with project=${options.projectPath ?? '(none)'}`)
  })

  window.on('closed', () => {
    if (BrowserWindow.getAllWindows().length === 0 && process.platform !== 'darwin') {
      app.quit()
    }
  })

  const isDev = process.env.NEXUS_DEV === '1'
  if (isDev) {
    await window.loadURL(DEV_URL)
    window.webContents.openDevTools({ mode: 'detach' })
  } else {
    const indexHtml = path.join(__dirname, '..', '..', 'dist', 'index.html')
    await window.loadFile(indexHtml)
  }

  return window
}
