#!/usr/bin/env node

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.join(__dirname, '..')

async function main() {
  const guardPath = path.join(root, 'dist-main', 'main', 'security', 'pathGuard.js')
  if (!fs.existsSync(guardPath)) throw new Error('Missing dist-main pathGuard. Run npm run electron:build first.')

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-phase9-guard-'))
  const project = path.join(tempDir, 'project')
  const outside = path.join(tempDir, 'outside.txt')
  fs.mkdirSync(project, { recursive: true })
  fs.writeFileSync(outside, 'outside')
  fs.symlinkSync(outside, path.join(project, 'escape-link.txt'))

  try {
    const guard = await import(guardPath)
    const inside = guard.resolveProjectPathForWrite(project, 'inside.txt')
    if (!isInside(fs.realpathSync.native(project), inside)) {
      throw new Error(`inside write resolved outside project: ${inside}`)
    }
    assertOutOfBounds(() => guard.resolveProjectPath(project, '../outside.txt'), 'parent escape')
    assertOutOfBounds(() => guard.resolveProjectPathForWrite(project, 'escape-link.txt'), 'write symlink escape')
    console.log('PHASE9_PATHGUARD_SMOKE_RESULT {"parentEscape":"OUT_OF_BOUNDS","writeSymlinkEscape":"OUT_OF_BOUNDS"}')
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function assertOutOfBounds(fn, label) {
  try {
    fn()
  } catch (error) {
    if (error && error.code === 'OUT_OF_BOUNDS') return
    throw error
  }
  throw new Error(`pathGuard allowed ${label}`)
}

function isInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

void main()
