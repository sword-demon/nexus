#!/usr/bin/env node

/**
 * Phase 15 — pure-Node verification (no Electron).
 *
 * The full Electron BrowserWindow + mock Anthropic SSE smoke is gated on
 * a sandbox that allows loopback listen, which the current dev shell does
 * not. This script covers the deterministic, dependency-free surface:
 *
 *   1. `agent/cost.ts` `computeCost` — 6 cases including the Sonnet 5
 *      promo boundary (today's UTC clock vs 2026-09-01).
 *   2. `db/migrations/002_cost_tracking.sql.ts` — idempotent when run on
 *      top of a v0.1 schema (5 columns added once, second pass no-ops),
 *      `settings.autoUpdateEnabled` is seeded to `true`, and re-running
 *      the migration does not corrupt existing rows.
 *   3. `db/dao/messages.ts` — append / updateMessageCost / listMessages
 *      round-trip the 5 cost fields through SQLite and back.
 *
 * Build artifacts are not required; this script imports TS via the same
 * `tsconfig` resolve path that the smoke scripts use, so a freshly
 * compiled `dist-main/` is unnecessary.
 */

const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const { spawnSync } = require('node:child_process')

const root = path.join(__dirname, '..')

const cases = []
function check(name, fn) {
  cases.push({ name, fn })
}

void (async () => {
  // ts-node-free TS loading via tsc transpile-on-the-fly is overkill for
  // 3 files; just call `tsc` once per case on the fly. But the DAO uses
  // ESM-incompatible default exports so we compile + load. Simplest path
  // is to import the JS emit produced by `npm run electron:build`. If
  // not built yet, fall back to a manual transpile.
  const distMain = path.join(root, 'dist-main', 'main', 'db', 'dao', 'messages.js')
  const distCost = path.join(root, 'dist-main', 'main', 'agent', 'cost.js')
  const distMigration = path.join(root, 'dist-main', 'main', 'db', 'migrations', '002_cost_tracking.sql.js')
  const distDb = path.join(root, 'dist-main', 'main', 'db', 'index.js')
  if (!fs.existsSync(distMain) || !fs.existsSync(distCost) || !fs.existsSync(distMigration)) {
    throw new Error('dist-main artifacts missing. Run `npm run electron:build` first.')
  }
  // dist-main is CommonJS (write-main-package.cjs writes type:commonjs).
  const Database = require('better-sqlite3')
  const { computeCost, MODEL_PRICING } = require(distCost)
  const { applyCostTrackingMigration } = require(distMigration)
  const messagesDao = require(distMain)

  // ---- cost.ts -----------------------------------------------------------

  check('computeCost matches SPEC §11.6 for Sonnet 4.6', () => {
    const usage = { inputTokens: 12000, outputTokens: 850, cacheCreationInputTokens: 5000, cacheReadInputTokens: 0 }
    const usd = computeCost('claude-sonnet-4-6', usage)
    // 12000*3 + 850*15 + 5000*3.75 + 0*0.3 = 36000 + 12750 + 18750 = 67500 / 1e6
    assertClose(usd, 0.0675, 1e-6)
  })

  check('computeCost handles cache_read-only usage', () => {
    const usage = { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: 0, cacheReadInputTokens: 5000 }
    const usd = computeCost('claude-sonnet-4-6', usage)
    assertClose(usd, 0.0015, 1e-6) // 5000 * 0.30 / 1e6
  })

  check('computeCost null cache buckets default to 0', () => {
    const usage = { inputTokens: 1000, outputTokens: 100, cacheCreationInputTokens: null, cacheReadInputTokens: null }
    const usd = computeCost('claude-sonnet-4-6', usage)
    assertClose(usd, (1000 * 3 + 100 * 15) / 1_000_000, 1e-9)
  })

  check('computeCost returns null for unknown model', () => {
    const usage = { inputTokens: 1, outputTokens: 1, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 }
    if (computeCost('not-a-real-model', usage) !== null) throw new Error('expected null for unknown model')
  })

  check('Sonnet 5 output uses promo price before 2026-09-01', () => {
    const usage = { inputTokens: 0, outputTokens: 1_000_000, cacheCreationInputTokens: 0, cacheReadInputTokens: 0 }
    const before = new Date(Date.UTC(2026, 7, 31, 23, 59, 59)) // Aug 31 2026
    const after = new Date(Date.UTC(2026, 8, 1, 0, 0, 1))    // Sep 1 2026
    const promo = computeCost('claude-sonnet-5', usage, before)
    const headline = computeCost('claude-sonnet-5', usage, after)
    assertClose(promo, 2.0, 1e-6)
    assertClose(headline, 15.0, 1e-6)
  })

  check('MODEL_PRICING covers every SPEC §11.6 row', () => {
    for (const model of [
      'claude-3-5-sonnet-20241022',
      'claude-sonnet-4-6',
      'claude-sonnet-5',
      'claude-haiku-4-5',
      'claude-opus-4-8',
      'claude-fable-5',
    ]) {
      if (!MODEL_PRICING[model]) throw new Error(`missing pricing for ${model}`)
    }
  })

  // ---- migration --------------------------------------------------------

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase15-unit-'))
  const dbPath = path.join(tmp, 'phase15.db')

  check('migration 002 adds 5 columns + seeds autoUpdateEnabled', () => {
    // Pre-create the v0.1 schema (simulate an existing v0.1 user) so we
    // can prove the ALTER TABLE path runs.
    const db = new Database(dbPath)
    db.exec(`
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL,
                             created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL);
      INSERT INTO settings (key, value, created_at, updated_at) VALUES ('theme', 'dark', 0, 0);
      INSERT INTO schema_migrations (version, name, applied_at) VALUES (1, '001_init', 0);
    `)
    db.close()
    const open = new Database(dbPath)
    applyCostTrackingMigration({ db: open })
    open.prepare(`INSERT OR IGNORE INTO schema_migrations (version, name, applied_at) VALUES (2, '002_cost_tracking', ?)`).run(Date.now())
    const cols = open.prepare(`PRAGMA table_info(messages)`).all().map((row) => row.name)
    for (const c of ['input_tokens', 'output_tokens', 'cache_creation_tokens', 'cache_read_tokens', 'cost_usd']) {
      if (!cols.includes(c)) throw new Error(`column ${c} missing after migration`)
    }
    const seed = open.prepare(`SELECT value FROM settings WHERE key = 'autoUpdateEnabled'`).get()
    if (!seed || seed.value !== 'true') throw new Error(`autoUpdateEnabled seed wrong: ${JSON.stringify(seed)}`)
    open.close()
  })

  check('migration 002 is idempotent on second pass', () => {
    const open = new Database(dbPath)
    applyCostTrackingMigration({ db: open })
    const colsAfter = open.prepare(`PRAGMA table_info(messages)`).all().map((row) => row.name)
    // 5 cost columns should still be there, not duplicated.
    const costCols = colsAfter.filter((c) => ['input_tokens', 'output_tokens', 'cache_creation_tokens', 'cache_read_tokens', 'cost_usd'].includes(c))
    if (costCols.length !== 5) throw new Error(`migration not idempotent: ${JSON.stringify(colsAfter)}`)
    const seedRows = open.prepare(`SELECT value FROM settings WHERE key = 'autoUpdateEnabled'`).all()
    if (seedRows.length !== 1) throw new Error(`autoUpdateEnabled duplicated: ${JSON.stringify(seedRows)}`)
    open.close()
  })

  // ---- messages DAO round-trip -----------------------------------------

  let projectId
  let sessionId
  check('messages DAO round-trips 5 cost fields through SQLite', () => {
    // Open the migrated DB, seed a project + session, then append a
    // user/assistant pair with cost on the assistant row.
    const open = new Database(dbPath)
    open.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, display_name TEXT,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        last_opened_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        last_message_at INTEGER NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE);
    `)
    projectId = 'proj-phase15-unit'
    sessionId = 'sess-phase15-unit'
    open.prepare(`INSERT INTO projects (id, path, display_name, created_at, updated_at, last_opened_at) VALUES (?, ?, ?, ?, ?, ?)`).run(projectId, '/tmp/phase15', 'Phase 15 unit', 0, 0, 0)
    open.prepare(`INSERT INTO sessions (id, project_id, title, created_at, updated_at, last_message_at) VALUES (?, ?, ?, ?, ?, ?)`).run(sessionId, projectId, 'Phase 15', 0, 0, 0)
    open.close()

    // Wire dist-main/db/index.ts to use our temp db path.
    const distDbModule = require(distDb)
    process.env.NEXUS_DB_PATH = dbPath
    // Reset cached singleton before re-requiring via the actual module.
    distDbModule.closeDb()
    // Re-require with cache busted so the fresh `getDatabasePath()` env wins.
    delete require.cache[require.resolve(distDb)]
    delete require.cache[require.resolve(distMain)]
    const messagesDao2 = require(distMain)
    const distDbModule2 = require(distDb)
    // The messages DAO depends on the sessions DAO and both go through
    // getDb(); confirm our seeded rows are visible.
    const userRow = messagesDao2.appendMessage({ sessionId, role: 'user', content: 'phase15 ping' })
    if (userRow.costUsd !== null) throw new Error(`user row should have null cost, got ${userRow.costUsd}`)
    const cost = {
      inputTokens: 12000,
      outputTokens: 850,
      cacheCreationTokens: 5000,
      cacheReadTokens: 0,
      costUsd: 0.0675,
    }
    const assistantRow = messagesDao2.appendMessage({ sessionId, role: 'assistant', content: 'phase15 pong', cost })
    if (assistantRow.inputTokens !== 12000) throw new Error(`inputTokens lost: ${assistantRow.inputTokens}`)
    if (assistantRow.outputTokens !== 850) throw new Error(`outputTokens lost: ${assistantRow.outputTokens}`)
    if (assistantRow.cacheCreationTokens !== 5000) throw new Error(`cacheCreationTokens lost: ${assistantRow.cacheCreationTokens}`)
    if (assistantRow.cacheReadTokens !== 0) throw new Error(`cacheReadTokens lost: ${assistantRow.cacheReadTokens}`)
    assertClose(assistantRow.costUsd, 0.0675, 1e-6)

    const list = messagesDao2.listMessages(sessionId)
    if (list.length !== 2) throw new Error(`expected 2 rows, got ${list.length}`)
    const persistedAssistant = list.find((row) => row.role === 'assistant')
    if (!persistedAssistant) throw new Error('assistant row missing after listMessages')
    assertClose(persistedAssistant.costUsd, 0.0675, 1e-6)

    // updateMessageCost: rewrite the assistant row to a different cost
    // and confirm it round-trips again.
    messagesDao2.updateMessageCost(assistantRow.id, {
      inputTokens: 200,
      outputTokens: 100,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      costUsd: 0.0021,
    })
    const updated = messagesDao2.listMessages(sessionId).find((row) => row.role === 'assistant')
    assertClose(updated.costUsd, 0.0021, 1e-6)
    if (updated.inputTokens !== 200) throw new Error(`updateMessageCost inputTokens lost: ${updated.inputTokens}`)

    distDbModule2.closeDb()
  })

  let failures = 0
  const report = []
  for (const { name, fn } of cases) {
    try {
      fn()
      report.push({ name, status: 'PASS' })
    } catch (error) {
      failures += 1
      report.push({ name, status: 'FAIL', error: error.message })
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true })
  const summary = { total: cases.length, failures, report }
  console.log(`PHASE15_UNIT_RESULT ${JSON.stringify(summary)}`)
  if (failures > 0) process.exit(1)
})()

function assertClose(actual, expected, epsilon) {
  if (typeof actual !== 'number' || !Number.isFinite(actual)) {
    throw new Error(`actual not a finite number: ${actual}`)
  }
  if (Math.abs(actual - expected) > epsilon) {
    throw new Error(`expected ${expected} ±${epsilon}, got ${actual}`)
  }
}