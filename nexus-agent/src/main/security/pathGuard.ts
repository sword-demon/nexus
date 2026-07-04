import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'

export class PathGuardError extends Error {
  readonly code = 'OUT_OF_BOUNDS'

  constructor(message: string) {
    super(message)
    this.name = 'PathGuardError'
  }
}

export function resolveProjectPath(projectRoot: string, inputPath = '.'): string {
  const root = resolveProjectRoot(projectRoot)
  const target = path.resolve(root, inputPath)
  const checked = existsSync(target) ? realPath(target) : resolveProjectPathForWrite(projectRoot, inputPath)
  assertInside(root, checked)
  return checked
}

export function resolveProjectPathForWrite(projectRoot: string, inputPath: string): string {
  const root = resolveProjectRoot(projectRoot)
  const target = path.resolve(root, inputPath)
  if (existsSync(target)) {
    const targetReal = realPath(target)
    assertInside(root, targetReal)
    return targetReal
  }
  const parent = nearestExistingParent(path.dirname(target))
  const parentReal = realPath(parent)
  assertInside(root, parentReal)
  assertInside(root, target)
  return target
}

export function resolveProjectRoot(projectRoot: string): string {
  return realPath(projectRoot)
}

function nearestExistingParent(start: string): string {
  let current = path.resolve(start)
  while (!existsSync(current)) {
    const next = path.dirname(current)
    if (next === current) break
    current = next
  }
  return current
}

function realPath(value: string): string {
  return realpathSync.native(path.resolve(value))
}

function assertInside(root: string, target: string): void {
  const relative = path.relative(root, target)
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return
  throw new PathGuardError(`Path is outside project root: ${target}`)
}
