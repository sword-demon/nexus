export interface PtySpawnRequest {
  command: string
  args?: string[]
  cwd: string
  projectRoot: string
}

export type PtySpawnResponse =
  | { status: 'ok'; sessionId: string; cwd: string }
  | { status: 'error'; error: string }

export interface PtyWriteRequest {
  sessionId: string
  data: string
}

export type PtyWriteResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

export interface PtyCloseRequest {
  sessionId: string
}

export type PtyCloseResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

export interface PtyDataEvent {
  sessionId: string
  data: string
  exitCode?: number
}
