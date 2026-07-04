import { Code, FileText, Search, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PendingTool, PendingToolStatus } from '@/store/slices/toolsSlice'
import type { DiffData } from '../DiffViewer'

export interface TerminalData {
  projectRoot: string
  cwd: string
  stdout: string
  exitCode: number
}

export interface Tool {
  id: string
  name: string
  label: string
  icon: LucideIcon
  status: 'pending' | 'running' | 'success' | 'rejected' | 'error'
  detail: string
  duration: string | null
  output: string | null
  diff?: DiffData | null
  terminal?: TerminalData | null
}

export function toToolItem(tool: PendingTool, fallbackProjectRoot: string): Tool {
  const terminal = extractTerminal(tool.output, fallbackProjectRoot)
  return {
    id: tool.toolUseId,
    name: tool.toolName,
    label: labelForTool(tool.toolName),
    icon: iconForTool(tool.toolName),
    status: statusForTool(tool.status),
    detail: detailForInput(tool.input),
    duration: durationForTool(tool),
    output: tool.error ?? summarizeToolOutput(tool.output),
    diff: extractDiff(tool.output),
    terminal,
  }
}

function labelForTool(toolName: string): string {
  if (toolName === 'write_file') return '写入文件'
  if (toolName === 'read_file') return '读取文件'
  if (toolName.includes('search')) return '搜索'
  if (toolName.includes('exec') || toolName.includes('command')) return '执行命令'
  return toolName
}

function iconForTool(toolName: string): LucideIcon {
  if (toolName === 'write_file') return Code
  if (toolName === 'read_file') return FileText
  if (toolName.includes('search')) return Search
  return Terminal
}

function statusForTool(status: PendingToolStatus): Tool['status'] {
  if (status === 'done') return 'success'
  if (status === 'rejected') return 'rejected'
  if (status === 'error') return 'error'
  if (status === 'running') return 'running'
  return 'pending'
}

function durationForTool(tool: PendingTool): string | null {
  if (!tool.finishedAt) return null
  return `${Math.max(0, (tool.finishedAt - tool.startedAt) / 1000).toFixed(1)}s`
}

function detailForInput(input: unknown): string {
  if (isRecord(input) && typeof input.path === 'string') return input.path
  return summarizeUnknown(input) ?? ''
}

function summarizeToolOutput(value: unknown): string | null {
  if (isRecord(value) && typeof value.command === 'string' && typeof value.exitCode === 'number') {
    return `exit ${value.exitCode}`
  }
  return summarizeUnknown(value)
}

function summarizeUnknown(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function extractDiff(value: unknown): DiffData | null {
  if (!isRecord(value)) return null
  return isDiffData(value.diff) ? value.diff : null
}

function extractTerminal(value: unknown, fallbackProjectRoot: string): TerminalData | null {
  if (!isRecord(value)) return null
  if (
    typeof value.command !== 'string' ||
    typeof value.cwd !== 'string' ||
    typeof value.stdout !== 'string' ||
    typeof value.exitCode !== 'number'
  ) {
    return null
  }
  const projectRoot = typeof value.projectRoot === 'string' ? value.projectRoot : fallbackProjectRoot
  if (!projectRoot) return null
  if (!hasAnsiSequence(value.stdout)) return null
  return { projectRoot, cwd: value.cwd, stdout: value.stdout, exitCode: value.exitCode }
}

function hasAnsiSequence(value: string): boolean {
  return /\u001b\[[0-9;?]*[ -/]*[@-~]/.test(value)
}

function isDiffData(value: unknown): value is DiffData {
  return isRecord(value) &&
    typeof value.fileName === 'string' &&
    typeof value.additions === 'number' &&
    typeof value.deletions === 'number' &&
    Array.isArray(value.hunks)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
