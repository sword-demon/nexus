/**
 * Skill validator (Phase 5).
 *
 * Pure function: given the raw frontmatter + body + path, return either
 * a valid Skill or an invalid Skill with `loadError`. Never throws.
 *
 * Required fields:
 *   - name: non-empty string
 *   - description: non-empty string
 *
 * Optional fields (defaults applied):
 *   - when_to_use: string | null
 *   - allowed-tools: string[] (parsed from YAML list or comma-separated)
 */

import type { Skill, SkillScope } from './types'

export interface ParsedFrontmatter {
  name: string | null
  description: string | null
  whenToUse: string | null
  allowedTools: string[]
}

export function validateSkill(args: {
  frontmatter: ParsedFrontmatter
  body: string
  path: string
  scope: SkillScope
}): Skill {
  const { frontmatter, body, path, scope } = args

  if (!frontmatter.name || frontmatter.name.trim().length === 0) {
    return invalid(path, scope, 'missing required frontmatter field: name')
  }
  if (!frontmatter.description || frontmatter.description.trim().length === 0) {
    return invalid(path, scope, 'missing required frontmatter field: description')
  }

  return {
    name: frontmatter.name.trim(),
    description: frontmatter.description.trim(),
    whenToUse: frontmatter.whenToUse,
    allowedTools: frontmatter.allowedTools,
    content: body,
    path,
    scope,
    loadError: null,
  }
}

function invalid(path: string, scope: SkillScope, reason: string): Skill {
  return {
    name: '',
    description: '',
    whenToUse: null,
    allowedTools: [],
    content: '',
    path,
    scope: 'invalid',
    loadError: reason,
  }
}