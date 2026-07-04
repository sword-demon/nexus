import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveProjectPath, resolveProjectRoot } from '../../security/pathGuard'

export async function readFileTool(projectRoot: string, filePath: string): Promise<{ path: string; content: string }> {
  const resolved = resolveProjectPath(projectRoot, filePath)
  return {
    path: path.relative(resolveProjectRoot(projectRoot), resolved) || '.',
    content: await readFile(resolved, 'utf8'),
  }
}
