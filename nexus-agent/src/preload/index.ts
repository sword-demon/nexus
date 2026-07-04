import { contextBridge, ipcRenderer } from 'electron'
import { IPC_EVENTS, IPC_HANDLERS } from '../shared/types/ipc'
import type { NexusApi } from './api'
import type {
  AddProjectRequest,
  AgentEvent,
  CreateSessionRequest,
  GetMessagesRequest,
  GetSessionsRequest,
  LoadContextRequest,
  PermissionDecision,
  PermissionRespondRequest,
  ProjectSwitchRequest,
  PtyDataEvent,
  PtySpawnRequest,
  PtyWriteRequest,
  RemoveProjectRequest,
  SendMessageRequest,
  SetShortcutSettingsRequest,
  StopAgentRequest,
  WindowNewRequest,
} from '../shared/types/ipc'

/**
 * Phase 2: full API surface mounted on `window.nexus`. Each method calls the
 * matching `ipcMain.handle` channel. Bodies stay stub-only until later phases
 * wire real DAO / Anthropic SDK behavior on the main side.
 */
const nexusApi: NexusApi = {
  version: '0.1.0',
  ping: () => ipcRenderer.invoke(IPC_HANDLERS.PING),

  getProjects: () => ipcRenderer.invoke(IPC_HANDLERS.GET_PROJECTS),
  selectProjectDirectory: () => ipcRenderer.invoke(IPC_HANDLERS.SELECT_PROJECT_DIRECTORY),
  addProject: (req: AddProjectRequest) => ipcRenderer.invoke(IPC_HANDLERS.ADD_PROJECT, req),
  removeProject: (req: RemoveProjectRequest) => ipcRenderer.invoke(IPC_HANDLERS.REMOVE_PROJECT, req),

  getSessions: (req: GetSessionsRequest) => ipcRenderer.invoke(IPC_HANDLERS.GET_SESSIONS, req),
  createSession: (req: CreateSessionRequest) => ipcRenderer.invoke(IPC_HANDLERS.CREATE_SESSION, req),
  getMessages: (req: GetMessagesRequest) => ipcRenderer.invoke(IPC_HANDLERS.GET_MESSAGES, req),

  sendMessage: (req: SendMessageRequest) => ipcRenderer.invoke(IPC_HANDLERS.SEND_MESSAGE, req),
  stopAgent: (req: StopAgentRequest) => ipcRenderer.invoke(IPC_HANDLERS.STOP_AGENT, req),

  respondPermission: (req: PermissionRespondRequest) =>
    ipcRenderer.invoke(IPC_HANDLERS.PERMISSION_RESPOND, req),

  respond: (id: string, decision: PermissionDecision) =>
    ipcRenderer.invoke(IPC_HANDLERS.PERMISSION_RESPOND, { id, decision }),

  onAgentEvent: (handler) => {
    const wrapped = (_event: unknown, payload: AgentEvent): void => {
      handler(payload)
    }
    ipcRenderer.on(IPC_EVENTS.AGENT_EVENT, wrapped)
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.AGENT_EVENT, wrapped)
    }
  },

  newWindow: (req?: WindowNewRequest) => ipcRenderer.invoke(IPC_HANDLERS.WINDOW_NEW, req),
  focusWindow: () => ipcRenderer.invoke(IPC_HANDLERS.WINDOW_FOCUS),
  switchProject: (req: ProjectSwitchRequest) => ipcRenderer.invoke(IPC_HANDLERS.PROJECT_SWITCH, req),
  getShortcutSettings: () => ipcRenderer.invoke(IPC_HANDLERS.GET_SHORTCUT_SETTINGS),
  setShortcutSettings: (req: SetShortcutSettingsRequest) =>
    ipcRenderer.invoke(IPC_HANDLERS.SET_SHORTCUT_SETTINGS, req),
  onFocusCommandInput: (handler) => {
    const wrapped = (): void => {
      handler()
    }
    ipcRenderer.on(IPC_EVENTS.FOCUS_COMMAND_INPUT, wrapped)
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.FOCUS_COMMAND_INPUT, wrapped)
    }
  },

  spawnPty: (req: PtySpawnRequest) => ipcRenderer.invoke(IPC_HANDLERS.PTY_SPAWN, req),
  writePty: (req: PtyWriteRequest) => ipcRenderer.invoke(IPC_HANDLERS.PTY_WRITE, req),
  closePty: (req) => ipcRenderer.invoke(IPC_HANDLERS.PTY_CLOSE, req),
  onPtyData: (handler) => {
    const wrapped = (_event: unknown, payload: PtyDataEvent): void => {
      handler(payload)
    }
    ipcRenderer.on(IPC_EVENTS.PTY_DATA, wrapped)
    return () => {
      ipcRenderer.removeListener(IPC_EVENTS.PTY_DATA, wrapped)
    }
  },

  setApiKey: (apiKey: string) => ipcRenderer.invoke(IPC_HANDLERS.SET_API_KEY, { apiKey }),
  getApiKeyStatus: () => ipcRenderer.invoke(IPC_HANDLERS.GET_API_KEY_STATUS),
  clearApiKey: () => ipcRenderer.invoke(IPC_HANDLERS.CLEAR_API_KEY),

  loadContext: (req: LoadContextRequest) => ipcRenderer.invoke(IPC_HANDLERS.LOAD_CONTEXT, req),
}

contextBridge.exposeInMainWorld('nexus', nexusApi)
