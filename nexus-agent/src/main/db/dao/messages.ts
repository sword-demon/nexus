import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import { getSession } from './sessions'
import type { MessageDto, MessageRole } from '../../../shared/types/ipc'

interface MessageRow {
  id: string
  session_id: string
  role: MessageRole
  content: string
  tool_use_id: string | null
  created_at: number
}

export interface AppendMessageInput {
  sessionId: string
  role: MessageRole
  content: string
  toolUseId?: string | null
}

export function appendMessage(input: AppendMessageInput): MessageDto {
  if (!getSession(input.sessionId)) {
    throw new Error(`Session not found: ${input.sessionId}`)
  }

  const db = getDb()
  const now = Date.now()
  const id = randomUUID()
  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO messages
        (id, session_id, role, content, tool_use_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.sessionId, input.role, input.content, input.toolUseId ?? null, now, now)
    db.prepare(
      `UPDATE sessions
       SET updated_at = ?, last_message_at = ?
       WHERE id = ?`,
    ).run(now, now, input.sessionId)
  })
  insert()
  return requireMessage(id)
}

export function listMessages(sessionId: string): MessageDto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, session_id, role, content, tool_use_id, created_at
       FROM messages
       WHERE session_id = ?
       ORDER BY created_at ASC`,
    )
    .all(sessionId) as MessageRow[]
  return rows.map(rowToMessage)
}

export function deleteMessages(sessionId: string): number {
  const result = getDb().prepare('DELETE FROM messages WHERE session_id = ?').run(sessionId)
  return result.changes
}

function requireMessage(id: string): MessageDto {
  const row = getDb()
    .prepare(
      `SELECT id, session_id, role, content, tool_use_id, created_at
       FROM messages
       WHERE id = ?`,
    )
    .get(id) as MessageRow | undefined
  if (!row) throw new Error(`Message not found: ${id}`)
  return rowToMessage(row)
}

function rowToMessage(row: MessageRow): MessageDto {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    toolUseId: row.tool_use_id,
    createdAt: row.created_at,
  }
}
