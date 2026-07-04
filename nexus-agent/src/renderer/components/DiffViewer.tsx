import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, ChevronRight, Copy, GitBranch, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DiffFullscreen, DiffView, diffToClipboardText } from './DiffViewer/DiffView'

export interface DiffLineData {
  type: 'context' | 'addition' | 'deletion'
  content: string
  oldLine?: number
  newLine?: number
}

export interface DiffHunk {
  header: string
  oldStart: number
  newStart: number
  lines: DiffLineData[]
}

export interface DiffData {
  fileName: string
  additions: number
  deletions: number
  hunks: DiffHunk[]
}

interface DiffViewerProps {
  diff?: DiffData | null
  isVisible?: boolean
}

export default function DiffViewer({ diff = null, isVisible = true }: DiffViewerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const handleCopy = () => {
    if (!diff) return
    void navigator.clipboard.writeText(diffToClipboardText(diff))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isVisible) return null
  if (!diff) {
    return (
      <div
        className="rounded-[var(--seed-radius)] border border-dashed border-[var(--color-border-subtle)] px-3 py-2 text-[11px] text-[var(--seed-muted)]"
        data-component="DiffViewer"
        data-od-id="diff-viewer"
      >
        暂无 diff
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--seed-bg)]"
      data-component="DiffViewer"
      data-od-id="diff-viewer"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-2">
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown size={12} className="flex-shrink-0 text-[var(--seed-muted)]" />
          ) : (
            <ChevronRight size={12} className="flex-shrink-0 text-[var(--seed-muted)]" />
          )}
          <GitBranch size={12} className="flex-shrink-0 text-[var(--seed-primary)]" />
          <span className="truncate font-mono text-[11px] text-[var(--seed-fg)]">{diff.fileName}</span>
        </button>

        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="flex items-center gap-0.5 font-mono text-[10px] text-[var(--seed-primary)]">
            <Plus size={10} />
            {diff.additions}
          </span>
          <span className="flex items-center gap-0.5 font-mono text-[10px] text-[var(--seed-accent)]">
            <Minus size={10} />
            {diff.deletions}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setFullscreen(true)} title="全屏 Diff">
            ↗
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleCopy} title="复制 Diff">
            {copied ? <Check size={11} className="text-[var(--seed-primary)]" /> : <Copy size={11} />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <DiffView diff={diff} />
          </motion.div>
        )}
      </AnimatePresence>

      {fullscreen && <DiffFullscreen diff={diff} onClose={() => setFullscreen(false)} />}
    </motion.div>
  )
}
