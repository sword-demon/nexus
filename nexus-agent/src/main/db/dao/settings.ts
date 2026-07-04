import { getDb } from '../index'

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const now = Date.now()
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .run(key, value, now, now)
}

export function deleteSetting(key: string): boolean {
  const result = getDb().prepare('DELETE FROM settings WHERE key = ?').run(key)
  return result.changes > 0
}

// --- Encrypted API key (Phase 4) ---
//
// safeStorage returns a Buffer. SQLite has no native BLOB column on the
// existing settings schema (Phase 3 typed it as TEXT), so we base64-encode
// on the way in and decode on the way out. Plain API key never touches the
// disk.

const API_KEY_BLOB_KEY = 'api_key_blob'

function bufferToBase64(buf: Buffer): string {
  return buf.toString('base64')
}

function base64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, 'base64')
}

export function setEncryptedApiKey(blob: Buffer): void {
  setSetting(API_KEY_BLOB_KEY, bufferToBase64(blob))
}

export function getEncryptedApiKey(): Buffer | null {
  const stored = getSetting(API_KEY_BLOB_KEY)
  if (!stored) return null
  return base64ToBuffer(stored)
}

export function clearEncryptedApiKey(): boolean {
  return deleteSetting(API_KEY_BLOB_KEY)
}
