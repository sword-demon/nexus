import { randomUUID } from 'node:crypto'
import { getDb } from '../index'
import { resolveProjectRoot } from '../../security/pathGuard'
import type { ProjectDto } from '../../../shared/types/ipc'

interface ProjectRow {
  id: string
  path: string
  display_name: string | null
  created_at: number
  last_opened_at: number
}

export interface CreateProjectInput {
  path: string
  displayName?: string
}

export function createProject(input: CreateProjectInput): ProjectDto {
  const db = getDb()
  const projectPath = resolveProjectRoot(input.path)
  const existing = getProjectByPath(projectPath)
  const now = Date.now()
  const displayName = input.displayName?.trim() || null

  if (existing) {
    db.prepare(
      `UPDATE projects
       SET display_name = COALESCE(?, display_name),
           updated_at = ?,
           last_opened_at = ?
       WHERE id = ?`,
    ).run(displayName, now, now, existing.id)
    return requireProject(existing.id)
  }

  const id = randomUUID()
  db.prepare(
    `INSERT INTO projects
      (id, path, display_name, created_at, updated_at, last_opened_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, projectPath, displayName, now, now, now)
  return requireProject(id)
}

export function listProjects(): ProjectDto[] {
  const rows = getDb()
    .prepare(
      `SELECT id, path, display_name, created_at, last_opened_at
       FROM projects
       ORDER BY last_opened_at DESC, created_at DESC`,
    )
    .all() as ProjectRow[]
  return rows.map(rowToProject)
}

export function getProject(id: string): ProjectDto | null {
  const row = getDb()
    .prepare(
      `SELECT id, path, display_name, created_at, last_opened_at
       FROM projects
       WHERE id = ?`,
    )
    .get(id) as ProjectRow | undefined
  return row ? rowToProject(row) : null
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
  return result.changes > 0
}

function getProjectByPath(projectPath: string): ProjectDto | null {
  const row = getDb()
    .prepare(
      `SELECT id, path, display_name, created_at, last_opened_at
       FROM projects
       WHERE path = ?`,
    )
    .get(projectPath) as ProjectRow | undefined
  return row ? rowToProject(row) : null
}

function requireProject(id: string): ProjectDto {
  const project = getProject(id)
  if (!project) throw new Error(`Project not found: ${id}`)
  return project
}

function rowToProject(row: ProjectRow): ProjectDto {
  return {
    id: row.id,
    path: row.path,
    displayName: row.display_name,
    createdAt: row.created_at,
    lastOpenedAt: row.last_opened_at,
  }
}
