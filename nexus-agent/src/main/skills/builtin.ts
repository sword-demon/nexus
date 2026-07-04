import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { logger } from '../logger'

const BUILTIN_SKILLS_SOURCE_ENV = 'NEXUS_BUILTIN_SKILLS_SOURCE'

export interface BuiltinInstallResult {
  sourceDir: string
  targetDir: string
  copied: number
  skipped: number
}

export function getBuiltinSkillsDir(): string {
  return path.join(app.getPath('userData'), 'skills', 'builtin')
}

export function getBuiltinSkillsSourceDir(): string {
  const override = process.env[BUILTIN_SKILLS_SOURCE_ENV]
  if (override && override.trim()) return path.resolve(override)
  return path.join(app.getAppPath(), 'resources', 'builtin-skills')
}

export function installBuiltinSkills(): BuiltinInstallResult {
  const sourceDir = getBuiltinSkillsSourceDir()
  const targetDir = getBuiltinSkillsDir()

  if (!existsSync(sourceDir)) {
    void logger.warn('skills', `builtin skills source missing: ${sourceDir}`)
    return { sourceDir, targetDir, copied: 0, skipped: 0 }
  }

  const result = copyMissing(sourceDir, targetDir)
  void logger.info('skills', `builtin skills installed: copied=${result.copied} skipped=${result.skipped}`)
  return { sourceDir, targetDir, ...result }
}

function copyMissing(source: string, target: string): { copied: number; skipped: number } {
  mkdirSync(target, { recursive: true })
  let copied = 0
  let skipped = 0

  for (const entry of readdirSync(source)) {
    const sourcePath = path.join(source, entry)
    const targetPath = path.join(target, entry)
    const stat = statSync(sourcePath)

    if (stat.isDirectory()) {
      const child = copyMissing(sourcePath, targetPath)
      copied += child.copied
      skipped += child.skipped
      continue
    }

    if (existsSync(targetPath)) {
      skipped += 1
      continue
    }
    copyFileSync(sourcePath, targetPath)
    copied += 1
  }

  return { copied, skipped }
}
