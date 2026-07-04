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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase6-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  fs.mkdirSync(home, { recursive: true })
  writeProjectFixture(project)

  const missingKey = await runChild(electron, tempDir, home, project, { mode: 'missing-key' })

  const mockStreamServer = await startMockStreamServer()
  const mockStream = await runChild(electron, tempDir, home, project, {
    mode: 'mock-stream',
    baseURL: mockStreamServer.baseURL,
    apiKey: 'sk-ant-phase6-smoke-mock',
  })
  mockStream.mockRequests = mockStreamServer.requests()
  await mockStreamServer.close()

  const mockServer = await startMockServer(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid api key' } })
  const mock401 = await runChild(electron, tempDir, home, project, {
    mode: 'mock-401',
    baseURL: mockServer.baseURL,
    apiKey: 'sk-ant-phase6-smoke-mock',
  })
  mock401.mockRequests = mockServer.requests()
  await mockServer.close()

  const mock500Server = await startMockServer(500, { type: 'error', error: { type: 'api_error', message: 'server exploded' } })
  const mock500 = await runChild(electron, tempDir, home, project, {
    mode: 'mock-500',
    baseURL: mock500Server.baseURL,
    apiKey: 'sk-ant-phase6-smoke-mock',
  })
  mock500.mockRequests = mock500Server.requests()
  await mock500Server.close()

  const network = await runChild(electron, tempDir, home, project, {
    mode: 'network',
    baseURL: await getClosedBaseURL(),
    apiKey: 'sk-ant-phase6-smoke-mock',
  })

  const realApiKey = process.env.ANTHROPIC_API_KEY
  const real = realApiKey
    ? await runChild(electron, tempDir, home, project, { mode: 'real', apiKey: realApiKey })
    : { skipped: true, reason: 'ANTHROPIC_API_KEY not set' }

  const result = { missingKey, mockStream, mock401, mock500, network, real }
  assertSmokeResult(result)
  console.log(`PHASE6_SMOKE_RESULT ${JSON.stringify(result)}`)
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
  await win.loadURL('data:text/html,<html><body>phase6</body></html>')

  if (process.env.NEXUS_SMOKE_API_KEY) {
    await win.webContents.executeJavaScript(
      `window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`,
      true,
    )
  }

  const mode = process.env.NEXUS_SMOKE_MODE
  const projectPath = process.env.NEXUS_SMOKE_PROJECT
  const first = await collectTurn(win, projectPath, 'ping')
  const second = mode === 'real' ? await collectTurn(win, projectPath, 'ping again') : null
  await delay(50)
  const logTail = readMainLogTail(process.env.NEXUS_SMOKE_USER_DATA)

  console.log(`PHASE6_CHILD_RESULT ${JSON.stringify({
    mode,
    first,
    second,
    logTail,
  })}`)

  win.destroy()
  closeDb()
  app.quit()
}

function collectTurn(win, projectPath, text) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const events = []
      let turnId = null
      const done = () => {
        off()
        resolve({
          turnId,
          eventTypes: events.map((event) => event.type),
          errorCodes: events.filter((event) => event.type === 'error').map((event) => event.code),
          textDeltaCount: events.filter((event) => event.type === 'text_delta').length,
          endTurnCount: events.filter((event) => event.type === 'end_turn').length
        })
      }
      const timeout = setTimeout(done, 30000)
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'error' || event.type === 'end_turn') {
          clearTimeout(timeout)
          done()
        }
      })
      window.nexus.sendMessage({ text: ${JSON.stringify(text)}, projectPath: ${JSON.stringify(projectPath)} })
        .then((res) => { turnId = res.turnId })
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
        NEXUS_SMOKE_API_KEY: options.apiKey || '',
        NEXUS_ANTHROPIC_BASE_URL: options.baseURL || '',
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`phase6 child ${options.mode} failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
        return
      }
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE6_CHILD_RESULT '))
      if (!line) {
        reject(new Error(`phase6 child ${options.mode} produced no result\n${stdout}\n${stderr}`))
        return
      }
      resolve(JSON.parse(line.slice('PHASE6_CHILD_RESULT '.length)))
    })
  })
}

function startMockServer(status, body) {
  let requests = 0
  const server = http.createServer((_req, res) => {
    requests += 1
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        baseURL: `http://127.0.0.1:${address.port}`,
        requests: () => requests,
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function startMockStreamServer() {
  let requests = 0
  const server = http.createServer((_req, res) => {
    requests += 1
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    for (const event of mockStreamEvents()) {
      res.write(`event: ${event.type}\n`)
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
    res.end()
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        baseURL: `http://127.0.0.1:${address.port}`,
        requests: () => requests,
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function mockStreamEvents() {
  return [
    {
      type: 'message_start',
      message: {
        id: 'msg_phase6_smoke',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 2048,
          output_tokens: 1,
          cache_creation_input_tokens: 1024,
          cache_read_input_tokens: 0,
        },
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong' } },
    { type: 'content_block_stop', index: 0 },
    {
      type: 'message_delta',
      delta: { stop_reason: 'end_turn', stop_sequence: null },
      usage: { output_tokens: 2 },
    },
    { type: 'message_stop' },
  ]
}

function getClosedBaseURL() {
  const server = http.createServer((_req, res) => {
    res.writeHead(204)
    res.end()
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const baseURL = `http://127.0.0.1:${address.port}`
      server.close(() => resolve(baseURL))
    })
  })
}

function assertSmokeResult(result) {
  assertError(result.missingKey, 'missing-key', 'api_key_missing')
  assertStreamTurn(result.mockStream, 'mock-stream')
  assertError(result.mock401, 'mock-401', 'auth')
  assertError(result.mock500, 'mock-500', 'server')
  assertError(result.network, 'network', 'network')
  assertRequests(result.mockStream, 'mock-stream')
  assertRequests(result.mock401, 'mock-401')
  assertRequests(result.mock500, 'mock-500')
  if (!result.real.skipped) {
    assertRealTurn(result.real)
  }
}

function assertError(child, label, code) {
  if (!child.first.errorCodes.includes(code)) {
    throw new Error(`${label}: expected error code ${code}, got ${JSON.stringify(child.first)}`)
  }
}

function assertRequests(child, label) {
  if (child.mockRequests < 1) {
    throw new Error(`${label}: expected at least one mock request, got ${child.mockRequests}`)
  }
}

function assertStreamTurn(child, label) {
  if (child.first.textDeltaCount < 1 || child.first.endTurnCount < 1) {
    throw new Error(`${label}: expected text_delta and end_turn, got ${JSON.stringify(child.first)}`)
  }
  const logText = child.logTail.join('\n')
  if (!logText.includes('"cacheCreationInputTokens":1024')) {
    throw new Error(`${label}: expected cache token metadata in log tail, got ${logText}`)
  }
}

function assertRealTurn(child) {
  if (child.first.textDeltaCount < 1 || child.first.endTurnCount < 1) {
    throw new Error(`real: expected text_delta and end_turn, got ${JSON.stringify(child.first)}`)
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function writeProjectFixture(project) {
  fs.mkdirSync(project, { recursive: true })
  const longText = Array.from({ length: 260 }, (_, i) => `cache line ${i}: keep this project instruction stable.`).join('\n')
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), longText)
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Respond concisely for smoke tests.\n')
}

function readMainLogTail(userData) {
  const file = path.join(userData, 'logs', 'main.log')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').trim().split('\n').slice(-8)
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
