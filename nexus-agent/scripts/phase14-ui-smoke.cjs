#!/usr/bin/env node

const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.join(__dirname, '..')

if (process.versions.electron) runElectron().catch((error) => {
  console.error(error)
  process.exit(1)
})
else runWrapper().catch((error) => {
  console.error(error)
  process.exit(1)
})

async function runWrapper() {
  assertBuilt()
  const electron = require('electron')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-ui-smoke-'))
  const project = path.join(tempDir, 'ui-smoke-project')
  const dbPath = path.join(tempDir, 'ui-smoke.db')
  const userData = path.join(tempDir, 'userData')
  const home = path.join(tempDir, 'home')
  fs.mkdirSync(home, { recursive: true })
  writeProject(project)

  const server = await startMockServer()
  try {
    const first = await runChild(electron, { mode: 'first', project, dbPath, userData, home, baseURL: server.baseURL })
    const restore = await runChild(electron, { mode: 'restore', project, dbPath, userData, home, baseURL: server.baseURL })
    const result = { first, restore, mock: server.summary() }
    try {
      assertResult(result)
    } catch (error) {
      console.error(`PHASE14_UI_DEBUG ${JSON.stringify(result)}`)
      throw error
    }
    console.log(`PHASE14_UI_SMOKE_RESULT ${JSON.stringify(result)}`)
  } finally {
    await server.close()
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function runElectron() {
  const { app, BrowserWindow, dialog } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb } = require('../dist-main/main/db/index.js')
  const { listProjects } = require('../dist-main/main/db/dao/projects.js')
  const { listPermissions } = require('../dist-main/main/db/dao/permissions.js')
  const { loadPromptContext } = require('../dist-main/main/skills/loader.js')

  Object.defineProperty(dialog, 'showOpenDialog', {
    value: async () => ({ canceled: false, filePaths: [process.env.NEXUS_SMOKE_PROJECT] }),
  })

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
  registerIpcHandlers()

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
  const key = await win.webContents.executeJavaScript(`window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`, true)
  if (key.status !== 'ok') throw new Error(`setApiKey failed: ${JSON.stringify(key)}`)

  const context = await loadPromptContext(process.env.NEXUS_SMOKE_PROJECT)
  console.log(`PHASE14_UI_CONTEXT ${JSON.stringify(context.skills.map((skill) => ({ name: skill.name, scope: skill.scope, allowedTools: skill.allowedTools })))}`)
  const ui = process.env.NEXUS_UI_SMOKE_MODE === 'first'
    ? await exerciseFirstWindow(win)
    : await exerciseRestoreWindow(win)
  const projects = listProjects()
  const rules = projects.flatMap((project) => listPermissions(project.id).map(decodeRule))
  const allowedPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'allowed.txt')
  const deniedPath = path.join(process.env.NEXUS_SMOKE_PROJECT, 'generated', 'denied.txt')

  console.log(`PHASE14_UI_CHILD_RESULT ${JSON.stringify({
    ui,
    rules,
    contextSkills: context.skills.map((skill) => ({ name: skill.name, scope: skill.scope, allowedTools: skill.allowedTools })),
    files: {
      allowed: fs.existsSync(allowedPath) ? fs.readFileSync(allowedPath, 'utf8') : null,
      deniedExists: fs.existsSync(deniedPath),
    },
    logTail: readLogTail(),
  })}`)
  win.destroy()
  closeDb()
  app.quit()
}

function readLogTail() {
  const file = path.join(process.env.NEXUS_SMOKE_USER_DATA, 'logs', 'main.log')
  if (!fs.existsSync(file)) return ''
  return fs.readFileSync(file, 'utf8').split('\n').slice(-8).join('\n')
}

function exerciseFirstWindow(win) {
  return win.webContents.executeJavaScript(`
    (async () => {
      const waitFor = (check, deadline = Date.now() + 8000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 50)).then(() => waitFor(check, deadline))
      }
      const clickPermission = async (label) => {
        const prompt = await waitFor(() => document.querySelector('[data-od-id="permission-prompt"]'))
        const button = Array.from(prompt.querySelectorAll('button')).find((item) => item.textContent.includes(label))
        if (!button) throw new Error('missing permission button: ' + label)
        button.click()
      }
      const readState = async () => {
        const projects = await window.nexus.getProjects()
        const sessions = projects.projects[0] ? await window.nexus.getSessions({ projectId: projects.projects[0].id }) : { sessions: [] }
        const messages = sessions.sessions[0] ? await window.nexus.getMessages({ sessionId: sessions.sessions[0].id }) : { messages: [] }
        return {
          projects: projects.projects.map((project) => ({ path: project.path, displayName: project.displayName })),
          sessions: sessions.sessions.map((session) => ({ title: session.title })),
          messages: messages.messages.map((message) => ({ role: message.role, content: message.content })),
        }
      }
      const submit = async (text) => {
        const textarea = await waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        textarea.focus()
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
        setter.call(textarea, text)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
      }
      const collectTurn = (text, permissionLabel) => new Promise((resolve, reject) => {
        const events = []
        const timeout = setTimeout(() => finish(new Error('turn timed out')), 25000)
        let settled = false
        const off = window.nexus.onAgentEvent((event) => {
          events.push(event)
          if (event.type === 'permission_request') void clickPermission(permissionLabel).catch(finish)
          if (event.type === 'end_turn' || event.type === 'error') finish()
        })
        const finish = (error) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          off()
          if (error) reject(error)
          else setTimeout(() => readState().then((state) => resolve({ events, state }), reject), 250)
        }
        void submit(text).catch(finish)
      })

      const addButton = await waitFor(() => Array.from(document.querySelectorAll('button')).find((item) => item.textContent.includes('添加项目') || item.title === '添加项目'))
      addButton.click()
      await waitFor(() => (document.querySelector('[data-od-id="status-bar"]')?.textContent || '').includes('ui-smoke-project'))
      const addedState = await readState()
      const turn = await collectTurn('ui smoke first: write generated/allowed.txt', '始终允许')
      return {
        addedState,
        turn,
        chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
        toolText: document.querySelector('[data-od-id="tool-panel"]')?.textContent || '',
      }
    })()
  `, true)
}

function exerciseRestoreWindow(win) {
  return win.webContents.executeJavaScript(`
    (async () => {
      const waitFor = (check, deadline = Date.now() + 10000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 50)).then(() => waitFor(check, deadline))
      }
      const readState = async () => {
        const projects = await window.nexus.getProjects()
        const sessions = projects.projects[0] ? await window.nexus.getSessions({ projectId: projects.projects[0].id }) : { sessions: [] }
        const messages = sessions.sessions[0] ? await window.nexus.getMessages({ sessionId: sessions.sessions[0].id }) : { messages: [] }
        return {
          projects: projects.projects.map((project) => ({ path: project.path, displayName: project.displayName })),
          sessions: sessions.sessions.map((session) => ({ title: session.title })),
          messages: messages.messages.map((message) => ({ role: message.role, content: message.content })),
        }
      }
      const submit = async (text) => {
        const textarea = await waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        textarea.focus()
        const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
        setter.call(textarea, text)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))
      }
      const collectTurn = (text) => new Promise((resolve, reject) => {
        const events = []
        const timeout = setTimeout(() => finish(new Error('turn timed out')), 25000)
        let settled = false
        const off = window.nexus.onAgentEvent((event) => {
          events.push(event)
          if (event.type === 'permission_request') finish(new Error('read-only skill requested permission instead of denying tool'))
          if (event.type === 'end_turn' || event.type === 'error') finish()
        })
        const finish = (error) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          off()
          if (error) reject(error)
          else setTimeout(() => readState().then((state) => resolve({ events, state }), reject), 250)
        }
        void submit(text).catch(finish)
      })

      await waitFor(() => (document.querySelector('[data-od-id="status-bar"]')?.textContent || '').includes('ui-smoke-project'))
      await waitFor(() => (document.querySelector('[data-od-id="chat-panel"]')?.textContent || '').includes('ui smoke first done'))
      const restored = await readState()
      const denied = await collectTurn('/readonly try to write generated/denied.txt')
      return {
        restored,
        denied,
        chatText: document.querySelector('[data-od-id="chat-panel"]')?.textContent || '',
        toolText: document.querySelector('[data-od-id="tool-panel"]')?.textContent || '',
      }
    })()
  `, true)
}

function runChild(electron, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(electron, [__filename], {
      cwd: root,
      env: {
        ...process.env,
        NEXUS_CLAUDE_HOME: env.home,
        NEXUS_DB_PATH: env.dbPath,
        NEXUS_SMOKE_USER_DATA: env.userData,
        NEXUS_SMOKE_PROJECT: env.project,
        NEXUS_UI_SMOKE_MODE: env.mode,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase14-ui-smoke-mock',
        NEXUS_ANTHROPIC_BASE_URL: env.baseURL,
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
      reject(new Error(`ui smoke child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 45000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`ui smoke child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((item) => item.startsWith('PHASE14_UI_CHILD_RESULT '))
      if (!line) return reject(new Error(`ui smoke child produced no result\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE14_UI_CHILD_RESULT '.length)))
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
        summary: () => ({ requests, toolNamesByRequest: bodies.map(toolNamesFromBody) }),
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function eventsFor(requestNumber) {
  if (requestNumber === 1) {
    return textAndToolEvents('UI smoke first turn.\n', 'toolu_ui_allowed', 'write_file', { path: 'generated/allowed.txt', content: 'ALWAYS_OK\n' })
  }
  if (requestNumber === 2) return textEvents('ui smoke first done')
  if (requestNumber === 3) {
    return toolEvents('toolu_ui_denied', 'write_file', { path: 'generated/denied.txt', content: 'DENIED\\n' })
  }
  return textEvents('readonly denied done')
}

function messageStart() {
  return { type: 'message_start', message: { id: 'msg_phase14_ui_smoke', type: 'message', role: 'assistant', content: [], model: 'claude-3-5-sonnet-20241022', stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1, cache_creation_input_tokens: null, cache_read_input_tokens: null } } }
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

function textEvents(text) {
  return [
    messageStart(),
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 4 } },
    { type: 'message_stop' },
  ]
}

function toolBlock(index, id, name, input) {
  return [
    { type: 'content_block_start', index, content_block: { type: 'tool_use', id, name, input: {} } },
    { type: 'content_block_delta', index, delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) } },
    { type: 'content_block_stop', index },
  ]
}

function assertResult(result) {
  const firstMessages = result.first.ui.turn.state.messages
  const restoredMessages = result.restore.ui.restored.messages
  const deniedEvents = result.restore.ui.denied.events
  const deniedResult = deniedEvents.find((event) => event.type === 'tool_result')
  const readonlyRequestTools = result.mock.toolNamesByRequest[2] || []

  if (result.first.ui.addedState.projects.length !== 1) throw new Error('add project UI did not create project')
  if (!result.first.files.allowed?.includes('ALWAYS_OK')) throw new Error('allowed write did not happen')
  if (!result.first.rules.some((rule) => rule.toolName === 'write_file' && rule.pattern === 'generated/allowed.txt' && rule.scope === 'always')) {
    throw new Error(`always-allow rule not in SQLite: ${JSON.stringify(result.first.rules)}`)
  }
  if (firstMessages.length !== 2 || !firstMessages[1].content.includes('ui smoke first done')) {
    throw new Error(`first turn messages not persisted: ${JSON.stringify(firstMessages)}`)
  }
  if (!restoredMessages.some((message) => message.content.includes('ui smoke first done'))) {
    throw new Error(`restart did not restore history: ${JSON.stringify(restoredMessages)}`)
  }
  if (!deniedResult || deniedResult.ok || !String(deniedResult.error).includes('not allowed')) {
    throw new Error(`read-only skill did not reject write_file: ${JSON.stringify(deniedEvents)}`)
  }
  if (result.restore.files.deniedExists) throw new Error('read-only denied file was written')
  if (readonlyRequestTools.includes('write_file') || !readonlyRequestTools.includes('read_file')) {
    throw new Error(`readonly request exposed wrong tools: ${JSON.stringify(readonlyRequestTools)}`)
  }
  if (result.mock.requests !== 4) throw new Error(`unexpected mock request count: ${result.mock.requests}`)
}

function toolNamesFromBody(body) {
  try {
    const parsed = JSON.parse(body)
    return Array.isArray(parsed.tools) ? parsed.tools.map((tool) => tool.name) : []
  } catch {
    return []
  }
}

function decodeRule(record) {
  const index = record.rule.indexOf(':')
  return {
    toolName: index === -1 ? '' : record.rule.slice(0, index),
    pattern: index === -1 ? record.rule : record.rule.slice(index + 1),
    scope: record.scope,
  }
}

function writeProject(project) {
  fs.mkdirSync(path.join(project, 'generated'), { recursive: true })
  fs.writeFileSync(path.join(project, 'AGENTS.md'), 'Phase 14 UI smoke project.\n')
  fs.mkdirSync(path.join(project, '.claude', 'skills', 'readonly'), { recursive: true })
  fs.writeFileSync(path.join(project, '.claude', 'skills', 'readonly', 'SKILL.md'), [
    '---',
    'name: readonly',
    'description: Read-only smoke skill',
    'when_to_use: UI smoke asks for /readonly',
    'allowed-tools: [read_file]',
    '---',
    '',
    '# Readonly',
    '',
    'This skill may only read files.',
    '',
  ].join('\n'))
}

function assertBuilt() {
  for (const file of [path.join(root, 'dist', 'index.html'), path.join(root, 'dist-main', 'main', 'ipc.js'), path.join(root, 'dist-main', 'preload', 'index.js')]) {
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run npm run electron:build first.`)
  }
}
