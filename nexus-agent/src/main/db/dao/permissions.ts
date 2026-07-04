import { randomUUID } from 'node:crypto'
import { getDb } from '../index'

export type PermissionScope = 'once' | 'always'

export interface PermissionRecord {
  id: string
  projectId: string
  rule: string
  scope: PermissionScope
  createdAt: number
}

interface PermissionRow {
  id: string
  project_id: string
  rule: string
  scope: PermissionScope
  created_at: number
}

export function addPermission(projectId: string, rule: string, scope: PermissionScope): PermissionRecord {
  const now = Date.now()
  const id = randomUUID()
  getDb()
    .prepare(
      `INSERT INTO permissions (id, project_id, rule, scope, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, projectId, rule, scope, now, now)
  return {
    id,
    projectId,
    rule,
    scope,
    createdAt: now,
  }
}

export function listPermissions(projectId: string): PermissionRecord[] {
  const rows = getDb()
    .prepare(
      `SELECT id, project_id, rule, scope, created_at
       FROM permissions
       WHERE project_id = ?
       ORDER BY created_at DESC`,
    )
    .all(projectId) as PermissionRow[]
  return rows.map(rowToPermission)
}

export function removePermission(id: string): boolean {
  const result = getDb().prepare('DELETE FROM permissions WHERE id = ?').run(id)
  return result.changes > 0
}

function rowToPermission(row: PermissionRow): PermissionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    rule: row.rule,
    scope: row.scope,
    createdAt: row.created_at,
  }
}
