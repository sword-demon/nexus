/**
 * Migration 002 — v1.0 cost tracking per assistant message.
 *
 * Adds five nullable columns to `messages`:
 *   input_tokens / output_tokens / cache_creation_tokens /
 *   cache_read_tokens / cost_usd
 *
 * SQLite has no `ADD COLUMN IF NOT EXISTS`, so apply at runtime by
 * inspecting `PRAGMA table_info(messages)` first and only adding the
 * columns that are missing. Old v0.1 rows keep all five NULL.
 *
 * Also seeds `settings` with the v1.0 default `autoUpdateEnabled=true`.
 * `settings` is a plain key/value table so the seed is just an upsert.
 *
 * Spec: Product-Spec §6.1 (Message), §11.6, §REQ-009 AC for v1.0.
 */

import type Database from 'better-sqlite3'

export const MIGRATION_VERSION = 2
export const MIGRATION_NAME = '002_cost_tracking'

export interface MigrationContext {
  db: Database.Database
}

export function applyCostTrackingMigration(ctx: MigrationContext): void {
  const { db } = ctx
  const existing = new Set(columnNames(db, 'messages'))
  addColumnIfMissing(db, 'messages', 'input_tokens', 'INTEGER')
  addColumnIfMissing(db, 'messages', 'output_tokens', 'INTEGER')
  addColumnIfMissing(db, 'messages', 'cache_creation_tokens', 'INTEGER')
  addColumnIfMissing(db, 'messages', 'cache_read_tokens', 'INTEGER')
  addColumnIfMissing(db, 'messages', 'cost_usd', 'REAL')
  // Touch `existing` to keep the linter quiet about the unused-var branch.
  void existing
  seedAutoUpdateSetting(db)
}

function columnNames(db: Database.Database, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name)
}

function addColumnIfMissing(db: Database.Database, table: string, column: string, type: string): void {
  const names = new Set(columnNames(db, table))
  if (names.has(column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
}

function seedAutoUpdateSetting(db: Database.Database): void {
  db.prepare(
    `INSERT INTO settings (key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO NOTHING`,
  ).run('autoUpdateEnabled', 'true', Date.now(), Date.now())
}

export const COST_TRACKING_COLUMNS = [
  'input_tokens',
  'output_tokens',
  'cache_creation_tokens',
  'cache_read_tokens',
  'cost_usd',
] as const
