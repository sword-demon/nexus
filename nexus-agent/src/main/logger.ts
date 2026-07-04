import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'

type LogLevel = 'info' | 'warn' | 'error'

interface ApiCallLog {
  turnId: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number | null
  cacheReadInputTokens: number | null
  firstTokenMs: number | null
  errorCode?: string
  status?: number
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  scope: string
  message: string
}

function getLogDir(): string {
  const userData = app.getPath('userData')
  return path.join(userData, 'logs')
}

async function ensureLogDir(): Promise<void> {
  const dir = getLogDir()
  await fs.mkdir(dir, { recursive: true })
}

async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await ensureLogDir()
    const file = path.join(getLogDir(), 'main.log')
    const line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.scope}] ${entry.message}\n`
    await fs.appendFile(file, line, 'utf8')
  } catch {
    // Logger must never throw. Best-effort only.
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export const logger = {
  async info(scope: string, message: string): Promise<void> {
    await writeLog({ timestamp: nowIso(), level: 'info', scope, message })
  },
  async warn(scope: string, message: string): Promise<void> {
    await writeLog({ timestamp: nowIso(), level: 'warn', scope, message })
  },
  async error(scope: string, message: string): Promise<void> {
    await writeLog({ timestamp: nowIso(), level: 'error', scope, message })
  },
  async logApiCall(entry: ApiCallLog): Promise<void> {
    await writeLog({
      timestamp: nowIso(),
      level: entry.errorCode ? 'error' : 'info',
      scope: 'api',
      message: JSON.stringify(entry),
    })
  },
}
