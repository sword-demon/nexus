import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { resolveProjectPath, resolveProjectRoot } from '../../security/pathGuard'

export async function listDirTool(
  projectRoot: string,
  dirPath = '.',
): Promise<{ path: string; entries: Array<{ name: string; path: string; type: 'file' | 'dir' }> }> {
  const resolved = resolveProjectPath(projectRoot, dirPath)
  const root = resolveProjectRoot(projectRoot)
  const relativeDir = path.relative(root, resolved)
  const entries = await readdir(resolved, { withFileTypes: true })
  return {
    path: relativeDir || '.',
    entries: entries.map((entry) => ({
      name: entry.name,
      path: path.join(relativeDir, entry.name),
      type: entry.isDirectory() ? 'dir' : 'file',
    })),
  }
}
