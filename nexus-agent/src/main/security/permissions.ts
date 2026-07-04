import type { AgentEvent, PermissionDecision, PermissionRequestDto } from '../../shared/types/ipc'
import type { ToolCall } from '../agent/types'
import { isDangerousCommand } from './dangerous'
import { addPermissionRule, hasPermissionRule, type PermissionRule } from './permissionMatch'

export class PermissionRejectedError extends Error {
  readonly code = 'rejected'

  constructor() {
    super('rejected')
    this.name = 'PermissionRejectedError'
  }
}

interface PendingPermission {
  resolve: (decision: PermissionDecision) => void
}

export interface PermissionContext {
  projectRoot: string
  turnId: string
  onEvent: (event: AgentEvent) => void
}

const pending = new Map<string, PendingPermission>()

export async function requestPermission(toolUse: ToolCall, context: PermissionContext): Promise<void> {
  if (toolUse.name !== 'write_file' && toolUse.name !== 'exec') return

  const rule = permissionRule(toolUse, context.projectRoot)
  const dangerous = toolUse.name === 'exec' && isDangerousCommand(rule.pattern)
  if (!dangerous && hasPermissionRule(rule)) return

  const request = permissionRequest(toolUse, rule.pattern, dangerous)
  const decision = await waitForDecision(request, context)
  if (decision === 'deny') throw new PermissionRejectedError()
  if (decision === 'always-allow' && !dangerous) addPermissionRule(rule)
}

export function respondPermission(id: string, decision: PermissionDecision): boolean {
  const item = pending.get(id)
  if (!item) return false
  pending.delete(id)
  item.resolve(decision)
  return true
}

function waitForDecision(request: PermissionRequestDto, context: PermissionContext): Promise<PermissionDecision> {
  return new Promise((resolve) => {
    pending.set(request.id, { resolve })
    context.onEvent({ type: 'permission_request', turnId: context.turnId, request })
  })
}

function permissionRule(toolUse: ToolCall, projectRoot: string): PermissionRule {
  return {
    projectRoot,
    toolName: toolUse.name,
    pattern: patternFor(toolUse),
  }
}

function permissionRequest(toolUse: ToolCall, pattern: string, dangerous: boolean): PermissionRequestDto {
  return {
    id: `perm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    toolName: toolUse.name,
    input: toolUse.input,
    risk: dangerous ? 'high' : toolUse.name === 'exec' ? 'medium' : 'low',
    summary: toolUse.name === 'exec' ? `执行命令：${pattern}` : `写入文件：${pattern}`,
    detail: dangerous ? '危险命令需要单次确认' : pattern,
    canAlwaysAllow: !dangerous,
  }
}

function patternFor(toolUse: ToolCall): string {
  const input = isRecord(toolUse.input) ? toolUse.input : {}
  if (toolUse.name === 'write_file') {
    return typeof input.path === 'string' ? input.path : ''
  }
  const command = typeof input.command === 'string' ? input.command : ''
  const args = Array.isArray(input.args) ? input.args.filter((item): item is string => typeof item === 'string') : []
  return [command, ...args].filter(Boolean).join(' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
