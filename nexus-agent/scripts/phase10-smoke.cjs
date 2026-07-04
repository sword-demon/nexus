#!/usr/bin/env node

const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')
const alwaysArgs = ['test']

if (process.versions.electron) void runElectron()
else void runWrapper()

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase10-'))
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
    console.log(`PHASE10_SMOKE_RESULT ${JSON.stringify(result)}`)
  } finally {
    await server.close()
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function runElectron() {
  const { app, BrowserWindow } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')
  const { createProject, listProjects } = require('../dist-main/main/db/dao/projects.js')
  const { listPermissions } = require('../dist-main/main/db/dao/permissions.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
  registerIpcHandlers()
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 10 Smoke' })

  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 820,
    webPreferences: { preload: path.join(root, 'dist-main', 'preload', 'index.js'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  })
  await win.loadFile(path.join(root, 'dist', 'index.html'))
  await win.webContents.executeJavaScript(
    `window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`,
    true,
  )
  const ui = await exerciseMainWindow(win)
  const oncePath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'once.txt')
  const escPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'esc.txt')
  const rules = { rules: listProjects().flatMap((project) => listPermissions(project.id).map(decodeRule)) }

  console.log(`PHASE10_CHILD_RESULT ${JSON.stringify({
    ui,
    files: { once: fs.existsSync(oncePath) ? fs.readFileSync(oncePath, 'utf8') : null, escExists: fs.existsSync(escPath) },
    rules,
  })}`)
  win.destroy()
  closeDb()
  app.quit()
}

function decodeRule(record) {
  const index = record.rule.indexOf(':')
  return {
    toolName: index === -1 ? '' : record.rule.slice(0, index),
    pattern: index === -1 ? record.rule : record.rule.slice(index + 1),
    scope: record.scope,
  }
}

function exerciseMainWindow(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const events = []
      const permissionSnapshots = []
      let settled = false
      const timeout = setTimeout(() => finish(new Error('phase10 ui timed out')), 25000)

      const waitFor = (check, deadline = Date.now() + 5000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 40)).then(() => waitFor(check, deadline))
      }
      const clickButton = (label) => {
        const buttons = Array.from(document.querySelectorAll('[data-od-id="permission-prompt"] button'))
        const button = buttons.find((item) => item.textContent.includes(label))
        if (!button) throw new Error('missing permission button: ' + label)
        button.click()
      }
      const handlePermission = async (event) => {
        const prompt = await waitFor(() => document.querySelector('[data-od-id="permission-prompt"]'))
        const text = prompt.textContent || ''
        permissionSnapshots.push({
          toolName: event.request.toolName,
          input: event.request.input,
          hasAlways: text.includes('始终允许'),
          text,
        })
        const input = event.request.input || {}
        if (input.path === 'generated/once.txt') clickButton('允许一次')
        else if (input.command === 'pnpm' && Array.isArray(input.args) && input.args.includes('test')) clickButton('始终允许')
        else if (input.command === 'git') clickButton('拒绝')
        else if (input.path === 'generated/esc.txt') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        else clickButton('拒绝')
      }
      const readUi = () => ({
        chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
        toolText: document.querySelector('[data-od-id="tool-panel"]')?.textContent || '',
        statusText: document.querySelector('[data-od-id="status-indicator"]')?.textContent || '',
        eventTypes: events.map((event) => event.type),
        toolUseNames: events.filter((event) => event.type === 'tool_use').map((event) => event.toolName),
        toolUseCount: events.filter((event) => event.type === 'tool_use').length,
        toolResultCount: events.filter((event) => event.type === 'tool_result').length,
        toolErrors: events.filter((event) => event.type === 'tool_result' && !event.ok).map((event) => event.error),
        permissionSnapshots,
        endTurnCount: events.filter((event) => event.type === 'end_turn').length,
      })
      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) reject(error)
        else setTimeout(() => resolve(readUi()), 180)
      }
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'permission_request') void handlePermission(event).catch(finish)
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })
      waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'phase10')
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
        })
        .catch(finish)
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
        NEXUS_DB_PATH: path.join(tempDir, 'phase10.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase10-userData'),
        NEXUS_PERMISSIONS_PATH: permissionsPath,
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase10-smoke-mock',
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
      reject(new Error(`phase10 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 30000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`phase10 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((s) => s.startsWith('PHASE10_CHILD_RESULT '))
      if (!line) return reject(new Error(`phase10 child produced no result\n${stdout}\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE10_CHILD_RESULT '.length)))
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
        summary: () => ({ requests, bodiesContainToolResults: bodies.filter((body) => body.includes('tool_result')).length }),
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function eventsFor(requestNumber) {
  const calls = [
    ['write_file', { path: 'generated/once.txt', content: 'once' }],
    ['exec', { command: 'pnpm', args: alwaysArgs, cwd: '.' }],
    ['exec', { command: 'pnpm', args: alwaysArgs, cwd: '.' }],
    ['exec', { command: 'git', args: ['push', '-u', 'origin', 'main'], cwd: '.' }],
    ['write_file', { path: 'generated/esc.txt', content: 'esc' }],
  ]
  const call = calls[requestNumber - 1]
  if (call) return toolUseEvents(`toolu_phase10_${requestNumber}`, call[0], call[1])
  return textEvents()
}

function messageStart() {
  return {
    type: 'message_start',
    message: {
      id: 'msg_phase10_smoke',
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
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'phase10 done' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } },
    { type: 'message_stop' },
  ]
}

function assertSmokeResult(result) {
  const ui = result.ui
  const rejected = ui.toolErrors.filter((error) => error === 'rejected').length
  const rules = result.rules.rules || []
  if (ui.toolUseCount !== 5 || ui.toolResultCount !== 5) throw new Error('tool event counts did not sync')
  if (ui.permissionSnapshots.length !== 4) throw new Error(`unexpected permission prompts: ${ui.permissionSnapshots.length}`)
  if (ui.permissionSnapshots.filter((item) => item.input.command === 'pnpm').length !== 1) {
    throw new Error('always-allow rule did not suppress repeated exec prompt')
  }
  if (ui.permissionSnapshots.find((item) => item.input.command === 'git')?.hasAlways) {
    throw new Error('dangerous git push exposed always-allow')
  }
  if (rejected !== 2 || !ui.toolText.includes('已拒绝') || !ui.toolText.includes('rejected')) {
    throw new Error(`rejected state missing: ${ui.toolText}`)
  }
  if (result.files.once !== 'once' || result.files.escExists) throw new Error('write permission decisions were not enforced')
  if (rules.length !== 1 || rules[0].toolName !== 'exec' || rules[0].pattern !== 'pnpm test') {
    throw new Error(`unexpected permission rules: ${JSON.stringify(rules)}`)
  }
  if (!ui.chatText.includes('phase10 done')) throw new Error(`missing final text: ${ui.chatText}`)
  if (result.mock.requests !== 6 || result.mock.bodiesContainToolResults !== 5) {
    throw new Error(`mock server did not receive all tool results: ${JSON.stringify(result.mock)}`)
  }
}

function writeProject(project) {
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Phase 10 smoke project.\n'); fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Respond with permission-sensitive tool calls.\n')
  fs.mkdirSync(path.join(project, 'bin'), { recursive: true }); fs.writeFileSync(path.join(project, 'bin', 'pnpm'), '#!/bin/sh\necho always-ok\n'); fs.chmodSync(path.join(project, 'bin', 'pnpm'), 0o755)
}

function assertBuilt() {
  for (const file of [path.join(root, 'dist', 'index.html'), path.join(root, 'dist-main', 'main', 'ipc.js'), path.join(root, 'dist-main', 'preload', 'index.js')]) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run npm run electron:build first.`)
  }
}
