#!/usr/bin/env node

const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) void runElectron()
else void runWrapper()

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase11-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  const permissionsPath = path.join(tempDir, 'permissions.json')
  fs.mkdirSync(home, { recursive: true })
  writeProject(project)
  const server = await startMockServer()
  try {
    const result = await runChild(electron, tempDir, home, project, permissionsPath, server.baseURL)
    result.mock = server.summary()
    assertSmokeResult(result)
    console.log(`PHASE11_SMOKE_RESULT ${JSON.stringify(result)}`)
  } finally {
    await server.close()
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function runElectron() {
  const { app, BrowserWindow } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')
  const { createProject } = require('../dist-main/main/db/dao/projects.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
  registerIpcHandlers()
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 11 Smoke' })

  const win = new BrowserWindow({
    show: false,
    width: 1360,
    height: 900,
    webPreferences: { preload: path.join(root, 'dist-main', 'preload', 'index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  })
  await win.loadFile(path.join(root, 'dist', 'index.html'))
  await win.webContents.executeJavaScript(`window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`, true)
  const trust = await exercisePtyTrustBoundary(win)
  const ui = await exerciseMainWindow(win)
  const interactive = await exerciseInteractiveTerminal(win)
  const diffPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'diff.txt')

  console.log(`PHASE11_CHILD_RESULT ${JSON.stringify({ ui: { ...ui, interactive }, trust, file: fs.existsSync(diffPath) ? fs.readFileSync(diffPath, 'utf8') : null, permissionsPath: process.env.NEXUS_PERMISSIONS_PATH })}`)
  win.destroy()
  closeDb()
  app.quit()
}

function exerciseMainWindow(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const events = []
      const permissionSnapshots = []
      let settled = false
      const timeout = setTimeout(() => finish(new Error('phase11 ui timed out')), 30000)

      const waitFor = (check, deadline = Date.now() + 8000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 50)).then(() => waitFor(check, deadline))
      }
      const clickButton = (label) => {
        const buttons = Array.from(document.querySelectorAll('[data-od-id="permission-prompt"] button'))
        const button = buttons.find((item) => item.textContent.includes(label))
        if (!button) throw new Error('missing permission button: ' + label)
        button.click()
      }
      const handlePermission = async (event) => {
        const prompt = await waitFor(() => document.querySelector('[data-od-id="permission-prompt"]'))
        permissionSnapshots.push({
          toolName: event.request.toolName,
          input: event.request.input,
          text: prompt.textContent || '',
        })
        clickButton('允许一次')
      }
      const readUi = async () => {
        await waitFor(() => document.querySelector('[data-od-id="pty-terminal"]'))
        await waitFor(() => document.querySelector('[data-od-id="monaco-diff"]'))
        const terminal = document.querySelector('[data-od-id="pty-terminal"]')
        const monacoDiff = document.querySelector('[data-od-id="monaco-diff"]')
        const fullscreenButton = Array.from(document.querySelectorAll('[data-od-id="diff-viewer"] button'))
          .find((button) => button.textContent.includes('↗'))
        if (!fullscreenButton) throw new Error('missing fullscreen button')
        fullscreenButton.click()
        await waitFor(() => document.querySelector('[data-od-id="diff-fullscreen"]'))
        const fullscreenOpened = Boolean(document.querySelector('[data-od-id="diff-fullscreen"]'))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await waitFor(() => !document.querySelector('[data-od-id="diff-fullscreen"]'))
        const terminalText = terminal?.querySelector('.xterm-rows')?.textContent || terminal?.textContent || ''
        return {
          chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
          toolText: (document.querySelector('[data-od-id="tool-panel"]')?.textContent || '').slice(0, 600),
          terminalHasRed: terminalText.includes('PHASE11_RED'),
          terminalSample: terminalText.slice(0, 300),
          terminalFontSize: terminal?.getAttribute('data-terminal-font-size'),
          terminalBackground: terminal?.getAttribute('data-terminal-background'),
          hasAnsiColor: Boolean(terminal?.querySelector('.xterm-fg-1, [style*="color"]')),
          hasMonacoEditor: Boolean(monacoDiff?.querySelector('.monaco-editor')),
          diffAdditions: monacoDiff?.getAttribute('data-diff-additions'),
          diffDeletions: monacoDiff?.getAttribute('data-diff-deletions'),
          diffLineNumbers: monacoDiff?.getAttribute('data-line-numbers'),
          diffSideBySide: monacoDiff?.getAttribute('data-render-side-by-side'),
          fullscreenOpened,
          fullscreenClosed: !document.querySelector('[data-od-id="diff-fullscreen"]'),
          eventTypes: events.map((event) => event.type),
          toolUseNames: events.filter((event) => event.type === 'tool_use').map((event) => event.toolName),
          toolUseCount: events.filter((event) => event.type === 'tool_use').length,
          toolResultCount: events.filter((event) => event.type === 'tool_result').length,
          permissionSnapshots,
        }
      }
      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) reject(error)
        else setTimeout(() => readUi().then(resolve, reject), 500)
      }
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'permission_request') void handlePermission(event).catch(finish)
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })
      waitFor(() => document.querySelector('[data-od-id="status-bar"]')?.textContent.includes('Phase 11 Smoke'))
        .then(() => waitFor(() => document.querySelector('[data-od-id="command-input"] textarea')))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'phase11')
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
        })
        .catch(finish)
    })
  `, true)
}

function exercisePtyTrustBoundary(win) {
  return win.webContents.executeJavaScript(`
    window.nexus.spawnPty({ command: 'sh', args: ['-lc', 'pwd'], cwd: '.', projectRoot: '/' })
  `, true)
}

async function exerciseInteractiveTerminal(win) {
  await win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const terminal = document.querySelector('[data-od-id="pty-terminal"]')
      const textarea = terminal?.querySelector('textarea')
      if (!terminal || !textarea) return reject(new Error('terminal textarea missing'))
      terminal.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      terminal.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
      terminal.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      textarea.focus()
      resolve(true)
    })
  `, true)
  await win.webContents.insertText("printf 'PHASE11_INTERACTIVE\\n'\\n")
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const started = Date.now()
      const wait = () => {
        const terminal = document.querySelector('[data-od-id="pty-terminal"]'); const text = terminal?.querySelector('.xterm-rows')?.textContent || terminal?.textContent || ''
        if (text.includes('PHASE11_INTERACTIVE')) return resolve({ terminalHasInteractive: true, terminalSample: text.slice(0, 300) })
        if (Date.now() - started > 8000) return reject(new Error('interactive terminal timed out: ' + text))
        setTimeout(wait, 50)
      }
      wait()
    })
  `, true)
}

function runChild(electron, tempDir, home, project, permissionsPath, baseURL) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [__filename], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${path.join(project, 'bin')}:${process.env.PATH || ''}`,
        NEXUS_CLAUDE_HOME: home,
        NEXUS_DB_PATH: path.join(tempDir, 'phase11.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase11-userData'),
        NEXUS_PERMISSIONS_PATH: permissionsPath,
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase11-smoke-mock',
        NEXUS_ANTHROPIC_BASE_URL: baseURL,
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`phase11 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 45000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`phase11 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE11_CHILD_RESULT '))
      if (!line) return reject(new Error(`phase11 child produced no result\n${stdout}\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE11_CHILD_RESULT '.length)))
    })
  })
}

function startMockServer() {
  let requests = 0
  const bodies = []
  const server = http.createServer((req, res) => {
    requests += 1
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      bodies.push(body)
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      for (const event of eventsFor(requests)) {
        res.write(`event: ${event.type}\n`)
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      }
      res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({ baseURL: `http://127.0.0.1:${address.port}`, summary: () => ({ requests, bodiesContainToolResults: bodies.filter((body) => body.includes('tool_result')).length }), close: () => new Promise((done) => server.close(done)) })
    })
  })
}

function eventsFor(requestNumber) {
  if (requestNumber === 1) {
    return toolUseEvents('toolu_phase11_exec', 'exec', { command: 'sh', args: ['-lc', "ls -la; printf '\\033[31mPHASE11_RED\\033[0m\\n'"], cwd: '.' })
  }
  if (requestNumber === 2) return toolUseEvents('toolu_phase11_write', 'write_file', { path: 'generated/diff.txt', content: 'new line\nadded line\n' })
  return textEvents()
}

function messageStart() {
  return { type: 'message_start', message: { id: 'msg_phase11_smoke', type: 'message', role: 'assistant', content: [], model: 'claude-3-5-sonnet-20241022', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1, cache_creation_input_tokens: null, cache_read_input_tokens: null } } }
}

function toolUseEvents(id, name, input) {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id, name, input: {} } },
    { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 8 } },
    { type: 'message_stop' },
  ]
}

function textEvents() {
  return [messageStart(), { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'phase11 done' } }, { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } }, { type: 'message_stop' }]
}

function assertSmokeResult(result) {
  const ui = result.ui
  if (ui.toolUseCount !== 2 || ui.toolResultCount !== 2) throw new Error('tool event counts did not sync')
  if (ui.permissionSnapshots.length !== 2) throw new Error(`unexpected permission prompts: ${ui.permissionSnapshots.length}`)
  if (!ui.terminalHasRed || !ui.hasAnsiColor) throw new Error(`xterm ANSI output missing: ${ui.terminalSample}`)
  if (ui.terminalFontSize !== '13' || ui.terminalBackground !== '--color-surface-card') throw new Error('xterm token metadata missing')
  if (!ui.interactive.terminalHasInteractive) throw new Error(`interactive PTY stdout missing: ${ui.interactive.terminalSample}`)
  if (!ui.hasMonacoEditor || ui.diffAdditions !== '2' || ui.diffDeletions !== '1') throw new Error(`Monaco diff metadata missing: ${JSON.stringify({ hasMonacoEditor: ui.hasMonacoEditor, diffAdditions: ui.diffAdditions, diffDeletions: ui.diffDeletions })}`)
  if (ui.diffLineNumbers !== 'true' || ui.diffSideBySide !== 'false') throw new Error('Monaco line/inline mode metadata missing')
  if (!ui.fullscreenOpened || !ui.fullscreenClosed) throw new Error('fullscreen DiffViewer did not open and close')
  if (result.trust.status !== 'error' || !result.trust.error.includes('Project is not trusted')) {
    throw new Error('untrusted PTY project root was not rejected')
  }
  if (result.file !== 'new line\nadded line\n') throw new Error(`write_file content mismatch: ${result.file}`)
  if (!ui.chatText.includes('phase11 done')) throw new Error(`missing final text: ${ui.chatText}`)
  if (result.mock.requests !== 3 || result.mock.bodiesContainToolResults !== 2) {
    throw new Error(`mock server did not receive all tool results: ${JSON.stringify(result.mock)}`)
  }
}

function writeProject(project) {
  fs.mkdirSync(path.join(project, 'generated'), { recursive: true })
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Phase 11 smoke project.\n')
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Respond with terminal and diff tool calls.\n')
  fs.writeFileSync(path.join(project, 'generated', 'diff.txt'), 'old line\n')
}

function assertBuilt() {
  for (const file of [path.join(root, 'dist', 'index.html'), path.join(root, 'dist-main', 'main', 'ipc.js'), path.join(root, 'dist-main', 'preload', 'index.js')]) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run npm run electron:build first.`)
  }
}
