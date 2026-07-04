import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, FolderOpen, Settings, PanelRight, Zap, Hash, FileCode, Plus, PanelLeftClose, PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './components/ui/button'
import ChatPanel from './components/ChatPanel'
import CommandInput from './components/CommandInput'
import ToolPanel from './components/ToolPanel'
import StatusIndicator from './components/StatusIndicator'
import SettingsModal from './components/SettingsModal'
import PermissionPrompt from './components/PermissionPrompt'
import { useAgentEvent } from './hooks/useAgentEvent'
import { useAppStore } from './store/appStore'
import type { ThemeKey } from './store/appStore'
import type { PromptContextDto } from '../shared/types/ipc'

const THEME_PRESETS: Record<ThemeKey, Record<string, string>> = {
  dark: {
    '--seed-bg': '#0f2a1f',
    '--seed-fg': '#d4e8dc',
    '--seed-primary': '#5b8a72',
    '--seed-accent': '#e85d3a',
    '--seed-surface': '#162f24',
    '--seed-muted': '#7a9e8a',
    '--seed-border': 'rgba(91, 138, 114, 0.2)',
  },
  light: {
    '--seed-bg': '#e8f5ec',
    '--seed-fg': '#1a382c',
    '--seed-primary': '#3a6450',
    '--seed-accent': '#d44a28',
    '--seed-surface': '#f0faf4',
    '--seed-muted': '#5b8a72',
    '--seed-border': 'rgba(58, 100, 80, 0.15)',
  },
  warm: {
    '--seed-bg': '#1a1510',
    '--seed-fg': '#f0e6d8',
    '--seed-primary': '#c4845a',
    '--seed-accent': '#e85d3a',
    '--seed-surface': '#241e16',
    '--seed-muted': '#a08870',
    '--seed-border': 'rgba(196, 132, 90, 0.2)',
  },
}

interface SidebarProps {
  onOpenSettings: () => void
  onAddProject: () => void
  onSelectProject: (projectId: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

interface ContextFileItem {
  name: string
  path: string
}

function buildContextFileItems(context: PromptContextDto | null): ContextFileItem[] {
  if (!context) return []
  const items: ContextFileItem[] = []
  if (context.claudeMd.trim()) {
    items.push({ name: 'CLAUDE.md', path: joinDisplayPath(context.projectPath, 'CLAUDE.md') })
  }
  if (context.agentsMd.trim()) {
    items.push({ name: 'AGENTS.md', path: joinDisplayPath(context.projectPath, 'AGENTS.md') })
  }
  for (const skill of context.skills) {
    if (skill.scope === 'invalid') continue
    items.push({ name: `${skill.name}/SKILL.md`, path: skill.path })
  }
  return items
}

function joinDisplayPath(root: string, fileName: string): string {
  return root ? `${root.replace(/\/$/, '')}/${fileName}` : fileName
}

function formatShortTime(value: number): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function baseName(path: string): string {
  const normalized = path.replace(/\/$/, '')
  return normalized.split('/').pop() || path
}

function Sidebar({ onOpenSettings, onAddProject, onSelectProject, collapsed, onToggleCollapse }: SidebarProps) {
  const [activeTab, setActiveTab] = useState('conversations')
  const projects = useAppStore((s) => s.projects)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const sessions = useAppStore((s) => s.sessions)
  const promptContext = useAppStore((s) => s.promptContext)
  const contextFiles = buildContextFileItems(promptContext)

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'h-full border-r border-[var(--color-border-subtle)] bg-[var(--seed-bg)] flex flex-col overflow-hidden flex-shrink-0',
      )}
      data-component="Sidebar"
      data-od-id="sidebar-left"
    >
      {/* Brand Header */}
      <div className={cn('py-4 border-b border-[var(--color-border-subtle)]', collapsed ? 'px-2' : 'px-4')}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--seed-primary)] flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-[var(--seed-bg)]" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0"
            >
              <h1 className="text-sm font-medium tracking-[-0.02em]">NexusAgent</h1>
              <p className="text-[10px] text-[var(--seed-muted)] tracking-[0.02em]">v2.4.0</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Project Button */}
      <div className={cn('pt-3', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <Button variant="accent" size="icon-sm" className="w-full aspect-square" onClick={onAddProject} title="添加项目">
            <Plus size={16} />
          </Button>
        ) : (
          <Button variant="accent" size="sm" className="w-full gap-2 text-xs" onClick={onAddProject}>
            <Plus size={14} />
            添加项目
          </Button>
        )}
      </div>

      {/* Tab Switcher (hidden when collapsed) */}
      {!collapsed && (
        <div className="flex px-3 pt-3 gap-1">
          <Button
            variant={activeTab === 'conversations' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('conversations')}
            className="flex-1 gap-1.5 text-[11px]"
          >
            <MessageSquare size={12} />
            对话
          </Button>
          <Button
            variant={activeTab === 'context' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('context')}
            className="flex-1 gap-1.5 text-[11px]"
          >
            <FolderOpen size={12} />
            上下文
          </Button>
        </div>
      )}

      {/* Collapsed icon tabs */}
      {collapsed && (
        <div className="flex flex-col items-center gap-1 px-2 pt-3">
          <Button
            variant={activeTab === 'conversations' ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTab('conversations')}
            title="对话"
          >
            <MessageSquare size={14} />
          </Button>
          <Button
            variant={activeTab === 'context' ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTab('context')}
            title="上下文"
          >
            <FolderOpen size={14} />
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {!collapsed && (
          <AnimatePresence mode="wait">
            {activeTab === 'conversations' ? (
              <motion.div
                key="conversations"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-1"
              >
                {sessions.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-[var(--seed-muted)]">
                    暂无对话
                  </div>
                )}
                {sessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    className="w-full text-left px-3 py-2.5 h-auto justify-start border border-transparent"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <span className={cn(
                        'text-xs leading-snug line-clamp-2',
                        'text-[var(--color-text-secondary)]'
                      )}>
                        {session.title}
                      </span>
                      <span className="text-[10px] text-[var(--seed-muted)] flex-shrink-0 mt-0.5">
                        {formatShortTime(session.lastMessageAt)}
                      </span>
                    </div>
                  </Button>
                ))}
                {sessions.length === 0 && projects.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em] px-2 pb-1">
                      项目
                    </p>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => onSelectProject(project.id)}
                        className={cn(
                          'w-full px-3 py-2 rounded-[var(--seed-radius)] border text-left',
                          project.id === currentProjectId
                            ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-active)]'
                            : 'border-transparent',
                        )}
                        data-od-id="project-tab"
                      >
                        <p className="text-xs text-[var(--seed-fg)] truncate">
                          {project.displayName || baseName(project.path)}
                        </p>
                        <p className="text-[10px] text-[var(--seed-muted)] font-mono truncate">
                          {project.path}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="context"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-1"
              >
                <p className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em] px-2 pb-1">
                  活跃文件
                </p>
                {contextFiles.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-[var(--seed-muted)]">
                    未加载上下文
                  </div>
                )}
                {contextFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--seed-radius)] hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]"
                  >
                    <FileCode size={13} className="text-[var(--seed-primary)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--seed-fg)] truncate">{file.name}</p>
                      <p className="text-[10px] text-[var(--seed-muted)] font-mono truncate">{file.path}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className={cn('py-3 border-t border-[var(--color-border-subtle)] space-y-1', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <>
            <Button variant="ghost" size="icon-sm" className="w-full" onClick={onOpenSettings} title="设置">
              <Settings size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" className="w-full" onClick={onToggleCollapse} title="展开侧边栏">
              <PanelLeft size={14} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onOpenSettings}>
              <Settings size={13} />
              <span className="text-xs">设置</span>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onToggleCollapse}>
              <PanelLeftClose size={13} />
              <span className="text-xs">收起</span>
            </Button>
          </>
        )}
      </div>
    </motion.aside>
  )
}

function App() {
  // ---- All state now lives in Zustand ----
  const toolPanelOpen = useAppStore((s) => s.toolPanelOpen)
  const toggleToolPanel = useAppStore((s) => s.toggleToolPanel)
  const setToolPanelOpen = useAppStore((s) => s.setToolPanelOpen)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const agentStatus = useAppStore((s) => s.agentStatus)
  const setAgentStatus = useAppStore((s) => s.setAgentStatus)
  const setStreamingText = useAppStore((s) => s.setStreamingText)
  const currentTurnId = useAppStore((s) => s.currentTurnId)
  const setCurrentTurnId = useAppStore((s) => s.setCurrentTurnId)
  const setMessages = useAppStore((s) => s.setMessages)
  const appendLocalUserMessage = useAppStore((s) => s.appendLocalUserMessage)
  const resetAgentSession = useAppStore((s) => s.resetAgentSession)
  const resetToolsSession = useAppStore((s) => s.resetToolsSession)
  const permissions = useAppStore((s) => s.permissions)
  const resolvePermission = useAppStore((s) => s.resolvePermission)
  const currentTheme = useAppStore((s) => s.currentTheme)
  const setCurrentTheme = useAppStore((s) => s.setCurrentTheme)
  const refreshApiKeyStatus = useAppStore((s) => s.refreshApiKeyStatus)
  const loadContextFromDisk = useAppStore((s) => s.loadContextFromDisk)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projects = useAppStore((s) => s.projects)
  const setProjects = useAppStore((s) => s.setProjects)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)
  const setSessions = useAppStore((s) => s.setSessions)
  const upsertProject = useAppStore((s) => s.upsertProject)
  const currentProject = projects.find((p) => p.id === currentProjectId)
  const headerTitle = currentProject?.displayName || (currentProject ? baseName(currentProject.path) : '未选择项目')

  useAgentEvent()

  // Phase 4: hydrate API key presence once on mount.
  useEffect(() => {
    void refreshApiKeyStatus()
  }, [refreshApiKeyStatus])

  // Phase 5 needs a selected project before context can be loaded from disk.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus) return
    void window.nexus.getProjects().then((res) => {
      setProjects(res.projects)
      if (!currentProjectId && res.projects.length > 0) {
        setCurrentProjectId(res.projects[0].id)
      }
    })
  }, [currentProjectId, setCurrentProjectId, setProjects])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus || !currentProjectId) {
      setSessions([])
      setMessages([])
      return
    }
    let cancelled = false
    void window.nexus.getSessions({ projectId: currentProjectId }).then(async (res) => {
      if (cancelled) return
      setSessions(res.sessions)
      const session = res.sessions[0]
      if (!session) {
        setMessages([])
        return
      }
      const messagesRes = await window.nexus.getMessages({ sessionId: session.id })
      if (!cancelled) setMessages(messagesRes.messages)
    })
    return () => {
      cancelled = true
    }
  }, [currentProjectId, setMessages, setSessions])

  // Phase 5: load prompt context (CLAUDE.md / AGENTS.md / SKILL.md) on startup.
  // Renderer is sandboxed (nodeIntegration: false) and cannot import `os`;
  // empty string signals "no project" to the main process, which then
  // resolves os.homedir() for the global persona-level prompt.
  useEffect(() => {
    const project = projects.find((p) => p.id === currentProjectId)
    void loadContextFromDisk(project?.path ?? '')
  }, [currentProjectId, projects, loadContextFromDisk])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus || !currentProject?.path) return
    void window.nexus.switchProject({ projectPath: currentProject.path }).then((res) => {
      if (res.status === 'error') setAgentStatus('error')
    }).catch(() => setAgentStatus('error'))
  }, [currentProject?.path, setAgentStatus])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus) return undefined
    return window.nexus.onFocusCommandInput(() => {
      document.querySelector<HTMLTextAreaElement>('[data-od-id="command-input"] textarea')?.focus()
    })
  }, [])

  // Apply theme tokens to :root
  useEffect(() => {
    const tokens = THEME_PRESETS[currentTheme]
    if (!tokens) return
    const root = document.documentElement
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [currentTheme])

  const handleSend = (message: string) => {
    if (typeof window === 'undefined' || !window.nexus) {
      setAgentStatus('error')
      return
    }
    appendLocalUserMessage(message)
    resetToolsSession()
    setStreamingText('')
    setCurrentTurnId(null)
    setAgentStatus('thinking')
    void window.nexus
      .sendMessage({ text: message, projectPath: currentProject?.path ?? '' })
      .then((res) => setCurrentTurnId(res.turnId))
      .catch(() => setAgentStatus('error'))
  }

  const handleStop = () => {
    void window.nexus?.stopAgent({ turnId: currentTurnId ?? undefined })
  }

  const handleAddProject = () => {
    if (typeof window === 'undefined' || !window.nexus) {
      setAgentStatus('error')
      return
    }
    void window.nexus.selectProjectDirectory().then(async (selected) => {
      if (selected.status === 'error') {
        setAgentStatus('error')
        return
      }
      if (!selected.path) return
      const res = await window.nexus.addProject({ path: selected.path })
      if (res.status === 'error') {
        setAgentStatus('error')
        return
      }
      upsertProject(res.project)
      resetAgentSession()
      resetToolsSession()
      setCurrentProjectId(res.project.id)
    }).catch(() => setAgentStatus('error'))
  }

  const handlePermission = (id: string, decision: 'deny' | 'allow-once' | 'always-allow') => {
    void window.nexus?.respondPermission({ id, decision }).then((res) => {
      if (res.status !== 'ok') return
      resolvePermission(id)
      setAgentStatus(decision === 'deny' ? 'idle' : 'streaming')
    })
  }

  const handleSelectProject = (projectId: string) => {
    resetAgentSession()
    resetToolsSession()
    setCurrentProjectId(projectId)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" data-component="App" data-od-id="app-root">
      <Sidebar
        onOpenSettings={() => setSettingsOpen(true)}
        onAddProject={handleAddProject}
        onSelectProject={handleSelectProject}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <main className="flex-1 flex flex-col min-w-0" data-component="MainArea" data-od-id="chat-main">
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)]"
          data-component="TopBar"
          data-od-id="status-bar"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-[var(--seed-muted)]" />
              <h2 className="text-sm font-medium tracking-[-0.01em]">{headerTitle}</h2>
            </div>
            <StatusIndicator status={agentStatus} size="md" />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={toolPanelOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={toggleToolPanel}
              title="工具面板"
            >
              <PanelRight size={16} />
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <ChatPanel agentStatus={agentStatus} />
          </div>
          <PermissionPrompt
            isVisible={permissions.length > 0}
            permission={permissions[0] ?? null}
            onAllowOnce={() => {
              const first = permissions[0]
              if (first) handlePermission(first.id, 'allow-once')
            }}
            onAlwaysAllow={() => {
              const first = permissions[0]
              if (first) handlePermission(first.id, 'always-allow')
            }}
            onDeny={() => {
              const first = permissions[0]
              if (first) handlePermission(first.id, 'deny')
            }}
          />
          <CommandInput onSend={handleSend} onStop={handleStop} agentStatus={agentStatus} />
        </div>
      </main>

      <ToolPanel isOpen={toolPanelOpen} onToggle={() => setToolPanelOpen(false)} />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
    </div>
  )
}

export default App
