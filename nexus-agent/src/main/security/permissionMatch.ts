import { addPermission, listPermissions } from '../db/dao/permissions'
import { listProjects } from '../db/dao/projects'
import { resolveProjectRoot } from './pathGuard'

export interface PermissionRule {
  projectRoot: string
  toolName: string
  pattern: string
}

export function hasPermissionRule(rule: PermissionRule): boolean {
  const projectId = projectIdForRule(rule)
  if (!projectId) return false
  const encoded = encodeRule(rule)
  return listPermissions(projectId).some((item) => item.scope === 'always' && item.rule === encoded)
}

export function addPermissionRule(rule: PermissionRule): void {
  const projectId = projectIdForRule(rule)
  if (!projectId || hasPermissionRule(rule)) return
  addPermission(projectId, encodeRule(rule), 'always')
}

function projectIdForRule(rule: PermissionRule): string | null {
  const root = safeRoot(rule.projectRoot)
  if (!root) return null
  return listProjects().find((project) => safeRoot(project.path) === root)?.id ?? null
}

function safeRoot(projectRoot: string): string | null {
  try {
    return resolveProjectRoot(projectRoot)
  } catch {
    return null
  }
}

function encodeRule(rule: PermissionRule): string {
  return `${rule.toolName}:${rule.pattern}`
}
