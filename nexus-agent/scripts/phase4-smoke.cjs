#!/usr/bin/env node

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) {
  void runElectronStep()
} else {
  runWrapper()
}

function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase4-'))
  const dbPath = path.join(tempDir, 'nexus.db')
  const userData = path.join(tempDir, 'userData')
  const testKey = `sk-ant-nexus-phase4-smoke-${Date.now()}`

  const set = runChild(electron, { tempDir, dbPath, userData, testKey, step: 'set' })
  const rowsAfterSet = runChild(electron, { tempDir, dbPath, userData, testKey, step: 'rows' }).result.rows
  const dbText = JSON.stringify(rowsAfterSet)
  const decodedText = rowsAfterSet.map((row) => Buffer.from(row.value, 'base64').toString('utf8')).join('\n')
  const status = runChild(electron, { tempDir, dbPath, userData, testKey, step: 'status' })
  const clear = runChild(electron, { tempDir, dbPath, userData, testKey, step: 'clear' })
  const rowsAfterClear = runChild(electron, { tempDir, dbPath, userData, testKey, step: 'rows' }).result.rows

  const summary = {
    safeStorageAvailable: set.safeStorageAvailable,
    setStatus: set.result.set.status,
    statusAfterSet: set.result.statusAfterSet.status,
    statusAfterRestart: status.result.status.status,
    clearStatus: clear.result.clear.status,
    statusAfterClear: clear.result.statusAfterClear.status,
    dbPlainContainsTestKey: dbText.includes(testKey),
    dbDecodedContainsTestKey: decodedText.includes(testKey),
    dbRowsAfterClear: rowsAfterClear.length,
  }

  console.log(`PHASE4_SMOKE_RESULT ${JSON.stringify(summary)}`)
  fs.rmSync(tempDir, { recursive: true, force: true })
}

async function runElectronStep() {
  const { app, BrowserWindow, safeStorage } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb, getDb } = require('../dist-main/main/db/index.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()

  if (process.env.NEXUS_SMOKE_STEP === 'rows') {
    const rows = getDb().prepare('SELECT key, value FROM settings WHERE key = ?').all('api_key_blob')
    console.log(`PHASE4_CHILD_RESULT ${JSON.stringify({
      safeStorageAvailable: safeStorage.isEncryptionAvailable(),
      result: { rows },
    })}`)
    closeDb()
    app.quit()
    return
  }

  registerIpcHandlers()

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(root, 'dist-main', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  await win.loadURL('data:text/html,<html><body>phase4</body></html>')

  const key = process.env.NEXUS_SMOKE_KEY
  const step = process.env.NEXUS_SMOKE_STEP
  const result = await win.webContents.executeJavaScript(makeRendererScript(step, key), true)

  console.log(`PHASE4_CHILD_RESULT ${JSON.stringify({
    safeStorageAvailable: safeStorage.isEncryptionAvailable(),
    result,
  })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function makeRendererScript(step, key) {
  const quotedKey = JSON.stringify(key)
  if (step === 'set') {
    return `
      (async () => {
        const statusBefore = await window.nexus.getApiKeyStatus()
        const set = await window.nexus.setApiKey(${quotedKey})
        const statusAfterSet = await window.nexus.getApiKeyStatus()
        return { statusBefore, set, statusAfterSet }
      })()
    `
  }
  if (step === 'status') {
    return `
      (async () => ({ status: await window.nexus.getApiKeyStatus() }))()
    `
  }
  return `
    (async () => {
      const clear = await window.nexus.clearApiKey()
      const statusAfterClear = await window.nexus.getApiKeyStatus()
      return { clear, statusAfterClear }
    })()
  `
}

function runChild(electron, args) {
  const child = spawnSync(electron, [__filename], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXUS_DB_PATH: args.dbPath,
      NEXUS_SMOKE_USER_DATA: args.userData,
      NEXUS_SMOKE_KEY: args.testKey,
      NEXUS_SMOKE_STEP: args.step,
    },
  })
  if (child.status !== 0) {
    throw new Error(`phase4 child ${args.step} failed\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`)
  }
  const line = child.stdout.split('\n').find((s) => s.startsWith('PHASE4_CHILD_RESULT '))
  if (!line) throw new Error(`phase4 child ${args.step} produced no result\n${child.stdout}\n${child.stderr}`)
  return JSON.parse(line.slice('PHASE4_CHILD_RESULT '.length))
}

function assertBuilt() {
  const required = [
    path.join(root, 'dist-main', 'main', 'ipc.js'),
    path.join(root, 'dist-main', 'preload', 'index.js'),
  ]
  for (const file of required) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${file}. Run npm run electron:build first.`)
    }
  }
}
