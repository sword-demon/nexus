import { listProjects } from '../db/dao/projects'
import { resolveProjectRoot } from './pathGuard'

export class ProjectTrustError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectTrustError'
  }
}

export function resolveTrustedProjectRoot(projectPath: string): string {
  const requested = projectPath.trim()
  if (!requested) throw new ProjectTrustError('No project selected')

  const root = resolveProjectRoot(requested)
  const allowed = listProjects().some((project) => safeRealProjectRoot(project.path) === root)
  if (!allowed) throw new ProjectTrustError(`Project is not trusted: ${root}`)
  return root
}

function safeRealProjectRoot(projectPath: string): string | null {
  try {
    return resolveProjectRoot(projectPath)
  } catch {
    return null
  }
}
