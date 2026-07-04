import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { resolveProjectPath, resolveProjectRoot } from '../../security/pathGuard'

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'dist-main', 'out'])

export interface SearchFilesResult {
  query: string
  matches: Array<{ path: string; kind: 'name' | 'content'; line?: number; text?: string }>
}

export async function searchFilesTool(projectRoot: string, query: string, startPath = '.'): Promise<SearchFilesResult> {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('search_files query is required')
  const root = resolveProjectPath(projectRoot, startPath)
  const normalizedRoot = resolveProjectRoot(projectRoot)
  const matches: SearchFilesResult['matches'] = []
  await walk(normalizedRoot, root, trimmed.toLowerCase(), matches)
  return { query: trimmed, matches }
}

async function walk(
  projectRoot: string,
  current: string,
  query: string,
  matches: SearchFilesResult['matches'],
): Promise<void> {
  const info = await stat(current)
  const relative = path.relative(projectRoot, current) || '.'

  if (info.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(current))) return
    if (relative.toLowerCase().includes(query)) matches.push({ path: relative, kind: 'name' })
    for (const entry of await readdir(current)) {
      await walk(projectRoot, path.join(current, entry), query, matches)
    }
    return
  }

  if (!info.isFile()) return
  if (relative.toLowerCase().includes(query)) matches.push({ path: relative, kind: 'name' })

  let content: string
  try {
    content = await readFile(current, 'utf8')
  } catch {
    return
  }

  content.split(/\r?\n/).forEach((line, index) => {
    if (line.toLowerCase().includes(query)) {
      matches.push({ path: relative, kind: 'content', line: index + 1, text: line })
    }
  })
}
