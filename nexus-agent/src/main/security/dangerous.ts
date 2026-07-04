const DANGEROUS_PATTERNS = [
  /\bgit\s+push\b/,
  /\brm\s+(-[^\s]*r[^\s]*f|-[^\s]*f[^\s]*r)\b/,
  /\bsudo\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bchmod\s+777\b/,
  /\bnpm\s+publish\b/,
]

export function isDangerousCommand(commandLine: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(commandLine))
}
