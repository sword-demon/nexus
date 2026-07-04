import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { cn } from '@/lib/utils'
import { createXtermOptions } from './XtermTheme'

interface PtyTerminalProps {
  projectRoot: string
  cwd: string
  initialOutput?: string
  className?: string
}

export default function PtyTerminal({ projectRoot, cwd, initialOutput = '', className }: PtyTerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof window === 'undefined' || !window.nexus) return undefined

    const term = new Terminal(createXtermOptions())
    const fitAddon = new FitAddon()
    let sessionId: string | null = null
    let resizeObserver: ResizeObserver | null = null

    term.loadAddon(fitAddon)
    term.open(container)
    fitAddon.fit()
    if (initialOutput) term.write(normalizeForTerminal(initialOutput))

    const dataDisposable = term.onData((data) => {
      if (sessionId) void window.nexus.writePty({ sessionId, data })
    })
    const offPtyData = window.nexus.onPtyData((event) => {
      if (event.sessionId !== sessionId) return
      if (event.data) term.write(event.data)
      if (typeof event.exitCode === 'number') term.write(`\r\n[exit ${event.exitCode}]\r\n`)
    })

    void window.nexus.spawnPty({ command: '/bin/sh', args: [], cwd, projectRoot }).then((res) => {
      if (res.status === 'ok') {
        sessionId = res.sessionId
        return
      }
      term.write(`\r\nPTY error: ${res.error}\r\n`)
    })

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => fitAddon.fit())
      resizeObserver.observe(container)
    }

    return () => {
      dataDisposable.dispose()
      offPtyData()
      resizeObserver?.disconnect()
      if (sessionId) void window.nexus.closePty({ sessionId })
      term.dispose()
    }
  }, [cwd, initialOutput, projectRoot])

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-[220px] overflow-hidden rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-2',
        className,
      )}
      data-component="PtyTerminal"
      data-od-id="pty-terminal"
      data-terminal-font-size="13"
      data-terminal-background="--color-surface-card"
    />
  )
}

function normalizeForTerminal(value: string): string {
  return value.replace(/\n/g, '\r\n')
}
