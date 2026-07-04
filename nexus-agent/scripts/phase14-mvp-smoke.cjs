#!/usr/bin/env node

const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')
const mvpContent = 'PHASE14_MVP_OK\n'

if (process.versions.electron) void runElectron()
else void runWrapper()

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase14-'))
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
    console.log(`PHASE14_MVP_SMOKE_RESULT ${JSON.stringify(result)}`)
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
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 14 MVP' })

  const win = new BrowserWindow({
    show: false,
    width: 1360,
    height: 900,
    webPreferences: {
      preload: path.join(root, 'dist-main', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })
  await win.loadFile(path.join(root, 'dist', 'index.html'))
  const apiKeyResult = await win.webContents.executeJavaScript(`window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`, true)
  if (apiKeyResult.status !== 'ok') throw new Error(`setApiKey failed: ${JSON.stringify(apiKeyResult)}`)
  const ui = await exerciseMainWindow(win)
  const changedPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'mvp.txt')

  console.log(`PHASE14_CHILD_RESULT ${JSON.stringify({
    ui,
    file: fs.existsSync(changedPath) ? fs.readFileSync(changedPath, 'utf8') : null,
    permissionsPath: process.env.NEXUS_PERMISSIONS_PATH,
  })}`)
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
      const timeout = setTimeout(() => finish(new Error('phase14 ui timed out')), 30000)

      const waitFor = (check, deadline = Date.now() + 8000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 50)).then(() => waitFor(check, deadline))
      }
      const clickButton = (label) => {
        const button = Array.from(document.querySelectorAll('[data-od-id="permission-prompt"] button'))
          .find((item) => item.textContent.includes(label))
        if (!button) throw new Error('missing permission button: ' + label)
        button.click()
      }
      const handlePermission = async (event) => {
        const prompt = await waitFor(() => document.querySelector('[data-od-id="permission-prompt"]'))
        permissionSnapshots.push({ toolName: event.request.toolName, input: event.request.input, text: prompt.textContent || '' })
        clickButton('允许一次')
      }
      const readUi = async () => {
        await waitFor(() => document.querySelector('[data-od-id="tool-panel"]'))
        const toolResults = events.filter((event) => event.type === 'tool_result')
        const projects = await window.nexus.getProjects()
        const sessions = projects.projects[0] ? await window.nexus.getSessions({ projectId: projects.projects[0].id }) : { sessions: [] }
        const messages = sessions.sessions[0] ? await window.nexus.getMessages({ sessionId: sessions.sessions[0].id }) : { messages: [] }
        return {
          chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
          toolText: (document.querySelector('[data-od-id="tool-panel"]')?.textContent || '').slice(0, 1200),
          toolUseNames: events.filter((event) => event.type === 'tool_use').map((event) => event.toolName),
          toolUseCount: events.filter((event) => event.type === 'tool_use').length,
          toolResultCount: toolResults.length,
          execResults: toolResults.filter((event) => event.output?.command === 'npm').map((event) => event.output),
          permissionSnapshots,
          endTurnCount: events.filter((event) => event.type === 'end_turn').length,
          persistedMessages: messages.messages.map((message) => ({ role: message.role, content: message.content })),
        }
      }
      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) reject(error)
        else setTimeout(() => readUi().then(resolve, reject), 300)
      }
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'permission_request') void handlePermission(event).catch(finish)
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })
      waitFor(() => document.querySelector('[data-od-id="status-bar"]')?.textContent.includes('Phase 14 MVP'))
        .then(() => waitFor(() => document.querySelector('[data-od-id="command-input"] textarea')))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'phase14 mvp: run /prd then /goal, update one file, then npm test')
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
        NEXUS_CLAUDE_HOME: home,
        NEXUS_DB_PATH: path.join(tempDir, 'phase14.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase14-userData'),
        NEXUS_PERMISSIONS_PATH: permissionsPath,
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase14-smoke-mock',
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
      reject(new Error(`phase14 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 45000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`phase14 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((item) => item.startsWith('PHASE14_CHILD_RESULT '))
      if (!line) return reject(new Error(`phase14 child produced no result\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE14_CHILD_RESULT '.length)))
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
  if (requestNumber === 1) {
    return textAndToolEvents('/prd Phase 14 MVP: create generated/mvp.txt and prove it with npm test. /goal execute now.\\n', 'toolu_phase14_write', 'write_file', { path: 'generated/mvp.txt', content: mvpContent })
  }
  if (requestNumber === 2) return toolEvents('toolu_phase14_exec', 'exec', { command: 'npm', args: ['test'], cwd: '.' })
  return textEvents('/goal complete: changed one file and npm test is green.')
}

function messageStart() {
  return { type: 'message_start', message: { id: 'msg_phase14_smoke', type: 'message', role: 'assistant', content: [], model: 'claude-3-5-sonnet-20241022', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1, cache_creation_input_tokens: null, cache_read_input_tokens: null } } }
}

function textAndToolEvents(text, id, name, input) {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    { type: 'content_block_stop', index: 0 },
    ...toolBlock(1, id, name, input),
    { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 12 } },
    { type: 'message_stop' },
  ]
}

function toolEvents(id, name, input) {
  return [messageStart(), ...toolBlock(0, id, name, input), { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 8 } }, { type: 'message_stop' }]
}

function toolBlock(index, id, name, input) {
  return [
    { type: 'content_block_start', index, content_block: { type: 'tool_use', id, name, input: {} } },
    { type: 'content_block_delta', index, delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) } },
    { type: 'content_block_stop', index },
  ]
}

function textEvents(text) {
  return [messageStart(), { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }, { type: 'content_block_stop', index: 0 }, { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 4 } }, { type: 'message_stop' }]
}

function assertSmokeResult(result) {
  const ui = result.ui
  const exec = ui.execResults[0]
  if (ui.toolUseCount !== 2 || ui.toolResultCount !== 2) throw new Error(`tool event counts did not sync: ${JSON.stringify(ui)}`)
  if (!ui.toolUseNames.includes('write_file') || !ui.toolUseNames.includes('exec')) throw new Error(`missing tool calls: ${JSON.stringify(ui)}`)
  if (ui.permissionSnapshots.length !== 2) throw new Error(`unexpected permission prompt count: ${ui.permissionSnapshots.length}`)
  if (!ui.chatText.includes('/prd') || !ui.chatText.includes('/goal')) throw new Error(`workflow text missing: ${ui.chatText}`)
  if (ui.persistedMessages.length !== 2 || ui.persistedMessages[0].role !== 'user' || ui.persistedMessages[1].role !== 'assistant' || !ui.persistedMessages[1].content.includes('/goal complete')) throw new Error(`messages were not persisted: ${JSON.stringify(ui.persistedMessages)}`)
  if (!ui.toolText.includes('写入文件') || !ui.toolText.includes('执行命令')) throw new Error(`ToolPanel did not show tool flow: ${ui.toolText}`)
  if (result.file !== mvpContent) throw new Error(`changed file mismatch: ${JSON.stringify(result.file)}`)
  if (!exec || exec.exitCode !== 0 || !exec.stdout.includes('PHASE14_NPM_TEST_GREEN')) throw new Error(`npm test did not pass: ${JSON.stringify(exec)}`)
  if (result.mock.requests !== 3 || result.mock.bodiesContainToolResults !== 2) throw new Error(`mock request/tool-result chain incomplete: ${JSON.stringify(result.mock)}`)
}

function writeProject(project) {
  fs.mkdirSync(path.join(project, 'generated'), { recursive: true })
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ scripts: { test: 'node test.js' } }, null, 2))
  fs.writeFileSync(path.join(project, 'test.js'), `const fs = require('node:fs')\nconst value = fs.readFileSync('generated/mvp.txt', 'utf8')\nif (!value.includes('PHASE14_MVP_OK')) throw new Error('missing generated file content')\nconsole.log('PHASE14_NPM_TEST_GREEN')\n`)
  fs.writeFileSync(path.join(project, 'AGENTS.md'), '# Phase 14 MVP smoke project\n')
  fs.writeFileSync(path.join(project, 'CLAUDE.md'), 'Use /prd then /goal before editing files.\n')
}

function assertBuilt() {
  for (const item of ['dist/index.html', 'dist-main/main/index.js', 'dist-main/preload/index.js']) {
    if (!fs.existsSync(path.join(root, item))) throw new Error(`missing build artifact: ${item}. Run npm run electron:build first.`)
  }
}
