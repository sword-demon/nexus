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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase8-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  fs.mkdirSync(home, { recursive: true })
  writeProjectFixture(project)

  const server = await startMockServer()
  try {
    const result = await runChild(electron, tempDir, home, project, server.baseURL)
    result.mock = server.summary()
    assertSmokeResult(result)
    console.log(`PHASE8_SMOKE_RESULT ${JSON.stringify(result)}`)
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
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 8 Smoke' })

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
  const logTail = readMainLogTail(process.env.NEXUS_SMOKE_USER_DATA)

  console.log(`PHASE8_CHILD_RESULT ${JSON.stringify({ ui, logTail })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function exerciseMainWindow(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const events = []
      let turnId = null
      let settled = false
      const timeout = setTimeout(() => finish(new Error('phase8 ui timed out')), 12000)

      const waitFor = (check, deadline = Date.now() + 5000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 40)).then(() => waitFor(check, deadline))
      }

      const readUi = () => {
        const chatText = document.querySelector('[data-od-id="chat-panel"]')?.textContent || ''
        const toolText = document.querySelector('[data-od-id="tool-panel"]')?.textContent || ''
        const statusText = document.querySelector('[data-od-id="status-indicator"]')?.textContent || ''
        const textarea = document.querySelector('[data-od-id="command-input"] textarea')
        return {
          chatText,
          toolText,
          statusText,
          inputValue: textarea ? textarea.value : null,
          eventTypes: events.map((event) => event.type),
          statuses: events.filter((event) => event.type === 'status').map((event) => event.status),
          textDeltaCount: events.filter((event) => event.type === 'text_delta').length,
          toolUseCount: events.filter((event) => event.type === 'tool_use').length,
          toolResultCount: events.filter((event) => event.type === 'tool_result').length,
          endTurnCount: events.filter((event) => event.type === 'end_turn').length,
          turnId
        }
      }

      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) {
          reject(error)
          return
        }
        setTimeout(() => resolve(readUi()), 160)
      }

      const off = window.nexus.onAgentEvent((event) => {
        if (!turnId && event.turnId) turnId = event.turnId
        events.push(event)
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })

      waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'ping')
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
          return waitFor(() => events.find((event) => event.type === 'status'))
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
        NEXUS_DB_PATH: path.join(tempDir, 'phase8.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase8-userData'),
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase8-smoke-mock',
        NEXUS_ANTHROPIC_BASE_URL: baseURL,
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
      reject(new Error(`phase8 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 16000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        reject(new Error(`phase8 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
        return
      }
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE8_CHILD_RESULT '))
      if (!line) {
        reject(new Error(`phase8 child produced no result\n${stdout}\n${stderr}`))
        return
      }
      resolve(JSON.parse(line.slice('PHASE8_CHILD_RESULT '.length)))
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
        summary: () => ({ requests, bodiesContainToolResult: bodies.some((body) => body.includes('tool_result')) }),
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function eventsFor(requestNumber) {
  if (requestNumber === 1) return toolUseEvents()
  return textEvents()
}

function messageStart() {
  return {
    type: 'message_start',
    message: {
      id: 'msg_phase8_smoke',
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

function toolUseEvents() {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_phase8', name: 'write_file', input: {} } },
    { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"path":"tmp.txt","content":"hello"}' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 8 } },
    { type: 'message_stop' },
  ]
}

function textEvents() {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong from phase8' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } },
    { type: 'message_stop' },
  ]
}

function assertSmokeResult(result) {
  const ui = result.ui
  if (!ui.chatText.includes('ping')) throw new Error(`ChatPanel missing user message: ${ui.chatText}`)
  if (!ui.chatText.includes('pong from phase8')) throw new Error(`ChatPanel missing assistant stream: ${ui.chatText}`)
  if (!ui.toolText.includes('写入文件') && !ui.toolText.includes('write_file')) {
    throw new Error(`ToolPanel missing write_file event: ${ui.toolText}`)
  }
  if (!ui.toolText.includes('tmp.txt')) throw new Error(`ToolPanel missing tool input path: ${ui.toolText}`)
  if (!ui.toolText.includes('stub') && !ui.toolText.includes('bytesWritten')) {
    throw new Error(`ToolPanel missing tool result output: ${ui.toolText}`)
  }
  if (!ui.statusText.includes('完成')) throw new Error(`StatusIndicator did not reach done: ${ui.statusText}`)
  if (ui.inputValue !== '') throw new Error(`CommandInput did not clear after send: ${ui.inputValue}`)
  if (ui.toolUseCount !== 1 || ui.toolResultCount !== 1) throw new Error('tool event counts did not sync')
  if (ui.textDeltaCount < 1 || ui.endTurnCount !== 1) throw new Error('text stream did not finish')
  if (result.mock.requests !== 2 || !result.mock.bodiesContainToolResult) {
    throw new Error('mock server did not receive tool_result continuation')
  }
}

function writeProjectFixture(project) {
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Phase 8 smoke project.\n')
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Respond tersely.\n')
}

function readMainLogTail(userData) {
  const file = path.join(userData, 'logs', 'main.log')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').trim().split('\n').slice(-10)
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
