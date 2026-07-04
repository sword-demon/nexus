import type { AgentToolResultEvent } from '../../shared/types/ipc'
import { PathGuardError } from '../security/pathGuard'
import { PermissionRejectedError, requestPermission, type PermissionContext } from '../security/permissions'
import { execTool } from './tools/exec'
import { listDirTool } from './tools/listDir'
import { readFileTool } from './tools/readFile'
import { searchFilesTool } from './tools/searchFiles'
import { writeFileTool } from './tools/writeFile'
import type { ToolCall } from './types'

export interface ToolDispatchResult {
  ok: boolean
  output?: unknown
  error?: string
}

export interface ToolDispatchContext {
  projectRoot: string
  allowedTools?: string[] | null
  permission?: Omit<PermissionContext, 'projectRoot'>
}

export async function dispatchToolCall(toolUse: ToolCall, context: ToolDispatchContext): Promise<ToolDispatchResult> {
  try {
    if (context.allowedTools && !context.allowedTools.includes(toolUse.name)) {
      return { ok: false, error: `Tool not allowed by active skill: ${toolUse.name}` }
    }
    switch (toolUse.name) {
      case 'read_file':
        return { ok: true, output: await readFileTool(context.projectRoot, readString(toolUse.input, 'path')) }
      case 'write_file':
        if (context.permission) await requestPermission(toolUse, { projectRoot: context.projectRoot, ...context.permission })
        return {
          ok: true,
          output: await writeFileTool(
            context.projectRoot,
            readString(toolUse.input, 'path'),
            readString(toolUse.input, 'content'),
          ),
        }
      case 'list_dir':
        return { ok: true, output: await listDirTool(context.projectRoot, readOptionalString(toolUse.input, 'path') ?? '.') }
      case 'search_files':
        return {
          ok: true,
          output: await searchFilesTool(
            context.projectRoot,
            readString(toolUse.input, 'query'),
            readOptionalString(toolUse.input, 'path') ?? '.',
          ),
        }
      case 'exec':
        if (context.permission) await requestPermission(toolUse, { projectRoot: context.projectRoot, ...context.permission })
        return {
          ok: true,
          output: await execTool(
            context.projectRoot,
            readString(toolUse.input, 'command'),
            readStringArray(toolUse.input, 'args'),
            readOptionalString(toolUse.input, 'cwd') ?? '.',
          ),
        }
      default:
        return { ok: false, error: `Unsupported tool: ${toolUse.name}` }
    }
  } catch (error) {
    return { ok: false, error: errorMessage(error) }
  }
}

export function toToolResultEvent(turnId: string, toolUse: ToolCall, result: ToolDispatchResult): AgentToolResultEvent {
  return {
    type: 'tool_result',
    turnId,
    toolUseId: toolUse.id,
    ok: result.ok,
    output: result.output,
    error: result.error,
  }
}

function readString(input: unknown, key: string): string {
  const value = readRecord(input)[key]
  if (typeof value !== 'string') throw new Error(`Tool input.${key} must be a string`)
  return value
}

function readOptionalString(input: unknown, key: string): string | undefined {
  const value = readRecord(input)[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`Tool input.${key} must be a string`)
  return value
}

function readStringArray(input: unknown, key: string): string[] {
  const value = readRecord(input)[key]
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Tool input.${key} must be a string array`)
  }
  return value
}

function readRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Tool input must be an object')
  }
  return input as Record<string, unknown>
}

function errorMessage(error: unknown): string {
  if (error instanceof PermissionRejectedError) return error.code
  if (error instanceof PathGuardError) return `${error.code}: ${error.message}`
  return error instanceof Error ? error.message : String(error)
}
