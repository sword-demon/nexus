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
  input_tokens: number | null
  output_tokens: number | null
  cache_creation_tokens: number | null
  cache_read_tokens: number | null
  cost_usd: number | null
}

export interface CostFields {
  inputTokens: number | null
  outputTokens: number | null
  cacheCreationTokens: number | null
  cacheReadTokens: number | null
  costUsd: number | null
}

export interface AppendMessageInput {
  sessionId: string
  role: MessageRole
  content: string
  toolUseId?: string | null
  cost?: CostFields | null
}

export function appendMessage(input: AppendMessageInput): MessageDto {
  if (!getSession(input.sessionId)) {
    throw new Error(`Session not found: ${input.sessionId}`)
  }

  const db = getDb()
  const now = Date.now()
  const id = randomUUID()
  const cost = input.cost ?? null
  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO messages
        (id, session_id, role, content, tool_use_id, created_at, updated_at,
         input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, cost_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.sessionId,
      input.role,
      input.content,
      input.toolUseId ?? null,
      now,
      now,
      cost?.inputTokens ?? null,
      cost?.outputTokens ?? null,
      cost?.cacheCreationTokens ?? null,
      cost?.cacheReadTokens ?? null,
      cost?.costUsd ?? null,
    )
    db.prepare(
      `UPDATE sessions
       SET updated_at = ?, last_message_at = ?
       WHERE id = ?`,
    ).run(now, now, input.sessionId)
  })
  insert()
  return requireMessage(id)
}

export function updateMessageCost(messageId: string, cost: CostFields): MessageDto {
  const db = getDb()
  const result = db
    .prepare(
      `UPDATE messages
       SET input_tokens = ?, output_tokens = ?, cache_creation_tokens = ?,
           cache_read_tokens = ?, cost_usd = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      cost.inputTokens,
      cost.outputTokens,
      cost.cacheCreationTokens,
      cost.cacheReadTokens,
      cost.costUsd,
      Date.now(),
      messageId,
    )
  if (result.changes === 0) {
    throw new Error(`Message not found: ${messageId}`)
  }
  return requireMessage(messageId)
}

export function listMessages(sessionId: string): MessageDto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, session_id, role, content, tool_use_id, created_at,
              input_tokens, output_tokens, cache_creation_tokens,
              cache_read_tokens, cost_usd
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
      `SELECT id, session_id, role, content, tool_use_id, created_at,
              input_tokens, output_tokens, cache_creation_tokens,
              cache_read_tokens, cost_usd
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
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    cacheCreationTokens: row.cache_creation_tokens,
    cacheReadTokens: row.cache_read_tokens,
    costUsd: row.cost_usd,
  }
}