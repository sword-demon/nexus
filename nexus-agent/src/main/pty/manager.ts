import crypto from 'node:crypto'
import * as pty from 'node-pty'
import { resolveProjectPath } from '../security/pathGuard'
import { resolveTrustedProjectRoot } from '../security/projectTrust'
import type {
  PtyCloseResponse,
  PtyDataEvent,
  PtySpawnRequest,
  PtySpawnResponse,
  PtyWriteRequest,
  PtyWriteResponse,
} from '../../shared/types/ipc'

type PtyProcess = pty.IPty
type PtyDataHandler = (event: PtyDataEvent) => void

const sessions = new Map<string, PtyProcess>()

export function spawnPty(req: PtySpawnRequest, onData: PtyDataHandler): PtySpawnResponse {
  const command = req.command.trim()
  if (!command) return { status: 'error', error: 'PTY command is required' }

  try {
    const projectRoot = resolveTrustedProjectRoot(req.projectRoot)
    const cwd = resolveProjectPath(projectRoot, req.cwd || '.')
    const sessionId = crypto.randomUUID()
    const child = pty.spawn(command, req.args ?? [], {
      name: 'xterm-color',
      cols: 120,
      rows: 32,
      cwd,
      env: stringEnv(process.env),
    })

    sessions.set(sessionId, child)
    child.onData((data) => onData({ sessionId, data }))
    child.onExit(({ exitCode }) => {
      sessions.delete(sessionId)
      onData({ sessionId, data: '', exitCode })
    })

    return { status: 'ok', sessionId, cwd }
  } catch (error) {
    return { status: 'error', error: getErrorMessage(error) }
  }
}

export function writePty(req: PtyWriteRequest): PtyWriteResponse {
  const session = sessions.get(req.sessionId)
  if (!session) return { status: 'error', error: `PTY session not found: ${req.sessionId}` }
  session.write(req.data)
  return { status: 'ok' }
}

export function closePty(sessionId: string): PtyCloseResponse {
  const session = sessions.get(sessionId)
  if (!session) return { status: 'ok' }
  session.kill()
  sessions.delete(sessionId)
  return { status: 'ok' }
}

function stringEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
