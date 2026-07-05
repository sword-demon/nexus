#!/usr/bin/env node

/**
 * Phase 15 — cost tracking smoke.
 *
 * Boots an isolated Electron renderer with:
 *   - a fresh `userData` / sqlite db
 *   - a temp project with no CLAUDE.md / AGENTS.md
 *   - a temp `NEXUS_CLAUDE_HOME` so global skills don't leak in
 *   - a local mock Anthropic SSE endpoint that returns deterministic
 *     `usage` blocks (input + output + cache_creation + cache_read)
 *
 * Then drives the renderer:
 *   1. send one message → assistant bubbles are written to SQLite with
 *      the four token buckets and `cost_usd` from the SPEC §11.6 formula
 *   2. ToolPanel renders the live `Session · USD` line
 *   3. SQLite is reopened via the helper below to confirm the new
 *      `messages` columns (`input_tokens`, `output_tokens`,
 *      `cache_creation_tokens`, `cache_read_tokens`, `cost_usd`)
 *      actually exist and the row's 5 fields equal the expected values
 */

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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase15-'))
  const home = path.join(tempDir, 'home')
  const project = path.join(tempDir, 'project')
  fs.mkdirSync(home, { recursive: true })
  fs.mkdirSync(project, { recursive: true })
  const server = await startMockServer()
  try {
    const result = await runChild(electron, tempDir, home, project, server.baseURL)
    result.mock = server.summary()
    result.migration = checkMigrationOnDisk(path.join(tempDir, 'phase15.db'))
    assertSmokeResult(result)
    console.log(`PHASE15_COST_SMOKE_RESULT ${JSON.stringify(result)}`)
  } finally {
    await server.close()
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

async function runElectron() {
  const { app, BrowserWindow } = require('electron')
  const { registerIpcHandlers } = require('../dist-main/main/ipc.js')
  const { closeDb, getDb } = require('../dist-main/main/db/index.js')
  const { createProject } = require('../dist-main/main/db/dao/projects.js')

  app.setPath('userData', process.env.NEXUS_SMOKE_USER_DATA)
  await app.whenReady()
  registerIpcHandlers()
  createProject({ path: process.env.NEXUS_SMOKE_PROJECT, displayName: 'Phase 15 cost' })

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
  const apiKey = await win.webContents.executeJavaScript(
    `window.nexus.setApiKey(${JSON.stringify(process.env.NEXUS_SMOKE_API_KEY)})`,
    true,
  )
  if (apiKey.status !== 'ok') throw new Error(`setApiKey failed: ${JSON.stringify(apiKey)}`)
  const ui = await exerciseMainWindow(win)

  // Pull the persisted assistant row directly so the smoke asserts on the
  // SQLite truth, not just on the renderer state.
  const db = getDb()
  const persistedAssistant = db.prepare(
    `SELECT id, session_id, role, input_tokens, output_tokens,
            cache_creation_tokens, cache_read_tokens, cost_usd
       FROM messages WHERE role = 'assistant'
       ORDER BY created_at ASC`,
  ).all()

  console.log(`PHASE15_CHILD_RESULT ${JSON.stringify({
    ui,
    persistedAssistant,
  })}`)
  win.destroy()
  closeDb()
  app.quit()
}

function exerciseMainWindow(win) {
  return win.webContents.executeJavaScript(`
    new Promise((resolve, reject) => {
      const events = []
      let settled = false
      const timeout = setTimeout(() => finish(new Error('phase15 ui timed out')), 20000)

      const waitFor = (check, deadline = Date.now() + 8000) => {
        const value = check()
        if (value) return Promise.resolve(value)
        if (Date.now() > deadline) return Promise.reject(new Error('waitFor timed out'))
        return new Promise((done) => setTimeout(done, 50)).then(() => waitFor(check, deadline))
      }
      const finish = (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        off()
        if (error) reject(error)
        else setTimeout(() => readUi().then(resolve, reject), 300)
      }
      const readUi = async () => {
        const cost = document.querySelector('[data-od-id="session-cost"]')
        await waitFor(() => {
          const cell = document.querySelector('[data-testid="session-cost-value"]')
          return cell && cell.textContent.includes('$')
        })
        return {
          sessionCostText: (cost?.textContent || '').trim(),
          endTurnCount: events.filter((event) => event.type === 'end_turn').length,
          assistantMessageCount: events.filter((event) => event.type === 'text_delta').length > 0 ? 1 : 0,
        }
      }
      const off = window.nexus.onAgentEvent((event) => {
        events.push(event)
        if (event.type === 'end_turn' || event.type === 'error') finish()
      })
      waitFor(() => document.querySelector('[data-od-id="command-input"] textarea'))
        .then((textarea) => {
          textarea.focus()
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set
          setter.call(textarea, 'phase15 cost: ping')
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
        NEXUS_DB_PATH: path.join(tempDir, 'phase15.db'),
        NEXUS_SMOKE_USER_DATA: path.join(tempDir, 'phase15-userData'),
        NEXUS_SMOKE_PROJECT: project,
        NEXUS_SMOKE_API_KEY: 'sk-ant-phase15-smoke-mock',
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
      reject(new Error(`phase15 child timed out\nstdout:\n${stdout}\nstderr:\n${stderr}`))
    }, 45000)
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) return reject(new Error(`phase15 child failed\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      const line = stdout.split('\n').find((item) => item.startsWith('PHASE15_CHILD_RESULT '))
      if (!line) return reject(new Error(`phase15 child produced no result\nstdout:\n${stdout}\nstderr:\n${stderr}`))
      resolve(JSON.parse(line.slice('PHASE15_CHILD_RESULT '.length)))
    })
  })
}

function startMockServer() {
  const port = 0
  const usageBuckets = {
    input_tokens: 12000,
    output_tokens: 850,
    cache_creation_input_tokens: 5000,
    cache_read_input_tokens: 0,
  }
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'text/event-stream' })
      for (const event of eventsFor(usageBuckets)) {
        res.write(`event: ${event.type}\n`)
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      }
      res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        baseURL: `http://127.0.0.1:${address.port}`,
        summary: () => ({ usageBuckets }),
        close: () => new Promise((done) => server.close(done)),
      })
    })
  })
}

function eventsFor(usage) {
  return [
    {
      type: 'message_start',
      message: {
        id: 'msg_phase15_smoke',
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: null,
        stop_sequence: null,
        usage,
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'pong from phase15' } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: usage.output_tokens } },
    { type: 'message_stop' },
  ]
}

function checkMigrationOnDisk(dbPath) {
  // Re-open the file with better-sqlite3 from Node and confirm:
  //   - schema_migrations row for version 2
  //   - 5 new columns on messages
  //   - default autoUpdateEnabled row in settings
  // Use the freshly compiled dist-main build so we don't double-check.
  let Database
  try {
    Database = require(path.join(root, 'node_modules', 'better-sqlite3'))
  } catch (error) {
    return { openError: String(error) }
  }
  const handle = new Database(dbPath, { readonly: true })
  try {
    const migrations = handle.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all()
    const columns = handle.prepare("PRAGMA table_info('messages')").all().map((row) => row.name)
    const autoUpdate = handle.prepare("SELECT value FROM settings WHERE key = 'autoUpdateEnabled'").get()
    const assistantRows = handle.prepare(
      `SELECT input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, cost_usd
       FROM messages WHERE role = 'assistant' ORDER BY created_at ASC`,
    ).all()
    return {
      migrations,
      costColumns: columns.filter((column) => ['input_tokens', 'output_tokens', 'cache_creation_tokens', 'cache_read_tokens', 'cost_usd'].includes(column)),
      autoUpdate: autoUpdate?.value ?? null,
      assistantRows,
    }
  } finally {
    handle.close()
  }
}

function assertSmokeResult(result) {
  if (!result.ui.sessionCostText.includes('$')) {
    throw new Error(`SessionCost row not rendered: ${result.ui.sessionCostText}`)
  }
  // Sonnet 4.6: input 3 + output 15 + cacheWrite 3.75 + cacheRead 0.3 per MTok
  // 12000 * 3 + 850 * 15 + 5000 * 3.75 + 0 * 0.3 = 36000 + 12750 + 18750 + 0 = 67500 → $0.0675
  const expected = 0.0675
  const persisted = result.ui.persistedAssistant[0] || result.migration.assistantRows[0]
  if (!persisted) throw new Error(`no assistant row in SQLite: ${JSON.stringify(persisted)}`)
  const got = Number(persisted.cost_usd ?? persisted.costUsd ?? persisted.costUSD)
  if (Math.abs(got - expected) > 1e-4) {
    throw new Error(`cost_usd mismatch: expected ${expected}, got ${got}; row=${JSON.stringify(persisted)}`)
  }
  if (persisted.input_tokens !== 12000) throw new Error(`input_tokens mismatch: ${persisted.input_tokens}`)
  if (persisted.output_tokens !== 850) throw new Error(`output_tokens mismatch: ${persisted.output_tokens}`)
  if (persisted.cache_creation_tokens !== 5000) throw new Error(`cache_creation_tokens mismatch: ${persisted.cache_creation_tokens}`)
  if (persisted.cache_read_tokens !== 0) throw new Error(`cache_read_tokens mismatch: ${persisted.cache_read_tokens}`)
  if (!result.migration.migrations.some((row) => row.version === 2)) {
    throw new Error(`migration 002 not registered: ${JSON.stringify(result.migration.migrations)}`)
  }
  if (result.migration.costColumns.length !== 5) {
    throw new Error(`expected 5 cost columns on messages, got: ${JSON.stringify(result.migration.costColumns)}`)
  }
  if (result.migration.autoUpdate !== 'true') {
    throw new Error(`autoUpdateEnabled default seed missing: ${result.migration.autoUpdate}`)
  }
}

function assertBuilt() {
  for (const item of ['dist/index.html', 'dist-main/main/index.js', 'dist-main/preload/index.js']) {
    if (!fs.existsSync(path.join(root, item))) throw new Error(`missing build artifact: ${item}. Run npm run electron:build first.`)
  }
}
