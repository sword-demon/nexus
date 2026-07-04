import * as pty from 'node-pty'
import { resolveProjectPath, resolveProjectRoot } from '../../security/pathGuard'

export interface ExecToolResult {
  projectRoot: string
  command: string
  args: string[]
  cwd: string
  stdout: string
  exitCode: number
}

export function execTool(
  projectRoot: string,
  command: string,
  args: string[] = [],
  cwd = '.',
): Promise<ExecToolResult> {
  const trimmed = command.trim()
  if (!trimmed) throw new Error('exec command is required')
  const root = resolveProjectRoot(projectRoot)
  const resolvedCwd = resolveProjectPath(projectRoot, cwd)

  return new Promise((resolve, reject) => {
    let stdout = ''
    const child = pty.spawn(trimmed, args, {
      name: 'xterm-color',
      cols: 120,
      rows: 40,
      cwd: resolvedCwd,
      env: stringEnv(process.env),
    })

    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('exec timed out after 10000ms'))
    }, 10000)

    child.onData((data) => {
      stdout += data
    })
    child.onExit(({ exitCode }) => {
      clearTimeout(timeout)
      resolve({
        projectRoot: root,
        command: trimmed,
        args,
        cwd: resolvedCwd,
        stdout: stdout.replace(/\r\n/g, '\n'),
        exitCode,
      })
    })
  })
}

function stringEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
}
