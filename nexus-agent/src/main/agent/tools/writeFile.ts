import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveProjectPathForWrite, resolveProjectRoot } from '../../security/pathGuard'

interface DiffLineData {
  type: 'context' | 'addition' | 'deletion'
  content: string
  oldLine?: number
  newLine?: number
}

interface DiffData {
  fileName: string
  additions: number
  deletions: number
  hunks: {
    header: string
    oldStart: number
    newStart: number
    lines: DiffLineData[]
  }[]
}

export interface WriteFileToolResult {
  path: string
  bytesWritten: number
  diff: DiffData
}

export async function writeFileTool(
  projectRoot: string,
  filePath: string,
  content: string,
): Promise<WriteFileToolResult> {
  const resolved = resolveProjectPathForWrite(projectRoot, filePath)
  const previous = await readExistingText(resolved)
  await mkdir(path.dirname(resolved), { recursive: true })
  await writeFile(resolved, content, 'utf8')
  const relativePath = path.relative(resolveProjectRoot(projectRoot), resolved) || '.'
  return {
    path: relativePath,
    bytesWritten: Buffer.byteLength(content, 'utf8'),
    diff: createDiff(relativePath, previous, content),
  }
}

async function readExistingText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return ''
    throw error
  }
}

function createDiff(fileName: string, before: string, after: string): DiffData {
  const oldLines = splitLines(before)
  const newLines = splitLines(after)
  const lines: DiffLineData[] = [
    ...oldLines.map((content, index) => ({ type: 'deletion' as const, content, oldLine: index + 1 })),
    ...newLines.map((content, index) => ({ type: 'addition' as const, content, newLine: index + 1 })),
  ]
  return {
    fileName,
    additions: newLines.length,
    deletions: oldLines.length,
    hunks: [
      {
        header: `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
        oldStart: 1,
        newStart: 1,
        lines,
      },
    ],
  }
}

function splitLines(value: string): string[] {
  if (!value) return []
  const normalized = value.replace(/\r\n/g, '\n').replace(/\n$/, '')
  return normalized ? normalized.split('\n') : []
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
