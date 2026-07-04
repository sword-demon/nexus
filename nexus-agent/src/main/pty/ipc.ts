import { ipcMain } from 'electron'
import { IPC_EVENTS, IPC_HANDLERS } from '../../shared/types/ipc'
import type {
  PtyCloseRequest,
  PtyCloseResponse,
  PtySpawnRequest,
  PtySpawnResponse,
  PtyWriteRequest,
  PtyWriteResponse,
} from '../../shared/types/ipc'
import { closePty, spawnPty, writePty } from './manager'

export function registerPtyIpcHandlers(): void {
  ipcMain.handle(
    IPC_HANDLERS.PTY_SPAWN,
    (event, req: PtySpawnRequest): PtySpawnResponse =>
      spawnPty(req, (payload) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_EVENTS.PTY_DATA, payload)
        }
      }),
  )

  ipcMain.handle(
    IPC_HANDLERS.PTY_WRITE,
    (_event, req: PtyWriteRequest): PtyWriteResponse => writePty(req),
  )

  ipcMain.handle(
    IPC_HANDLERS.PTY_CLOSE,
    (_event, req: PtyCloseRequest): PtyCloseResponse => closePty(req.sessionId),
  )
}
