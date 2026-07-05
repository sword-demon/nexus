import Database from 'better-sqlite3'
import { existsSync, mkdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { logger } from '../logger'
import { INITIAL_SCHEMA_SQL } from './migrations/001_init.sql'
import {
  MIGRATION_VERSION as COST_MIGRATION_VERSION,
  MIGRATION_NAME as COST_MIGRATION_NAME,
  applyCostTrackingMigration,
} from './migrations/002_cost_tracking.sql'
import { getDatabasePath } from './path'

let database: Database.Database | null = null

export function getDb(): Database.Database {
  if (!database) {
    database = openDatabase(getDatabasePath())
  }
  return database
}

export function closeDb(): void {
  database?.close()
  database = null
}

function openDatabase(filePath: string): Database.Database {
  mkdirSync(path.dirname(filePath), { recursive: true })

  try {
    return initialize(new Database(filePath))
  } catch (error) {
    if (!existsSync(filePath) || !isCorruptDatabaseError(error)) {
      throw error
    }

    const backupPath = `${filePath}.corrupt-${Date.now()}.bak`
    renameSync(filePath, backupPath)
    void logger.warn('db', `backed up corrupt sqlite database to ${backupPath}`)
    return initialize(new Database(filePath))
  }
}

function initialize(db: Database.Database): Database.Database {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `)
  db.exec(INITIAL_SCHEMA_SQL)
  db.prepare(
    `INSERT OR IGNORE INTO schema_migrations (version, name, applied_at)
     VALUES (1, '001_init', ?)`,
  ).run(Date.now())
  db.pragma('user_version = 1')
  applyCostTrackingMigration({ db })
  db.prepare(
    `INSERT OR IGNORE INTO schema_migrations (version, name, applied_at)
     VALUES (?, ?, ?)`,
  ).run(COST_MIGRATION_VERSION, COST_MIGRATION_NAME, Date.now())
  db.pragma(`user_version = ${COST_MIGRATION_VERSION}`)
  return db
}

function isCorruptDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /file is not a database|database disk image is malformed/i.test(error.message)
}
