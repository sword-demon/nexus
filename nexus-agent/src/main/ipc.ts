import { dialog, ipcMain } from 'electron'
import { homedir as osHomedir } from 'node:os'
import { logger } from './logger'
import { createProject, deleteProject, listProjects } from './db/dao/projects'
import { createSession, listSessions } from './db/dao/sessions'
import { appendMessage, listMessages } from './db/dao/messages'
import { clearApiKey, getApiKey, setApiKey } from './security/apiKey'
import { respondPermission } from './security/permissions'
import { resolveTrustedProjectRoot } from './security/projectTrust'
import { getEncryptedApiKey } from './db/dao/settings'
import { loadPromptContext } from './skills/loader'
import { runTurn } from './agent/loop'
import { dispatchToolCall, toToolResultEvent } from './agent/dispatcher'
import { createAgentSignal, type AgentSignal } from './agent/signals'
import { mapAgentError } from './agent/stream'
import { computeCost } from './agent/cost'
import { registerPtyIpcHandlers } from './pty/ipc'
import { notify } from './notifications'
import { updateTrayStatus } from './tray'
import { createManagedWindow, focusMainWindow, setProjectForSender } from './window/manager'
import { getShortcutState, updateGlobalShortcutConfig } from './shortcuts/global'
import type { AgentInputMessage } from './agent/types'
import {
  IPC_EVENTS,
  IPC_HANDLERS,
  type AddProjectRequest,
  type AddProjectResponse,
  type AgentEvent,
  type ClearApiKeyResponse,
  type CreateSessionRequest,
  type CreateSessionResponse,
  type GetApiKeyStatusResponse,
  type GetMessagesRequest,
  type GetMessagesResponse,
  type GetProjectsResponse,
  type GetShortcutSettingsResponse,
  type GetSessionsRequest,
  type GetSessionsResponse,
  type LoadContextRequest,
  type LoadContextResponse,
  type PermissionRespondRequest,
  type PermissionRespondResponse,
  type RemoveProjectRequest,
  type RemoveProjectResponse,
  type SelectProjectDirectoryResponse,
  type SendMessageRequest,
  type SendMessageResponse,
  type SetApiKeyRequest,
  type SetApiKeyResponse,
  type SetShortcutSettingsRequest,
  type SetShortcutSettingsResponse,
  type StopAgentRequest,
  type StopAgentResponse,
  type ProjectSwitchRequest,
  type ProjectSwitchResponse,
  type WindowFocusResponse,
  type WindowNewRequest,
  type WindowNewResponse,
  type PromptContextDto,
  type SkillDto,
} from '../shared/types/ipc'

/**
 * Phase 3+: project/session/message handlers are SQLite-backed. Phase 6 wires
 * sendMessage to Anthropic streaming; later phases add the agent loop and real
 * permission UX.
 */
const activeTurns = new Map<string, AgentSignal>()

export function registerIpcHandlers(): void {
  registerPtyIpcHandlers()

  ipcMain.handle(IPC_HANDLERS.PING, async () => {
    await logger.info('ipc', 'ping received')
    return { ok: true, version: '0.1.0' }
  })

  ipcMain.handle(IPC_HANDLERS.PLACEHOLDER, async () => {
    return { status: 'not-implemented' as const }
  })

  // --- Window / project integration ---

  ipcMain.handle(
    IPC_HANDLERS.WINDOW_NEW,
    async (_event, req?: WindowNewRequest): Promise<WindowNewResponse> => {
      try {
        const window = await createManagedWindow(req?.projectPath)
        await logger.info('ipc', `window:new id=${window.id}`)
        return { status: 'ok', windowId: window.id }
      } catch (error) {
        await logger.error('ipc', `window:new failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(IPC_HANDLERS.WINDOW_FOCUS, async (): Promise<WindowFocusResponse> => {
    return focusMainWindow() ? { status: 'ok' } : { status: 'error', error: 'No window to focus' }
  })

  ipcMain.handle(
    IPC_HANDLERS.PROJECT_SWITCH,
    async (event, req: ProjectSwitchRequest): Promise<ProjectSwitchResponse> => {
      try {
        const result = setProjectForSender(event.sender, req.projectPath)
        await logger.info('ipc', `project:switch window=${result.windowId} path=${result.projectPath}`)
        return { status: 'ok', ...result }
      } catch (error) {
        await logger.error('ipc', `project:switch failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.GET_SHORTCUT_SETTINGS,
    async (): Promise<GetShortcutSettingsResponse> => {
      return { status: 'ok', settings: getShortcutState() }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.SET_SHORTCUT_SETTINGS,
    async (_event, req: SetShortcutSettingsRequest): Promise<SetShortcutSettingsResponse> => {
      try {
        return { status: 'ok', settings: updateGlobalShortcutConfig(req) }
      } catch (error) {
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  // --- Projects ---

  ipcMain.handle(IPC_HANDLERS.GET_PROJECTS, async (): Promise<GetProjectsResponse> => {
    return { projects: listProjects() }
  })

  ipcMain.handle(
    IPC_HANDLERS.SELECT_PROJECT_DIRECTORY,
    async (): Promise<SelectProjectDirectoryResponse> => {
      try {
        const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
        return { status: 'ok', path: res.canceled ? null : res.filePaths[0] ?? null }
      } catch (error) {
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.ADD_PROJECT,
    async (_event, req: AddProjectRequest): Promise<AddProjectResponse> => {
      try {
        const project = createProject(req)
        await logger.info('ipc', `addProject: ${req.path}`)
        return { status: 'ok', project }
      } catch (error) {
        await logger.error('ipc', `addProject failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.REMOVE_PROJECT,
    async (_event, req: RemoveProjectRequest): Promise<RemoveProjectResponse> => {
      const deleted = deleteProject(req.id)
      if (!deleted) return { status: 'error', error: `Project not found: ${req.id}` }
      await logger.info('ipc', `removeProject: ${req.id}`)
      return { status: 'ok' }
    },
  )

  // --- Sessions / Messages ---

  ipcMain.handle(
    IPC_HANDLERS.GET_SESSIONS,
    async (_event, req: GetSessionsRequest): Promise<GetSessionsResponse> => {
      return { sessions: listSessions(req.projectId) }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.CREATE_SESSION,
    async (_event, req: CreateSessionRequest): Promise<CreateSessionResponse> => {
      try {
        const session = createSession(req)
        await logger.info('ipc', `createSession: project=${req.projectId}`)
        return { status: 'ok', session }
      } catch (error) {
        await logger.error('ipc', `createSession failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.GET_MESSAGES,
    async (_event, req: GetMessagesRequest): Promise<GetMessagesResponse> => {
      return { messages: listMessages(req.sessionId) }
    },
  )

  // --- Agent stream (Phase 6: Anthropic SDK client + event push) ---

  ipcMain.handle(
    IPC_HANDLERS.SEND_MESSAGE,
    async (event, req: SendMessageRequest): Promise<SendMessageResponse> => {
      const turnId = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const agentSignal = createAgentSignal()
      activeTurns.set(turnId, agentSignal)

      const notifiedTurns = new Set<string>()
      const sendEvent = (payload: AgentEvent): void => {
        handleAgentSideEffects(payload, notifiedTurns)
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_EVENTS.AGENT_EVENT, payload)
        }
      }

      void runStreamingTurn(turnId, req, agentSignal, sendEvent)

      return { turnId }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.STOP_AGENT,
    async (_event, req: StopAgentRequest): Promise<StopAgentResponse> => {
      const turnIds = req.turnId ? [req.turnId] : Array.from(activeTurns.keys())
      const abortedTurnIds: string[] = []
      for (const turnId of turnIds) {
        const turn = activeTurns.get(turnId)
        turn?.abort()
        if (turn?.aborted) abortedTurnIds.push(turnId)
      }
      await logger.info('ipc', `stopAgent: aborted=${turnIds.join(',') || '(none)'}`)
      return { status: 'ok', abortedTurnIds }
    },
  )

  // --- Permissions ---

  ipcMain.handle(
    IPC_HANDLERS.PERMISSION_RESPOND,
    async (_event, req: PermissionRespondRequest): Promise<PermissionRespondResponse> => {
      const ok = respondPermission(req.id, req.decision)
      await logger.info('ipc', `permissionRespond: ${req.id} → ${req.decision}`)
      return ok ? { status: 'ok' } : { status: 'error', error: `Permission not found: ${req.id}` }
    },
  )

  // --- Settings (Phase 4: encrypted API key via safeStorage) ---

  ipcMain.handle(
    IPC_HANDLERS.SET_API_KEY,
    async (_event, req: SetApiKeyRequest): Promise<SetApiKeyResponse> => {
      try {
        setApiKey(req.apiKey)
        await logger.info('ipc', 'setApiKey: stored encrypted blob')
        return { status: 'ok' }
      } catch (error) {
        await logger.error('ipc', `setApiKey failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.GET_API_KEY_STATUS,
    async (): Promise<GetApiKeyStatusResponse> => {
      const blob = getEncryptedApiKey()
      if (!blob) return { status: 'unset' }
      const apiKey = getApiKey()
      return { status: apiKey ? 'configured' : 'unset' }
    },
  )

  ipcMain.handle(
    IPC_HANDLERS.CLEAR_API_KEY,
    async (): Promise<ClearApiKeyResponse> => {
      clearApiKey()
      await logger.info('ipc', 'clearApiKey: removed blob')
      return { status: 'ok' }
    },
  )

  // --- Prompt context loader (Phase 5: CLAUDE.md / AGENTS.md / SKILL.md) ---

  ipcMain.handle(
    IPC_HANDLERS.LOAD_CONTEXT,
    async (_event, req: LoadContextRequest): Promise<LoadContextResponse> => {
      try {
        // Renderer has no `os` module access (sandboxed, nodeIntegration off).
        // An empty projectPath means "no project selected" — fall back to the
        // current user's home so the global CLAUDE.md / AGENTS.md / skills
        // are loaded for the persona-level prompt.
        const projectPath = req.projectPath.trim()
          ? resolveTrustedProjectRoot(req.projectPath)
          : process.env.NEXUS_CLAUDE_HOME || osHomedir()
        const context = await loadPromptContext(projectPath)
        await logger.info(
          'ipc',
          `loadContext: project=${projectPath} skills=${context.skills.length} errors=${context.loadErrors.length}`,
        )
        return { status: 'ok', context }
      } catch (error) {
        // loader is contractually non-throwing; this branch guards against
        // a future regression breaking that guarantee.
        await logger.error('ipc', `loadContext failed: ${getErrorMessage(error)}`)
        return { status: 'error', error: getErrorMessage(error) }
      }
    },
  )
}

async function runStreamingTurn(
  turnId: string,
  req: SendMessageRequest,
  agentSignal: AgentSignal,
  sendEvent: (event: AgentEvent) => void,
): Promise<void> {
  let sessionId: string | null = null
  try {
    const projectPath = resolveTrustedProjectRoot(req.projectPath)
    const project = createProject({ path: projectPath })
    const session = getOrCreateSession(project.id, req.text)
    sessionId = session.id
    const history = listMessages(session.id).map(toAgentInputMessage).filter((item): item is AgentInputMessage => item !== null)
    appendMessage({ sessionId: session.id, role: 'user', content: req.text })

    const commandLine = shellCommand(req.text)
    if (commandLine !== null) {
      await runShellCommandTurn(turnId, projectPath, session.id, commandLine, sendEvent)
      return
    }

    const promptContext = await loadPromptContext(projectPath)
    const allowedTools = allowedToolsForRequest(req.text, promptContext)
    let assistantText = ''
    const result = await runTurn({
      turnId,
      projectRoot: promptContext.projectPath,
      promptContext,
      messages: [...history, { role: 'user', content: req.text }],
      allowedTools,
      signal: agentSignal.signal,
      onEvent: (event) => {
        if (event.type === 'text_delta') assistantText += event.delta
        sendEvent(event)
      },
    })
    if (assistantText.trim()) {
      const usage = result.usage
      const costUsd = computeCost(result.model, usage)
      appendMessage({
        sessionId: session.id,
        role: 'assistant',
        content: assistantText,
        cost: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheCreationTokens: usage.cacheCreationInputTokens,
          cacheReadTokens: usage.cacheReadInputTokens,
          costUsd,
        },
      })
    }
    await logger.logApiCall({
      turnId,
      model: result.model,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheCreationInputTokens: result.usage.cacheCreationInputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
      firstTokenMs: result.firstTokenMs,
    })
  } catch (error) {
    const info = mapAgentError(error)
    await logger.error('agent', `turn failed: ${getErrorMessage(error)}`)
    if (sessionId) {
      appendMessage({ sessionId, role: 'assistant', content: info.message })
    }
    await logger.logApiCall({
      turnId,
      model: process.env.NEXUS_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      inputTokens: 0,
      outputTokens: 0,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
      firstTokenMs: null,
      errorCode: info.code,
      status: info.status,
    })
    sendEvent({ type: 'error', turnId, code: info.code, message: info.message })
    sendEvent({ type: 'status', turnId, status: 'error' })
  } finally {
    activeTurns.delete(turnId)
  }
}

function getOrCreateSession(projectId: string, text: string) {
  return listSessions(projectId)[0] ?? createSession({ projectId, title: sessionTitle(text) })
}

function sessionTitle(text: string): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, 80) || 'New session'
}

function toAgentInputMessage(message: ReturnType<typeof listMessages>[number]): AgentInputMessage | null {
  if (message.role !== 'user' && message.role !== 'assistant') return null
  return { role: message.role, content: message.content }
}

function shellCommand(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('!')) return null
  return trimmed.slice(1).trim()
}

async function runShellCommandTurn(
  turnId: string,
  projectPath: string,
  sessionId: string,
  commandLine: string,
  sendEvent: (event: AgentEvent) => void,
): Promise<void> {
  if (!commandLine) throw new Error('Shell command is empty')
  const toolUseId = `toolu-shell-${Date.now()}`
  const toolUse = {
    id: toolUseId,
    name: 'exec',
    input: {
      command: process.env.SHELL || '/bin/sh',
      args: ['-lc', commandLine],
      cwd: '.',
    },
  }
  sendEvent({ type: 'status', turnId, status: 'executing' })
  sendEvent({ type: 'tool_use', turnId, toolUseId, toolName: 'exec', input: toolUse.input })
  const result = await dispatchToolCall(toolUse, {
    projectRoot: projectPath,
    permission: { turnId, onEvent: sendEvent },
  })
  sendEvent(toToolResultEvent(turnId, toolUse, result))
  const text = shellResultText(result)
  appendMessage({ sessionId, role: 'assistant', content: text })
  sendEvent({ type: 'text_delta', turnId, delta: text })
  sendEvent({ type: 'end_turn', turnId })
  sendEvent({ type: 'status', turnId, status: 'done' })
}

function shellResultText(result: Awaited<ReturnType<typeof dispatchToolCall>>): string {
  if (!result.ok) return `命令未执行：${result.error ?? 'unknown error'}`
  const output = result.output as { exitCode?: number; stdout?: string }
  const stdout = output.stdout?.trim()
  return [`命令执行完成，退出码 ${output.exitCode ?? 0}。`, stdout].filter(Boolean).join('\n\n')
}

function allowedToolsForRequest(text: string, context: PromptContextDto): string[] | null {
  const skill = activeSkillForRequest(text, context.skills)
  return skill ? skill.allowedTools.map((tool) => tool.toLowerCase()) : null
}

function activeSkillForRequest(text: string, skills: SkillDto[]): SkillDto | null {
  const byName = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill]))
  const slashMatches = Array.from(text.matchAll(/\/([a-z0-9][a-z0-9-]*)/gi)).map((match) => match[1].toLowerCase())
  for (const name of slashMatches.reverse()) {
    const skill = byName.get(name)
    if (skill) return skill
  }
  const lower = text.toLowerCase()
  return skills
    .filter((skill) => skill.name && lower.includes(skill.name.toLowerCase()))
    .sort((left, right) => right.name.length - left.name.length)[0] ?? null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function handleAgentSideEffects(payload: AgentEvent, notifiedTurns: Set<string>): void {
  if (payload.type === 'status') {
    updateTrayStatus(payload.status)
    if (payload.status === 'done' && !notifiedTurns.has(payload.turnId)) {
      notifiedTurns.add(payload.turnId)
      notify({ title: 'Nexus Agent', body: 'Agent finished.' })
    }
  }
  if (payload.type === 'error' && !notifiedTurns.has(payload.turnId)) {
    notifiedTurns.add(payload.turnId)
    updateTrayStatus('error')
    notify({ title: 'Nexus Agent', body: payload.message })
  }
}
