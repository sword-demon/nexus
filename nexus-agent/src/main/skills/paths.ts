/**
 * Skill loader path resolution (Phase 5).
 *
 * Global context lives under `~/.claude/`. Project context lives next to
 * the project root. We resolve *all* candidate paths; the loader then
 * applies project-over-global precedence (a project CLAUDE.md replaces
 * `~/.claude/CLAUDE.md`; a project `.claude/skills/foo/SKILL.md`
 * replaces `~/.claude/skills/foo/SKILL.md` with the same `name`).
 *
 * `~` is expanded to `os.homedir()` once at call time, not at import,
 * so the function stays unit-testable.
 */

import { homedir } from 'node:os'
import path from 'node:path'
import { getBuiltinSkillsDir } from './builtin'

export interface ContextPaths {
  globalClaudeMd: string
  globalAgentsMd: string
  globalSkillsDir: string
  builtinSkillsDir: string
  projectClaudeMdCandidates: string[]
  projectAgentsMdCandidates: string[]
  projectSkillsDirCandidates: string[]
}

function claudeHome(): string {
  return process.env.NEXUS_CLAUDE_HOME || homedir()
}

function expandHome(p: string): string {
  if (p === '~' || p.startsWith('~/')) {
    return path.join(homedir(), p.slice(p === '~' ? 1 : 2))
  }
  return p
}

export function resolveContextPaths(projectPath: string): ContextPaths {
  const root = expandHome(projectPath) || '.'
  const home = claudeHome()

  return {
    globalClaudeMd: path.join(home, '.claude', 'CLAUDE.md'),
    globalAgentsMd: path.join(home, '.claude', 'AGENTS.md'),
    globalSkillsDir: path.join(home, '.claude', 'skills'),
    builtinSkillsDir: getBuiltinSkillsDir(),
    // project wins by being listed first
    projectClaudeMdCandidates: [
      path.join(root, 'CLAUDE.md'),
      path.join(root, '.claude', 'CLAUDE.md'),
    ],
    projectAgentsMdCandidates: [
      path.join(root, 'AGENTS.md'),
      path.join(root, '.claude', 'AGENTS.md'),
    ],
    projectSkillsDirCandidates: [path.join(root, '.claude', 'skills')],
  }
}
