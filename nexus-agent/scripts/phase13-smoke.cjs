#!/usr/bin/env node

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) void runElectron()
else void runWrapper()

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase13-'))
  const home = path.join(tempDir, 'home')
  const projectA = path.join(tempDir, 'project-a')
  const projectB = path.join(tempDir, 'project-b')
  fs.mkdirSync(home, { recursive: true })
  writeProject(projectA, 'PROJECT_A_PHASE13')
  writeProject(projectB, 'PROJECT_B_PHASE13')

  try {
    const result = await runChild(electron, {
      tempDir,
      home,
      projectA,
      projectB,
      userData: path.join(tempDir, 'userData'),
      dbPath: path.join(tempDir, 'phase13.db'),
      permissionsPath: path.join(tempDir, 'permissions.json'),
    })
    assertSmokeResult(result)
    console.log(`PHASE13_SMOKE_RESULT ${JSON.stringify(result)}`)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function runElectron() {
  const { app, BrowserWindow, Menu } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')
  const { createProject } = require('../dist-main/main/db/dao/projects.js')
  const { installAppMenu } = require('../dist-main/main/menu/index.js')
  const { initializeTray, updateTrayStatus, getTrayState } = require('../dist-main/main/tray/index.js')
  const { notify, getLastNotification } = require('../dist-main/main/notifications/index.js')
  const {
    createManagedWindow,
    getManagedWindowCount,
    getWindowSnapshot,
  } = require('../dist-main/main/window/manager.js')
  const {
    initializeGlobalShortcut,
    getShortcutState,
    handleShortcutActivated,
    unregisterGlobalShortcut,
  } = require('../dist-main/main/shortcuts/global.js')

  mark('set userData')
  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  mark('before ready')
  await app.whenReady()
  mark('after ready')
  registerIpcHandlers()
  mark('registered ipc')
  installAppMenu()
  mark('installed menu')

  const trayInitial = initializeTray()
  mark('initialized tray')
  const shortcutInitial = initializeGlobalShortcut()
  mark('initialized shortcut')
  const projectA = fs.realpathSync(process.env.NEXUS_SMOKE_PROJECT_A)
  const projectB = fs.realpathSync(process.env.NEXUS_SMOKE_PROJECT_B)
  const dbProjectA = createProject({ path: projectA, displayName: 'Phase 13 A' })
  const dbProjectB = createProject({ path: projectB, displayName: 'Phase 13 B' })
  mark('created projects')

  const first = await createManagedWindow(projectB)
  mark('created first window')
  await waitForRenderer(first, 'document.querySelectorAll("[data-od-id=\\"project-tab\\"]").length >= 2')
  mark('project tabs ready')

  const projectSwitchUi = await clickProjectTab(first, projectA)
  await waitFor(() => getWindowSnapshot().some((item) => item.id === first.id && item.projectPath === projectA))
  const projectSwitchSnapshot = getWindowSnapshot().find((item) => item.id === first.id)
  mark('project switched')

  const menuItem = Menu.getApplicationMenu()?.getMenuItemById('new-window')
  if (!menuItem) throw new Error('New Window menu item missing')
  menuItem.click()
  await waitFor(() => getManagedWindowCount() >= 2)
  const countAfterMenuNewWindow = getManagedWindowCount()
  mark('menu new window')

  for (const window of BrowserWindow.getAllWindows()) {
    if (window.id !== first.id) window.destroy()
  }
  await waitFor(() => getManagedWindowCount() === 1)
  const countAfterClose = getManagedWindowCount()
  mark('closed extra windows')

  const trayExecuting = updateTrayStatus('executing')
  notify({ title: 'Nexus Agent', body: 'Phase 13 done' })
  const notificationDone = getLastNotification()
  notify({ title: 'Nexus Agent', body: 'Phase 13 error' })
  const notificationError = getLastNotification()

  await first.webContents.executeJavaScript(`
    (() => {
      window.__phase13FocusResult = null
      if (window.__phase13FocusOff) window.__phase13FocusOff()
      window.__phase13FocusOff = window.nexus.onFocusCommandInput(() => {
        setTimeout(() => {
          const textarea = document.querySelector('[data-od-id="command-input"] textarea')
          window.__phase13FocusResult = { active: document.activeElement === textarea }
        }, 0)
      })
      return true
    })()
  `, true)
  const shortcutActivated = handleShortcutActivated()
  const focusResult = await waitForRendererValue(first, 'window.__phase13FocusResult')
  mark('shortcut focused')
  const rebindResult = await first.webContents.executeJavaScript(`
    window.nexus.setShortcutSettings({ enabled: true, accelerator: 'CommandOrControl+Shift+Y' })
  `, true)
  const shortcutAfterRebind = getShortcutState()
  mark('shortcut rebound')

  const settingsDisable = await disableShortcutInSettings(first)
  const shortcutAfterDisable = getShortcutState()
  mark('settings disabled shortcut')

  console.log(`PHASE13_CHILD_RESULT ${JSON.stringify({
    projects: { a: dbProjectA.path, b: dbProjectB.path },
    projectSwitch: { ui: projectSwitchUi, snapshot: projectSwitchSnapshot },
    windows: { countAfterMenuNewWindow, countAfterClose },
    tray: { initial: trayInitial, executing: trayExecuting, current: getTrayState() },
    notifications: { done: notificationDone, error: notificationError },
    shortcut: { initial: shortcutInitial, activated: shortcutActivated, focus: focusResult, rebind: rebindResult, afterRebind: shortcutAfterRebind, afterDisable: shortcutAfterDisable },
    settingsDisable,
  })}`)

  unregisterGlobalShortcut()
  first.destroy()
  closeDb()
  app.quit()
}

function mark(message) {
  if (process.env.NEXUS_PHASE13_DEBUG === '1') {
    console.error(`[phase13] ${message}`)
  }
}

function runChild(electron, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [__filename], {
      cwd: root,
      env: {
        ...process.env,
        HOME: args.home,
        NEXUS_CLAUDE_HOME: args.home,
        NEXUS_DB_PATH: args.dbPath,
        NEXUS_SMOKE_USER_DATA: args.userData,
        NEXUS_PERMISSIONS_PATH: args.permissionsPath,
        NEXUS_SMOKE_PROJECT_A: args.projectA,
        NEXUS_SMOKE_PROJECT_B: args.projectB,
        NEXUS_SMOKE_HIDE_WINDOW: '1',
        NEXUS_SMOKE_NOTIFY_ALWAYS: '1',
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`phase13 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 45000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`phase13 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE13_CHILD_RESULT '))
      if (!line) return reject(new Error(`phase13 child produced no result\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE13_CHILD_RESULT '.length)))
    })
  })
}

function clickProjectTab(win, projectPath) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const targetPath = ${JSON.stringify(projectPath)}
      const started = Date.now()
      const tick = () => {
        const buttons = Array.from(document.querySelectorAll('[data-od-id="project-tab"]'))
        const target = buttons.find((button) => (button.textContent || '').includes(targetPath))
        if (target) {
          target.click()
          setTimeout(() => resolve({
            tabCount: buttons.length,
            clickedPath: targetPath,
            statusText: document.querySelector('[data-od-id="status-bar"]')?.textContent || '',
          }), 350)
          return
        }
        if (Date.now() - started > 8000) return reject(new Error('project tab not found'))
        setTimeout(tick, 50)
      }
      tick()
    })
  `, true)
}

function disableShortcutInSettings(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now()
      const wait = async () => {
        const settingsButton = Array.from(document.querySelectorAll('button'))
          .find((button) => button.title === '设置' || (button.textContent || '').trim() === '设置')
        if (settingsButton && !document.querySelector('[data-od-id="shortcut-settings"]')) settingsButton.click()
        const toggle = document.querySelector('[data-od-id="shortcut-enabled"]')
        if (toggle) {
          toggle.click()
          const poll = async () => {
            const res = await window.nexus.getShortcutSettings()
            if (res.status === 'ok' && res.settings.enabled === false && res.settings.registered === false) {
              resolve({ disabled: true, settings: res.settings, text: document.querySelector('[data-od-id="shortcut-settings"]')?.textContent || '' })
              return
            }
            if (Date.now() - started > 8000) return reject(new Error('shortcut disable timed out'))
            setTimeout(poll, 50)
          }
          void poll()
          return
        }
        if (Date.now() - started > 8000) return reject(new Error('shortcut settings not found'))
        setTimeout(wait, 50)
      }
      void wait()
    })
  `, true)
}

function waitForRenderer(win, expression) {
  return waitForRendererValue(win, `(${expression}) ? true : null`)
}

function waitForRendererValue(win, expression) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now()
      const tick = () => {
        const value = ${expression}
        if (value) return resolve(value)
        if (Date.now() - started > 8000) return reject(new Error('renderer wait timed out: ${expression.replace(/'/g, "\\'")}'))
        setTimeout(tick, 50)
      }
      tick()
    })
  `, true)
}

function waitFor(check, timeoutMs = 8000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (check()) return resolve(true)
      if (Date.now() - started > timeoutMs) return reject(new Error('wait timed out'))
      setTimeout(tick, 50)
    }
    tick()
  })
}

function writeProject(project, marker) {
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(path.join(project, 'AGENTS.md'), `${marker}\n`)
}

function assertSmokeResult(result) {
  if (result.projectSwitch.snapshot?.projectPath !== result.projects.a) throw new Error('project switch did not update window project path')
  if (result.windows.countAfterMenuNewWindow < 2) throw new Error('menu did not create a second window')
  if (result.windows.countAfterClose !== 1) throw new Error('window manager did not clean up closed window')
  if (!result.tray.initial.initialized) throw new Error(`tray init failed: ${result.tray.initial.lastError}`)
  if (result.tray.executing.status !== 'executing' || result.tray.executing.color !== '#f59e0b') throw new Error('tray executing state mismatch')
  if (result.notifications.done.status === 'suppressed' || result.notifications.error.status === 'suppressed') throw new Error('notification wrapper suppressed smoke notification')
  if (!result.shortcut.initial.registered && !result.shortcut.initial.lastError) throw new Error('shortcut failure was not surfaced')
  if (!result.shortcut.activated || !result.shortcut.focus.active) throw new Error('shortcut did not focus command input')
  if (result.shortcut.rebind.status !== 'ok') throw new Error('shortcut rebind API failed')
  if (result.shortcut.afterRebind.accelerator !== 'CommandOrControl+Shift+Y') throw new Error('shortcut accelerator did not update')
  if (!result.shortcut.afterRebind.registered && !result.shortcut.afterRebind.lastError) throw new Error('shortcut rebind failure was not surfaced')
  if (!result.settingsDisable.disabled || result.shortcut.afterDisable.enabled || result.shortcut.afterDisable.registered) throw new Error('settings did not disable shortcut')
}

function assertBuilt() {
  const required = [
    path.join(root, 'dist', 'index.html'),
    path.join(root, 'dist-main', 'main', 'ipc.js'),
    path.join(root, 'dist-main', 'main', 'menu', 'index.js'),
    path.join(root, 'dist-main', 'main', 'tray', 'index.js'),
    path.join(root, 'dist-main', 'main', 'shortcuts', 'global.js'),
    path.join(root, 'dist-main', 'preload', 'index.js'),
  ]
  for (const file of required) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${file}. Run npm run electron:build first.`)
    }
  }
}
