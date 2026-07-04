/**
 * Renderer-side API contract.
 *
 * The shape exposed on `window.nexus` in the renderer. Stays decoupled from
 * electron's `ipcRenderer` so renderer code can be unit-tested by stubbing
 * this module. Phase 2 ships all-stub implementations.
 */

import type {
  AddProjectRequest,
  AddProjectResponse,
  ClearApiKeyResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  GetApiKeyStatusResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  GetProjectsResponse,
  GetShortcutSettingsResponse,
  GetSessionsRequest,
  GetSessionsResponse,
  LoadContextRequest,
  LoadContextResponse,
  PermissionDecision,
  PermissionRespondRequest,
  PermissionRespondResponse,
  PingResponse,
  PtyCloseRequest,
  PtyCloseResponse,
  PtyDataEvent,
  PtySpawnRequest,
  PtySpawnResponse,
  PtyWriteRequest,
  PtyWriteResponse,
  ProjectSwitchRequest,
  ProjectSwitchResponse,
  RemoveProjectRequest,
  RemoveProjectResponse,
  SelectProjectDirectoryResponse,
  SendMessageRequest,
  SendMessageResponse,
  SetApiKeyResponse,
  SetShortcutSettingsRequest,
  SetShortcutSettingsResponse,
  StopAgentRequest,
  StopAgentResponse,
  WindowFocusResponse,
  WindowNewRequest,
  WindowNewResponse,
} from '../shared/types/ipc'

export interface NexusApi {
  version: string
  ping: () => Promise<PingResponse>

  getProjects: () => Promise<GetProjectsResponse>
  selectProjectDirectory: () => Promise<SelectProjectDirectoryResponse>
  addProject: (req: AddProjectRequest) => Promise<AddProjectResponse>
  removeProject: (req: RemoveProjectRequest) => Promise<RemoveProjectResponse>

  getSessions: (req: GetSessionsRequest) => Promise<GetSessionsResponse>
  createSession: (req: CreateSessionRequest) => Promise<CreateSessionResponse>
  getMessages: (req: GetMessagesRequest) => Promise<GetMessagesResponse>

  sendMessage: (req: SendMessageRequest) => Promise<SendMessageResponse>
  stopAgent: (req: StopAgentRequest) => Promise<StopAgentResponse>

  respondPermission: (
    req: PermissionRespondRequest,
  ) => Promise<PermissionRespondResponse>

  /** Subscribe to agent push events. Returns an unsubscribe fn. */
  onAgentEvent: (handler: (event: import('../shared/types/ipc').AgentEvent) => void) => () => void

  newWindow: (req?: WindowNewRequest) => Promise<WindowNewResponse>
  focusWindow: () => Promise<WindowFocusResponse>
  switchProject: (req: ProjectSwitchRequest) => Promise<ProjectSwitchResponse>
  getShortcutSettings: () => Promise<GetShortcutSettingsResponse>
  setShortcutSettings: (req: SetShortcutSettingsRequest) => Promise<SetShortcutSettingsResponse>
  onFocusCommandInput: (handler: () => void) => () => void

  /** Phase 11: PTY terminal bridge. */
  spawnPty: (req: PtySpawnRequest) => Promise<PtySpawnResponse>
  writePty: (req: PtyWriteRequest) => Promise<PtyWriteResponse>
  closePty: (req: PtyCloseRequest) => Promise<PtyCloseResponse>
  onPtyData: (handler: (event: PtyDataEvent) => void) => () => void

  /** Resolve a permission decision (convenience wrapper). */
  respond: (id: string, decision: PermissionDecision) => Promise<PermissionRespondResponse>

  /** Phase 4: encrypted Anthropic API key management. */
  setApiKey: (apiKey: string) => Promise<SetApiKeyResponse>
  getApiKeyStatus: () => Promise<GetApiKeyStatusResponse>
  clearApiKey: () => Promise<ClearApiKeyResponse>

  /** Phase 5: load CLAUDE.md / AGENTS.md / SKILL.md for the given project. */
  loadContext: (req: LoadContextRequest) => Promise<LoadContextResponse>
}
