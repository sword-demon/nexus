/**
 * Skill loader (Phase 5).
 *
 * Reads CLAUDE.md / AGENTS.md / SKILL.md from the resolved paths and
 * assembles a `PromptContext`. Never throws — every I/O failure lands in
 * `loadErrors`. Project-level files take precedence over global ones.
 */

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../logger'
import { makeLoadError } from './errors'
import { resolveContextPaths } from './paths'
import { parseSkillMarkdown } from './parser'
import type { PromptContext, Skill, SkillLoadError, SkillScope } from './types'
import { validateSkill } from './validator'

export async function loadPromptContext(projectPath: string): Promise<PromptContext> {
  const errors: SkillLoadError[] = []
  const paths = resolveContextPaths(projectPath)
  const projectRoot = paths.projectClaudeMdCandidates[0]
    ? path.dirname(paths.projectClaudeMdCandidates[0])
    : projectPath

  const claudeMd = await readFirstExisting(
    [...paths.projectClaudeMdCandidates, paths.globalClaudeMd],
    errors,
    'CLAUDE.md',
  )
  const agentsMd = await readFirstExisting(
    [...paths.projectAgentsMdCandidates, paths.globalAgentsMd],
    errors,
    'AGENTS.md',
  )

  const skills = await collectSkills(paths, errors)

  return {
    projectPath: projectRoot,
    claudeMd,
    agentsMd,
    skills,
    loadErrors: errors,
  }
}

async function readFirstExisting(
  candidates: string[],
  errors: SkillLoadError[],
  label: string,
): Promise<string> {
  for (const candidate of candidates) {
    try {
      const content = await readFile(candidate, 'utf8')
      return content
    } catch (error) {
      const reason = errorWithCode(error) === 'ENOENT' ? null : reasonOf(error)
      if (reason) {
        errors.push(makeLoadError(candidate, `${label}: ${reason}`))
        await safeLog('warn', `${label} read failed at ${candidate}: ${reason}`)
      }
      // ENOENT is expected (file simply absent); keep trying the next candidate.
    }
  }
  return ''
}

async function collectSkills(paths: ContextPathsLite, errors: SkillLoadError[]): Promise<Skill[]> {
  // Pass 1 — collect builtin, global, and project skill dirs.
  const dirs: { dir: string; scope: SkillScope }[] = []
  dirs.push({ dir: paths.builtinSkillsDir, scope: 'builtin' })
  dirs.push({ dir: paths.globalSkillsDir, scope: 'global' })
  for (const d of paths.projectSkillsDirCandidates) {
    dirs.push({ dir: d, scope: 'project' })
  }

  // skill name -> Skill, with project > global > builtin precedence
  const byName = new Map<string, Skill>()

  for (const { dir, scope } of dirs) {
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch (error) {
      if (errorWithCode(error) !== 'ENOENT') {
        const reason = reasonOf(error)
        errors.push(makeLoadError(dir, `skills dir: ${reason}`))
        await safeLog('warn', `skills dir read failed at ${dir}: ${reason}`)
      }
      continue
    }

    for (const entry of entries) {
      const skillPath = path.join(dir, entry, 'SKILL.md')
      const skill = await readOneSkill(skillPath, scope, errors)
      if (!skill) continue
      const existing = byName.get(skill.name)
      if (!existing || scopePriority(skill.scope) > scopePriority(existing.scope)) {
        byName.set(skill.name, skill)
      }
    }
  }

  // Stable output order: project first, then global, then builtin.
  return Array.from(byName.values()).sort((a, b) => {
    const priorityDiff = scopePriority(b.scope) - scopePriority(a.scope)
    if (priorityDiff !== 0) return priorityDiff
    return a.name.localeCompare(b.name)
  })
}

interface ContextPathsLite {
  projectSkillsDirCandidates: string[]
  globalSkillsDir: string
  builtinSkillsDir: string
}

function scopePriority(scope: SkillScope): number {
  if (scope === 'project') return 3
  if (scope === 'global') return 2
  if (scope === 'builtin') return 1
  return 0
}

async function readOneSkill(
  filePath: string,
  scope: SkillScope,
  errors: SkillLoadError[],
): Promise<Skill | null> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf8')
  } catch (error) {
    if (errorWithCode(error) === 'ENOENT') return null
    const reason = reasonOf(error)
    errors.push(makeLoadError(filePath, `read: ${reason}`))
    await safeLog('warn', `skill read failed at ${filePath}: ${reason}`)
    return null
  }

  const { frontmatter, body } = parseSkillMarkdown(raw)
  const skill = validateSkill({ frontmatter, body, path: filePath, scope })
  if (skill.scope === 'invalid') {
    errors.push(makeLoadError(filePath, skill.loadError ?? 'invalid'))
    await safeLog('warn', `skill invalid at ${filePath}: ${skill.loadError}`)
    return null
  }
  return skill
}

function errorWithCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code
    if (typeof code === 'string') return code
  }
  return null
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function safeLog(level: 'warn' | 'info', message: string): Promise<void> {
  try {
    if (level === 'warn') await logger.warn('skills', message)
    else await logger.info('skills', message)
  } catch {
    // logger must never throw (best-effort).
  }
}
