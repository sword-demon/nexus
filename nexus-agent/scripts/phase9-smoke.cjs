#!/usr/bin/env node

const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) {
  void runElectron()
} else {
  void runWrapper()
}

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase9-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  fs.mkdirSync(home, { recursive: true })
  writeProjectFixture(project)

  const server = await startMockServer()
  try {
    const result = await runChild(electron, tempDir, home, project, server.baseURL)
    result.mock = server.summary()
    assertSmokeResult(result)
    console.log(`PHASE9_SMOKE_RESULT ${JSON.stringify(result)}`)
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
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 9 Smoke' })

  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 820,
    webPreferences: {
      preload: path.join(root, 'dist-main', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  await win.loadFile(path.join(root, 'dist', 'index.html'))
  await win.webContents.executeJavaScript(
    `window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`,
    true,
  )

  const ui = await exerciseMainWindow(win)
  const writtenPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'output.txt')
  const file = fs.existsSync(writtenPath) ? fs.readFileSync(writtenPath, 'utf8') : null

  console.log(`PHASE9_CHILD_RESULT ${JSON.stringify({ ui, file })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function exerciseMainWindow(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const events = []
      let settled = false
      const timeout = setTimeout(() => finish(new Error('phase9 ui timed out')), 18000)

      const waitFor = (check, deadline = Date.now() + 5000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 40)).then(() => waitFor(check, deadline))
      }

      const readUi = () => ({
        chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
        toolText: document.querySelector('[data-od-id="tool-panel"]')?.textContent || '',
        statusText: document.querySelector('[data-od-id="status-indicator"]')?.textContent || '',
        eventTypes: events.map((event) => event.type),
        statuses: events.filter((event) => event.type === 'status').map((event) => event.status),
        toolUseNames: events.filter((event) => event.type === 'tool_use').map((event) => event.toolName),
        toolUseCount: events.filter((event) => event.type === 'tool_use').length,
        toolResultCount: events.filter((event) => event.type === 'tool_result').length,
        toolErrors: events.filter((event) => event.type === 'tool_result' && !event.ok).map((event) => event.error),
        endTurnCount: events.filter((event) => event.type === 'end_turn').length
      })

      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) reject(error)
        else setTimeout(() => resolve(readUi()), 160)
      }

      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'permission_request') void window.nexus.respondPermission({ id: event.request.id, decision: 'allow-once' })
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })

      waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'phase9')
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
        })
        .catch(finish)
    })
  `, true)
}

function runChild(electron, tempDir, home, project, baseURL) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [__filename], {
      cwd: root,
      env: {
        ...process.env,
        NEXUS_CLAUDE_HOME: home,
        NEXUS_DB_PATH: path.join(tempDir, 'phase9.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase9-userData'), NEXUS_PERMISSIONS_PATH: path.join(tempDir, 'permissions.json'),
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase9-smoke-mock',
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
      reject(new Error(`phase9 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 22000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        reject(new Error(`phase9 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
        return
      }
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE9_CHILD_RESULT '))
      if (!line) {
        reject(new Error(`phase9 child produced no result\n${stdout}\n${stderr}`))
        return
      }
      resolve(JSON.parse(line.slice('PHASE9_CHILD_RESULT '.length)))
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
      resolve({
        baseURL: `http://127.0.0.1:${address.port}`,
        summary: () => ({
          requests,
          bodiesContainToolResults: bodies.filter((body) => body.includes('tool_result')).length,
        }),
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function eventsFor(requestNumber) {
  const calls = [
    ['read_file', { path: 'notes.txt' }],
    ['read_file', { path: '/etc/passwd' }],
    ['list_dir', { path: '.' }],
    ['search_files', { query: 'needle' }],
    ['write_file', { path: 'generated/output.txt', content: 'created by phase9' }],
    ['exec', { command: 'ls', args: ['generated'], cwd: '.' }],
  ]
  const call = calls[requestNumber - 1]
  if (call) return toolUseEvents(`toolu_phase9_${requestNumber}`, call[0], call[1])
  return textEvents()
}

function messageStart() {
  return {
    type: 'message_start',
    message: {
      id: 'msg_phase9_smoke',
      type: 'message',
      role: 'assistant',
      content: [],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 1, cache_creation_input_tokens: null, cache_read_input_tokens: null },
    },
  }
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
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'phase9 done' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } },
    { type: 'message_stop' },
  ]
}

function assertSmokeResult(result) {
  const ui = result.ui
  const requiredTools = ['read_file', 'read_file', 'list_dir', 'search_files', 'write_file', 'exec']
  if (JSON.stringify(ui.toolUseNames) !== JSON.stringify(requiredTools)) {
    throw new Error(`unexpected tools: ${JSON.stringify(ui.toolUseNames)}`)
  }
  if (ui.toolUseCount !== 6 || ui.toolResultCount !== 6) throw new Error('tool event counts did not sync')
  if (!ui.toolErrors.some((error) => String(error).includes('OUT_OF_BOUNDS'))) {
    throw new Error(`out-of-bounds read was not rejected: ${JSON.stringify(ui.toolErrors)}`)
  }
  if (result.file !== 'created by phase9') throw new Error(`write_file did not create expected file: ${result.file}`)
  if (!ui.chatText.includes('phase9') || !ui.chatText.includes('phase9 done')) {
    throw new Error(`ChatPanel missing prompt/final text: ${ui.chatText}`)
  }
  if (!ui.toolText.includes('notes.txt') || !ui.toolText.includes('needle')) {
    throw new Error(`ToolPanel missing read/search output: ${ui.toolText}`)
  }
  if (!ui.toolText.includes('output.txt') || !ui.toolText.includes('exitCode')) {
    throw new Error(`ToolPanel missing write/exec output: ${ui.toolText}`)
  }
  if (!ui.statusText.includes('完成')) throw new Error(`StatusIndicator did not reach done: ${ui.statusText}`)
  if (result.mock.requests !== 7 || result.mock.bodiesContainToolResults < 6) {
    throw new Error(`mock server did not receive all tool results: ${JSON.stringify(result.mock)}`)
  }
}

function writeProjectFixture(project) {
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Phase 9 smoke project.\n')
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Respond with tool calls.\n')
  fs.writeFileSync(path.join(project, 'notes.txt'), 'needle lives here\n')
  fs.mkdirSync(path.join(project, 'node_modules'), { recursive: true })
  fs.writeFileSync(path.join(project, 'node_modules', 'ignored.txt'), 'needle should be skipped\n')
}

function assertBuilt() {
  const required = [
    path.join(root, 'dist', 'index.html'),
    path.join(root, 'dist-main', 'main', 'ipc.js'),
    path.join(root, 'dist-main', 'preload', 'index.js'),
  ]
  for (const file of required) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run npm run electron:build first.`)
  }
}
