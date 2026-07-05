/**
 * IPC Contract — shared types between main / preload / renderer.
 *
 * Phase 1: only `Ping` and `Placeholder` are wired.
 * Phase 2 fills in the rest (getProjects / addProject / removeProject /
 * getSessions / sendMessage / stopAgent + agent event channel). Phase 3-14
 * add more as features land.
 */

// --- Ping / placeholder (Phase 1) ---

export interface PingResponse {
  ok: boolean
  version: string
}

export interface PlaceholderResponse {
  status: 'not-implemented' | 'ok' | 'error'
  message?: string
}

// --- Projects (Phase 3 will back these with SQLite DAO) ---

export interface ProjectDto {
  id: string
  path: string
  displayName: string | null
  createdAt: number
  lastOpenedAt: number
}

export interface AddProjectRequest {
  path: string
  displayName?: string
}

export type AddProjectResponse =
  | { status: 'ok'; project: ProjectDto }
  | { status: 'error'; error: string }

export type SelectProjectDirectoryResponse =
  | { status: 'ok'; path: string | null }
  | { status: 'error'; error: string }

export interface GetProjectsResponse {
  projects: ProjectDto[]
}

export interface RemoveProjectRequest {
  id: string
}

export type RemoveProjectResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

// --- Sessions / Messages (Phase 3 + Phase 7) ---

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageDto {
  id: string
  sessionId: string
  role: MessageRole
  content: string
  toolUseId: string | null
  createdAt: number
  /** v1.0 cost tracking — null on legacy v0.1 rows and on user/system turns. */
  inputTokens: number | null
  outputTokens: number | null
  cacheCreationTokens: number | null
  cacheReadTokens: number | null
  costUsd: number | null
}

export interface SessionDto {
  id: string
  projectId: string
  title: string
  createdAt: number
  lastMessageAt: number
}

export interface GetSessionsRequest {
  projectId: string
}

export interface GetSessionsResponse {
  sessions: SessionDto[]
}

export interface CreateSessionRequest {
  projectId: string
  title?: string
}

export type CreateSessionResponse =
  | { status: 'ok'; session: SessionDto }
  | { status: 'error'; error: string }

export interface GetMessagesRequest {
  sessionId: string
}

export interface GetMessagesResponse {
  messages: MessageDto[]
}

// --- Settings (Phase 4: encrypted API key via safeStorage) ---

export type ApiKeyStatus = 'unset' | 'configured' | 'unknown'

export interface SetApiKeyRequest {
  apiKey: string
}

export type SetApiKeyResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

export type GetApiKeyStatusResponse =
  | { status: ApiKeyStatus }
  | { status: 'error'; error: string }

export type ClearApiKeyResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

// --- System integration (Phase 13) ---

export interface ProjectSwitchRequest {
  projectPath: string
}

export type ProjectSwitchResponse =
  | { status: 'ok'; projectPath: string; windowId: number }
  | { status: 'error'; error: string }

export interface WindowNewRequest {
  projectPath?: string
}

export type WindowNewResponse =
  | { status: 'ok'; windowId: number }
  | { status: 'error'; error: string }

export type WindowFocusResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

export interface ShortcutSettingsDto {
  enabled: boolean
  accelerator: string
  registered: boolean
  lastError: string | null
}

export type GetShortcutSettingsResponse =
  | { status: 'ok'; settings: ShortcutSettingsDto }
  | { status: 'error'; error: string }

export interface SetShortcutSettingsRequest {
  enabled: boolean
  accelerator: string
}

export type SetShortcutSettingsResponse =
  | { status: 'ok'; settings: ShortcutSettingsDto }
  | { status: 'error'; error: string }

// --- Agent (Phase 6 + 7) ---

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'streaming'
  | 'executing'
  | 'awaiting-permission'
  | 'done'
  | 'error'

export interface SendMessageRequest {
  text: string
  projectPath: string
}

export interface SendMessageResponse {
  turnId: string
}

export interface StopAgentRequest {
  turnId?: string
}

export type StopAgentResponse =
  | { status: 'ok'; abortedTurnIds: string[] }
  | { status: 'error'; error: string }

// --- Permissions (Phase 10 will surface UI; Phase 2 only types the channel) ---

export interface PermissionRequestDto {
  id: string
  toolName: string
  input: unknown
  risk: 'low' | 'medium' | 'high'
  summary: string
  detail?: string
  canAlwaysAllow?: boolean
}

export type PermissionDecision = 'deny' | 'allow-once' | 'always-allow'

export interface PermissionRespondRequest {
  id: string
  decision: PermissionDecision
}

export type PermissionRespondResponse =
  | { status: 'ok' }
  | { status: 'error'; error: string }

// --- Prompt context (Phase 5: CLAUDE.md / AGENTS.md / SKILL.md loader) ---

export type SkillScope = 'builtin' | 'global' | 'project' | 'invalid'

export interface SkillDto {
  name: string
  description: string
  whenToUse: string | null
  allowedTools: string[]
  content: string
  path: string
  scope: SkillScope
  loadError: string | null
}

export interface SkillLoadErrorDto {
  path: string
  reason: string
}

export interface PromptContextDto {
  projectPath: string
  claudeMd: string
  agentsMd: string
  skills: SkillDto[]
  loadErrors: SkillLoadErrorDto[]
}

export interface LoadContextRequest {
  projectPath: string
}

export type LoadContextResponse =
  | { status: 'ok'; context: PromptContextDto }
  | { status: 'error'; error: string }

export type {
  PtyCloseRequest,
  PtyCloseResponse,
  PtyDataEvent,
  PtySpawnRequest,
  PtySpawnResponse,
  PtyWriteRequest,
  PtyWriteResponse,
} from './pty'

// --- Push events: main → renderer ---

export interface AgentTextDeltaEvent {
  type: 'text_delta'
  turnId: string
  delta: string
}

export interface AgentToolUseEvent {
  type: 'tool_use'
  turnId: string
  toolUseId: string
  toolName: string
  input: unknown
}

export interface AgentToolResultEvent {
  type: 'tool_result'
  turnId: string
  toolUseId: string
  ok: boolean
  output?: unknown
  error?: string
}

export interface AgentStatusEvent {
  type: 'status'
  turnId: string
  status: AgentStatus
}

export interface AgentPermissionRequestEvent {
  type: 'permission_request'
  turnId: string
  request: PermissionRequestDto
}

export interface AgentErrorEvent {
  type: 'error'
  turnId: string
  code: string
  message: string
}

export interface AgentEndTurnEvent {
  type: 'end_turn'
  turnId: string
}

export type AgentEvent =
  | AgentTextDeltaEvent
  | AgentToolUseEvent
  | AgentToolResultEvent
  | AgentStatusEvent
  | AgentPermissionRequestEvent
  | AgentErrorEvent
  | AgentEndTurnEvent

// --- Channel name constants ---

export const IPC_EVENTS = {
  AGENT_EVENT: 'nexus:agent:event',
  PTY_DATA: 'nexus:pty:data',
  FOCUS_COMMAND_INPUT: 'nexus:focusCommandInput',
} as const

export const IPC_HANDLERS = {
  PING: 'nexus:ping',
  PLACEHOLDER: 'nexus:placeholder',
  GET_PROJECTS: 'nexus:getProjects',
  SELECT_PROJECT_DIRECTORY: 'nexus:selectProjectDirectory',
  ADD_PROJECT: 'nexus:addProject',
  REMOVE_PROJECT: 'nexus:removeProject',
  GET_SESSIONS: 'nexus:getSessions',
  CREATE_SESSION: 'nexus:createSession',
  GET_MESSAGES: 'nexus:getMessages',
  SEND_MESSAGE: 'nexus:sendMessage',
  STOP_AGENT: 'nexus:stopAgent',
  PERMISSION_RESPOND: 'nexus:permissionRespond',
  SET_API_KEY: 'nexus:settings:setApiKey',
  GET_API_KEY_STATUS: 'nexus:settings:getApiKeyStatus',
  CLEAR_API_KEY: 'nexus:settings:clearApiKey',
  LOAD_CONTEXT: 'nexus:agent:loadContext',
  WINDOW_NEW: 'nexus:window:new',
  WINDOW_FOCUS: 'nexus:window:focus',
  PROJECT_SWITCH: 'nexus:project:switch',
  GET_SHORTCUT_SETTINGS: 'nexus:shortcuts:getSettings',
  SET_SHORTCUT_SETTINGS: 'nexus:shortcuts:setSettings',
  PTY_SPAWN: 'nexus:pty:spawn',
  PTY_WRITE: 'nexus:pty:write',
  PTY_CLOSE: 'nexus:pty:close',
} as const
