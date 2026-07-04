import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import { getProject } from './projects'
import type { SessionDto } from '../../../shared/types/ipc'

interface SessionRow {
  id: string
  project_id: string
  title: string
  created_at: number
  last_message_at: number
}

export interface CreateSessionInput {
  projectId: string
  title?: string
}

export function createSession(input: CreateSessionInput): SessionDto {
  if (!getProject(input.projectId)) {
    throw new Error(`Project not found: ${input.projectId}`)
  }

  const now = Date.now()
  const id = randomUUID()
  const title = input.title?.trim() || 'New session'
  getDb()
    .prepare(
      `INSERT INTO sessions
        (id, project_id, title, created_at, updated_at, last_message_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, input.projectId, title, now, now, now)
  return requireSession(id)
}

export function listSessions(projectId: string): SessionDto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, project_id, title, created_at, last_message_at
       FROM sessions
       WHERE project_id = ?
       ORDER BY last_message_at DESC, created_at DESC`,
    )
    .all(projectId) as SessionRow[]
  return rows.map(rowToSession)
}

export function getSession(id: string): SessionDto | null {
  const row = getDb()
    .prepare(
      `SELECT id, project_id, title, created_at, last_message_at
       FROM sessions
       WHERE id = ?`,
    )
    .get(id) as SessionRow | undefined
  return row ? rowToSession(row) : null
}

export function deleteSession(id: string): boolean {
  const result = getDb().prepare('DELETE FROM sessions WHERE id = ?').run(id)
  return result.changes > 0
}

function requireSession(id: string): SessionDto {
  const session = getSession(id)
  if (!session) throw new Error(`Session not found: ${id}`)
  return session
}

function rowToSession(row: SessionRow): SessionDto {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
  }
}
