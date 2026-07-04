/**
 * Skill loader error helpers.
 *
 * The loader never throws — every failure path adds an entry to
 * `loadErrors` and continues. These helpers just keep the construction
 * consistent at call sites.
 */

import type { SkillLoadError } from './types'

export function makeLoadError(path: string, reason: string): SkillLoadError {
  return { path, reason }
}