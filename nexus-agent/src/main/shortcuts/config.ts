import { getSetting, setSetting } from '../db/dao/settings'

export interface ShortcutConfig {
  enabled: boolean
  accelerator: string
}

const SHORTCUT_KEY = 'global_shortcut'
export const DEFAULT_SHORTCUT: ShortcutConfig = {
  enabled: true,
  accelerator: 'CommandOrControl+Shift+A',
}

export function getShortcutConfig(): ShortcutConfig {
  const raw = getSetting(SHORTCUT_KEY)
  if (!raw) return DEFAULT_SHORTCUT
  try {
    const parsed = JSON.parse(raw) as Partial<ShortcutConfig>
    return normalizeShortcutConfig(parsed)
  } catch {
    return DEFAULT_SHORTCUT
  }
}

export function saveShortcutConfig(config: ShortcutConfig): ShortcutConfig {
  const normalized = normalizeShortcutConfig(config)
  setSetting(SHORTCUT_KEY, JSON.stringify(normalized))
  return normalized
}

function normalizeShortcutConfig(config: Partial<ShortcutConfig>): ShortcutConfig {
  return {
    enabled: typeof config.enabled === 'boolean' ? config.enabled : DEFAULT_SHORTCUT.enabled,
    accelerator: config.accelerator?.trim() || DEFAULT_SHORTCUT.accelerator,
  }
}
