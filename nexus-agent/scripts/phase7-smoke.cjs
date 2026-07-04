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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase7-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  fs.mkdirSync(home, { recursive: true })
  writeProjectFixture(project)

  const singleServer = await startMockServer('single')
  const single = await runChild(electron, tempDir, home, project, { mode: 'single', baseURL: singleServer.baseURL })
  single.mock = singleServer.summary()
  await singleServer.close()

  const toolServer = await startMockServer('tool')
  const tool = await runChild(electron, tempDir, home, project, { mode: 'tool', baseURL: toolServer.baseURL })
  tool.mock = toolServer.summary()
  await toolServer.close()

  const abortServer = await startMockServer('abort')
  const abort = await runChild(electron, tempDir, home, project, { mode: 'abort', baseURL: abortServer.baseURL })
  abort.mock = abortServer.summary()
  await abortServer.close()

  const result = { single, tool, abort }
  assertSmokeResult(result)
  console.log(`PHASE7_SMOKE_RESULT ${JSON.stringify(result)}`)
  fs.rmSync(tempDir, { recursive: true, force: true })
}

async function runElectron() {
  const { app, BrowserWindow } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
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
  await win.loadFile(path.join(root, 'dist', 'index.html'))
  await win.webContents.executeJavaScript(
    `window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`,
    true,
  )

  const mode = process.env.NEXUS_SMOKE_MODE
  const turn = await collectTurn(win, process.env.NEXUS_SMOKE_PROJECT, mode)
  const logTail = readMainLogTail(process.env.NEXUS_SMOKE_USER_DATA)

  console.log(`PHASE7_CHILD_RESULT ${JSON.stringify({ mode, turn, logTail })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function collectTurn(win, projectPath, mode) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const events = []
      let turnId = null
      let stopResponse = null
      const done = () => {
        off()
        const statusText = document.querySelector('[data-od-id="status-indicator"]')?.textContent || ''
        resolve({
          turnId,
          stopResponse,
          eventTypes: events.map((event) => event.type),
          statuses: events.filter((event) => event.type === 'status').map((event) => event.status),
          errorCodes: events.filter((event) => event.type === 'error').map((event) => event.code),
          textDeltaCount: events.filter((event) => event.type === 'text_delta').length,
          toolUseCount: events.filter((event) => event.type === 'tool_use').length,
          toolResultCount: events.filter((event) => event.type === 'tool_result').length,
          endTurnCount: events.filter((event) => event.type === 'end_turn').length,
          statusText
        })
      }
      const timeout = setTimeout(done, 10000)
      const finishSoon = () => {
        clearTimeout(timeout)
        setTimeout(done, 80)
      }
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'error' || event.type === 'end_turn') finishSoon()
      })
      window.nexus.sendMessage({ text: 'ping', projectPath: ${JSON.stringify(projectPath)} })
        .then((res) => {
          turnId = res.turnId
          if (${JSON.stringify(mode)} === 'abort') {
            setTimeout(async () => {
              stopResponse = await window.nexus.stopAgent({ turnId })
            }, 80)
          }
        })
    })
  `, true)
}

function runChild(electron, tempDir, home, project, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [__filename], {
      cwd: root,
      env: {
        ...process.env,
        NEXUS_CLAUDE_HOME: home,
        NEXUS_DB_PATH: path.join(tempDir, `${options.mode}.db`),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, `${options.mode}-userData`),
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_MODE: options.mode,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase7-smoke-mock',
        NEXUS_ANTHROPIC_BASE_URL: options.baseURL,
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
      reject(new Error(`phase7 child ${options.mode} timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 15000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        reject(new Error(`phase7 child ${options.mode} failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
        return
      }
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE7_CHILD_RESULT '))
      if (!line) {
        reject(new Error(`phase7 child ${options.mode} produced no result\n${stdout}\n${stderr}`))
        return
      }
      resolve(JSON.parse(line.slice('PHASE7_CHILD_RESULT '.length)))
    })
  })
}

function startMockServer(mode) {
  let requests = 0
  const bodies = []
  const sockets = new Set()
  const server = http.createServer((req, res) => {
    requests += 1
    sockets.add(res)
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      bodies.push(body)
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      for (const event of eventsFor(mode, requests)) {
        res.write(`event: ${event.type}\n`)
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      }
      if (mode !== 'abort') res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        baseURL: `http://127.0.0.1:${address.port}`,
        summary: () => ({ requests, bodiesContainToolResult: bodies.some((body) => body.includes('tool_result')) }),
        close: () => new Promise((done) => {
          for (const res of sockets) res.destroy()
          server.close(done)
        }),
      })
    })
  })
}

function eventsFor(mode, requestNumber) {
  if (mode === 'tool' && requestNumber === 1) return toolUseEvents()
  if (mode === 'abort') return [messageStart()]
  return textEvents()
}

function messageStart() {
  return {
    type: 'message_start',
    message: {
      id: 'msg_phase7_smoke',
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

function textEvents() {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } },
    { type: 'message_stop' },
  ]
}

function toolUseEvents() {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_phase7', name: 'write_file', input: {} } },
    { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"path":"tmp.txt","content":"hello"}' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 8 } },
    { type: 'message_stop' },
  ]
}

function assertSmokeResult(result) {
  assertTurn(result.single.turn, 'single', ['thinking', 'streaming', 'done'])
  if (result.single.turn.textDeltaCount < 1 || result.single.turn.endTurnCount !== 1) throw new Error('single turn did not finish')
  if (!result.single.turn.statusText.includes('完成')) throw new Error(`single status did not sync to UI: ${result.single.turn.statusText}`)
  assertTurn(result.tool.turn, 'tool', ['thinking', 'streaming', 'executing', 'streaming', 'done'])
  if (result.tool.turn.toolUseCount !== 1 || result.tool.turn.toolResultCount !== 1) throw new Error('tool turn missed tool events')
  if (result.tool.mock.requests !== 2 || !result.tool.mock.bodiesContainToolResult) throw new Error('tool turn did not continue with tool_result')
  if (!result.abort.turn.stopResponse?.abortedTurnIds?.includes(result.abort.turn.turnId)) throw new Error('abort did not report aborted turn id')
  if (!result.abort.turn.errorCodes.includes('aborted')) throw new Error('abort did not emit aborted error')
  if (!result.abort.turn.statusText.includes('错误')) throw new Error(`abort status did not sync to UI: ${result.abort.turn.statusText}`)
}

function assertTurn(turn, label, statuses) {
  const actual = turn.statuses.join('>')
  const expected = statuses.join('>')
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`)
}

function writeProjectFixture(project) {
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Phase 7 smoke project.\n')
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
