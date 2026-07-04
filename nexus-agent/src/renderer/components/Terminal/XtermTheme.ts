import type { ITerminalOptions, ITheme } from '@xterm/xterm'

const MONO_FONT = 'JetBrains Mono, Fira Code, Cascadia Code, SFMono-Regular, Menlo, monospace'

export function createXtermOptions(): ITerminalOptions {
  return {
    convertEol: true,
    cursorBlink: true,
    fontFamily: MONO_FONT,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 1.25,
    theme: createXtermTheme(),
  }
}

function createXtermTheme(): ITheme {
  return {
    background: cssVar('--color-surface-card', '#10241b'),
    foreground: cssVar('--seed-fg', '#d4e8dc'),
    cursor: cssVar('--seed-primary', '#5b8a72'),
    black: '#0f2a1f',
    red: cssVar('--seed-accent', '#e85d3a'),
    green: cssVar('--seed-primary', '#5b8a72'),
    yellow: '#c4a46a',
    blue: '#6ab8a0',
    magenta: '#c4845a',
    cyan: '#8ac4a8',
    white: cssVar('--seed-fg', '#d4e8dc'),
    brightBlack: cssVar('--seed-muted', '#7a9e8a'),
    brightRed: cssVar('--seed-accent', '#e85d3a'),
    brightGreen: '#7fbf8b',
    brightYellow: '#e8a468',
    brightBlue: '#6ab8a0',
    brightMagenta: '#d4886a',
    brightCyan: '#a4d4ae',
    brightWhite: '#f0faf4',
  }
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}
