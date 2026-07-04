/**
 * SKILL.md frontmatter parser (Phase 5).
 *
 * Hand-rolled YAML-subset parser — supports just the fields Claude Code
 * actually uses. Avoids pulling in `gray-matter` for the four fields we
 * care about. Format expected:
 *
 *     ---
 *     name: foo
 *     description: one-liner
 *     when_to_use: when to invoke
 *     allowed-tools: [Read, Edit, Bash]
 *     ---
 *     body markdown follows
 *
 * `allowed-tools` may also be a single string or a comma-separated list.
 *
 * Never throws. Returns a parsed object with `null` / empty values for
 * missing fields; the validator decides whether to mark the skill
 * invalid.
 */

import type { ParsedFrontmatter } from './validator'

const FRONTMATTER_DELIM = '---'

export interface ParseResult {
  frontmatter: ParsedFrontmatter
  body: string
}

export function parseSkillMarkdown(raw: string): ParseResult {
  // Normalize line endings; some editors save CRLF.
  const text = raw.replace(/\r\n/g, '\n')
  if (!text.startsWith(`${FRONTMATTER_DELIM}\n`)) {
    return { frontmatter: emptyFrontmatter(), body: text }
  }
  const afterFirstDelim = text.slice(FRONTMATTER_DELIM.length + 1)
  const closingIdx = afterFirstDelim.indexOf(`\n${FRONTMATTER_DELIM}`)
  if (closingIdx === -1) {
    return { frontmatter: emptyFrontmatter(), body: text }
  }
  const frontmatterBlock = afterFirstDelim.slice(0, closingIdx)
  const restAfterDelim = afterFirstDelim.slice(closingIdx + 1 + FRONTMATTER_DELIM.length)
  // Skip the newline right after the closing `---`.
  const body = restAfterDelim.startsWith('\n') ? restAfterDelim.slice(1) : restAfterDelim

  return {
    frontmatter: parseFrontmatterBlock(frontmatterBlock),
    body,
  }
}

function emptyFrontmatter(): ParsedFrontmatter {
  return { name: null, description: null, whenToUse: null, allowedTools: [] }
}

function parseFrontmatterBlock(block: string): ParsedFrontmatter {
  const out: ParsedFrontmatter = emptyFrontmatter()
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trimEnd()
    if (!line.trim() || line.trim().startsWith('#')) continue
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()

    // Strip optional surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    switch (key) {
      case 'name':
        out.name = value
        break
      case 'description':
        out.description = value
        break
      case 'when_to_use':
        out.whenToUse = value
        break
      case 'allowed-tools':
        out.allowedTools = parseListValue(value)
        break
      default:
        // Unknown keys are tolerated — the frontmatter schema may grow.
        break
    }
  }
  return out
}

function parseListValue(value: string): string[] {
  if (!value) return []
  // Inline list form: [a, b, c]
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((s) => unquote(s.trim()))
      .filter((s) => s.length > 0)
  }
  // Comma-separated string: a, b, c
  if (value.includes(',')) {
    return value
      .split(',')
      .map((s) => unquote(s.trim()))
      .filter((s) => s.length > 0)
  }
  // Single bare token.
  const single = unquote(value)
  return single ? [single] : []
}

function unquote(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1)
  }
  return s
}