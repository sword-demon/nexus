/**
 * Skill loader types (Phase 5).
 *
 * `Skill` is the parsed shape of one valid SKILL.md file. `Skill.scope`
 * records where it came from so the UI can label it and so the loader can
 * apply project-over-global precedence. Invalid files are reported through
 * `PromptContext.loadErrors`; they never enter `PromptContext.skills`.
 *
 * `PromptContext` is the full bundle the agent will eventually inject as
 * the system prompt: top-level CLAUDE.md / AGENTS.md text, plus the list
 * of skills. `loadErrors` collects per-file failures so the UI can surface
 * them without crashing the renderer.
 */

export type SkillScope = 'builtin' | 'global' | 'project' | 'invalid'

export interface Skill {
  /** Frontmatter `name`. Required for the skill to be valid. */
  name: string
  /** Frontmatter `description`. Required for the skill to be valid. */
  description: string
  /** Frontmatter `when_to_use`. Optional. */
  whenToUse: string | null
  /** Frontmatter `allowed-tools`. Optional, empty array if missing. */
  allowedTools: string[]
  /** Full markdown body (the part after the closing `---`). */
  content: string
  /** Absolute path to the SKILL.md file on disk. */
  path: string
  /** Where this skill was loaded from. */
  scope: SkillScope
  /** Null for valid prompt skills; validator-only invalid values are not returned. */
  loadError: string | null
}

export interface SkillLoadError {
  path: string
  reason: string
}

export interface PromptContext {
  /** Project root used for this load. */
  projectPath: string
  /** Concatenated CLAUDE.md text (project wins over global). Empty string if absent. */
  claudeMd: string
  /** Concatenated AGENTS.md text (project wins over global). Empty string if absent. */
  agentsMd: string
  /** Valid skills (scope === 'project' | 'global' | 'builtin'), project wins on name collision. */
  skills: Skill[]
  /** Per-file failures. */
  loadErrors: SkillLoadError[]
}
