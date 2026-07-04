import { useEffect, useMemo, useRef } from 'react'
import * as monaco from 'monaco-editor'
import 'monaco-editor/min/vs/editor/editor.main.css'
import type { DiffData, DiffLineData } from '../DiffViewer'
import { Button } from '@/components/ui/button'
import { defineNexusMonacoTheme, NEXUS_MONACO_THEME } from './MonacoTheme'

const SIDE_BY_SIDE_LINE_THRESHOLD = 24

interface DiffViewProps {
  diff: DiffData
  fullscreen?: boolean
}

interface DiffFullscreenProps {
  diff: DiffData
  onClose: () => void
}

export function DiffView({ diff, fullscreen = false }: DiffViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const texts = useMemo(() => diffToTexts(diff), [diff])
  const lineCount = Math.max(texts.originalLineCount, texts.modifiedLineCount)
  const renderSideBySide = fullscreen || lineCount > SIDE_BY_SIDE_LINE_THRESHOLD

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    defineNexusMonacoTheme(monaco)
    const originalModel = monaco.editor.createModel(texts.original, languageFor(diff.fileName))
    const modifiedModel = monaco.editor.createModel(texts.modified, languageFor(diff.fileName))
    const editor = monaco.editor.createDiffEditor(container, {
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, SFMono-Regular, Menlo, monospace',
      fontSize: 12,
      glyphMargin: false,
      lineNumbers: 'on',
      minimap: { enabled: false },
      readOnly: true,
      renderOverviewRuler: false,
      renderSideBySide,
      scrollBeyondLastLine: false,
      theme: NEXUS_MONACO_THEME,
      wordWrap: 'off',
      ariaLabel: diff.fileName,
    })

    editor.setModel({ original: originalModel, modified: modifiedModel })

    return () => {
      editor.dispose()
      originalModel.dispose()
      modifiedModel.dispose()
    }
  }, [diff.fileName, renderSideBySide, texts.modified, texts.original])

  return (
    <div
      ref={containerRef}
      className={fullscreen ? 'h-full min-h-0' : 'h-[280px] min-h-[220px]'}
      data-component="MonacoDiff"
      data-od-id="monaco-diff"
      data-diff-additions={diff.additions}
      data-diff-deletions={diff.deletions}
      data-render-side-by-side={renderSideBySide ? 'true' : 'false'}
      data-line-numbers="true"
    />
  )
}

export function DiffFullscreen({ diff, onClose }: DiffFullscreenProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--seed-bg)]"
      data-component="DiffFullscreen"
      data-od-id="diff-fullscreen"
    >
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="min-w-0 font-mono text-xs text-[var(--seed-fg)] truncate">{diff.fileName}</div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭全屏 Diff">
          ×
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <DiffView diff={diff} fullscreen />
      </div>
    </div>
  )
}

export function diffToClipboardText(diff: DiffData): string {
  return diff.hunks
    .flatMap((hunk) => hunk.lines)
    .map((line) => `${prefixFor(line)} ${line.content}`)
    .join('\n')
}

function diffToTexts(diff: DiffData): {
  original: string
  modified: string
  originalLineCount: number
  modifiedLineCount: number
} {
  const lines = diff.hunks.flatMap((hunk) => hunk.lines)
  const original = lines.filter((line) => line.type !== 'addition').map((line) => line.content)
  const modified = lines.filter((line) => line.type !== 'deletion').map((line) => line.content)
  return {
    original: original.join('\n'),
    modified: modified.join('\n'),
    originalLineCount: original.length,
    modifiedLineCount: modified.length,
  }
}

function prefixFor(line: DiffLineData): string {
  if (line.type === 'addition') return '+'
  if (line.type === 'deletion') return '-'
  return ' '
}

function languageFor(fileName: string): string {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript'
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript'
  if (fileName.endsWith('.json')) return 'json'
  if (fileName.endsWith('.css')) return 'css'
  if (fileName.endsWith('.md')) return 'markdown'
  return 'plaintext'
}
