import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Check, AlertCircle, Loader, ChevronDown, ChevronRight, PanelRightClose } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/appStore'
import { selectValidSkills, selectLoadErrors } from '@/store/slices/contextSlice'
import DiffViewer from './DiffViewer'
import PtyTerminal from './Terminal/PtyTerminal'
import SkillsSection from './ToolPanel/SkillsSection'
import { toToolItem, type Tool } from './ToolPanel/toolMapping'

interface ToolItemProps {
  tool: Tool
  index: number
  className?: string
  style?: React.CSSProperties
  'data-qoder-id'?: string
  'data-qoder-source'?: string
}

function ToolItem({ tool, index, className, style, ...qoderProps }: ToolItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    tool.status === 'running' || Boolean(tool.diff) || Boolean(tool.terminal),
  )
  const Icon = tool.icon

  const statusConfig = {
    pending: { color: 'var(--seed-muted)', icon: null, label: '等待中' },
    running: { color: 'var(--seed-accent)', icon: Loader, label: '执行中' },
    success: { color: 'var(--seed-primary)', icon: Check, label: '完成' },
    rejected: { color: 'var(--seed-accent)', icon: AlertCircle, label: '已拒绝' },
    error: { color: 'var(--seed-accent)', icon: AlertCircle, label: '错误' },
  }

  const config = statusConfig[tool.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-[var(--seed-radius)] border transition-all duration-[var(--duration-normal)]',
        tool.status === 'running'
          ? 'border-[var(--seed-accent)] bg-[color-mix(in_srgb,var(--seed-accent)_5%,transparent)]'
          : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]',
        'hover:border-[var(--seed-border)]',
        className
      )}
      style={style} data-qoder-id={qoderProps['data-qoder-id']} data-qoder-source={qoderProps['data-qoder-source']}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
       data-qoder-id="qel-w-full-3b7a10e5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-3b7a10e5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:7}}">
        {/* Status Dot */}
        <div className="relative flex-shrink-0" data-qoder-id="qel-relative-c398a906" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-c398a906&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:9}}">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
           data-qoder-id="qel-w-2-15ad55c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-2-15ad55c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;w-2&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:11}}"/>
          {tool.status === 'running' && (
            <motion.div
              animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: config.color }}
             data-qoder-id="qel-absolute-934f2ead" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-934f2ead&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:91,&quot;column&quot;:13}}"/>
          )}
        </div>

        {/* Icon + Name */}
        <div className="flex items-center gap-2 flex-1 min-w-0" data-qoder-id="qel-flex-4a8f6786" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4a8f6786&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:9}}">
          <Icon size={14} className="flex-shrink-0" style={{ color: config.color }}  data-qoder-id="qel-flex-shrink-0-9bd53c64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-9bd53c64&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:11}}"/>
          <span className="text-xs font-medium text-[var(--seed-fg)] truncate" data-qoder-id="qel-text-xs-b6d8d8f5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-b6d8d8f5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:11}}">
            {tool.label}
          </span>
        </div>

        {/* Duration / Status */}
        <div className="flex items-center gap-2 flex-shrink-0" data-qoder-id="qel-flex-558f78d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-558f78d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:109,&quot;column&quot;:9}}">
          <span className="text-[10px] text-[var(--seed-muted)]">{config.label}</span>
          {tool.duration && (
            <span className="text-[10px] text-[var(--seed-muted)] font-mono" data-qoder-id="qel-text-10px-4828c776" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4828c776&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:13}}">
              {tool.duration}
            </span>
          )}
          {StatusIcon && (
            <motion.div
              animate={tool.status === 'running' ? { rotate: 360 } : {}}
              transition={tool.status === 'running' ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
             data-qoder-id="qel-motion-div-fe2df41f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-fe2df41f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:116,&quot;column&quot;:13}}">
              <StatusIcon size={12} style={{ color: config.color }}  data-qoder-id="qel-statusicon-52ff441b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusicon-52ff441b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;statusicon&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:15}}"/>
            </motion.div>
          )}
          {isExpanded ? (
            <ChevronDown size={12} className="text-[var(--seed-muted)]"  data-qoder-id="qel-text-var-seed-muted-dd33a9a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-dd33a9a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:13}}"/>
          ) : (
            <ChevronRight size={12} className="text-[var(--seed-muted)]"  data-qoder-id="qel-text-var-seed-muted-df54375d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-df54375d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:13}}"/>
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence data-qoder-id="qel-animatepresence-963cff58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-963cff58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:132,&quot;column&quot;:7}}">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
           data-qoder-id="qel-overflow-hidden-cdfc4acf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-hidden-cdfc4acf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;overflow-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:11}}">
            <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border-subtle)]" data-qoder-id="qel-px-3-d47c77a5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-d47c77a5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:141,&quot;column&quot;:13}}">
              <div className="mt-2 space-y-1.5" data-qoder-id="qel-mt-2-ca06eb4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-ca06eb4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2" data-qoder-id="qel-flex-1ec70d72" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1ec70d72&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:17}}">
                  <span className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-10px-e225e84d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-e225e84d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:19}}">目标</span>
                  <span className="text-[11px] font-mono text-[var(--seed-fg)] break-all" data-qoder-id="qel-text-11px-72535a7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-72535a7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:19}}">{tool.detail}</span>
                </div>
                {tool.output && (
                  <div className="flex items-center gap-2" data-qoder-id="qel-flex-8bc9f7a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8bc9f7a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:148,&quot;column&quot;:19}}">
                    <span className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-10px-df25e394" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-df25e394&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:149,&quot;column&quot;:21}}">输出</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] break-all" data-qoder-id="qel-text-11px-6d5352a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-6d5352a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:150,&quot;column&quot;:21}}">{tool.output}</span>
                  </div>
                )}
                {tool.status === 'running' && (
                  <div className="mt-2 h-1 rounded-full bg-[var(--color-border-subtle)] overflow-hidden" data-qoder-id="qel-mt-2-5703f7ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-5703f7ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:19}}">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--seed-accent)' }}
                      animate={{ width: ['0%', '60%', '80%', '60%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                     data-qoder-id="qel-h-full-edb7becf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-edb7becf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:21}}"/>
                  </div>
                )}
                {tool.status === 'success' && tool.terminal && (
                  <div className="mt-2">
                    <PtyTerminal
                      projectRoot={tool.terminal.projectRoot}
                      cwd={tool.terminal.cwd}
                      initialOutput={tool.terminal.stdout}
                    />
                  </div>
                )}
                {tool.diff && (
                  <div className="mt-2" data-qoder-id="qel-mt-2-5503f488" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-5503f488&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:19}}">
                    <DiffViewer diff={tool.diff} data-qoder-id="qel-diffviewer-8da5795a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-diffviewer-8da5795a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolItem&quot;,&quot;elementRole&quot;:&quot;diffviewer&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:21}}"/>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface ToolPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export default function ToolPanel({ isOpen, onToggle }: ToolPanelProps) {
  const pendingTools = useAppStore((s) => s.pendingTools)
  const projects = useAppStore((s) => s.projects)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const skills = useAppStore(selectValidSkills)
  const loadErrors = useAppStore(selectLoadErrors)
  const currentProject = projects.find((project) => project.id === currentProjectId)
  const tools = pendingTools.map((tool) => toToolItem(tool, currentProject?.path ?? ''))

  const completedCount = tools.filter(t => t.status === 'success').length
  const totalCount = tools.length
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100

  return (
    <AnimatePresence data-qoder-id="qel-animatepresence-e1aa7266" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-e1aa7266&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:184,&quot;column&quot;:5}}">
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-full border-l border-[var(--color-border-subtle)] bg-[var(--seed-bg)] overflow-hidden flex flex-col"
          data-component="ToolPanel"
          data-od-id="tool-panel"
         data-qoder-id="qel-toolpanel-e9d55e5e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toolpanel-e9d55e5e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;toolpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:9}}">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-flex-607bf0cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-607bf0cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:11}}">
            <div className="flex items-center gap-2" data-qoder-id="qel-flex-617bf262" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-617bf262&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:13}}">
              <Terminal size={14} className="text-[var(--seed-primary)]"  data-qoder-id="qel-text-var-seed-primary-b0de85d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-b0de85d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:198,&quot;column&quot;:15}}"/>
              <h3 className="text-xs font-medium tracking-[-0.01em]" data-qoder-id="qel-text-xs-ea932a08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-ea932a08&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:15}}">工具执行</h3>
              <span className="text-[10px] text-[var(--seed-muted)] font-mono" data-qoder-id="qel-text-10px-a01e6fcc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-a01e6fcc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:15}}">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onToggle} data-qoder-id="qel-button-34ddd4ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-34ddd4ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:204,&quot;column&quot;:13}}">
              <PanelRightClose size={14}  data-qoder-id="qel-panelrightclose-692c9e15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-panelrightclose-692c9e15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;panelrightclose&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:15}}"/>
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2" data-qoder-id="qel-px-4-2d3d48d2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-2d3d48d2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:11}}">
            <div className="h-1 rounded-full bg-[var(--color-border-subtle)] overflow-hidden" data-qoder-id="qel-h-1-87847d38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-1-87847d38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;h-1&quot;,&quot;loc&quot;:{&quot;line&quot;:211,&quot;column&quot;:13}}">
              <motion.div
                className="h-full rounded-full bg-[var(--seed-primary)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
               data-qoder-id="qel-h-full-dc4c16ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h-full-dc4c16ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;h-full&quot;,&quot;loc&quot;:{&quot;line&quot;:212,&quot;column&quot;:15}}"/>
            </div>
          </div>

          {/* Tool List */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2" data-qoder-id="qel-flex-1-bf070eaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-bf070eaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:222,&quot;column&quot;:11}}">
            {tools.length === 0 && (
              <div className="rounded-[var(--seed-radius)] border border-dashed border-[var(--color-border-subtle)] px-3 py-4 text-[11px] text-[var(--seed-muted)]">
                暂无工具调用
              </div>
            )}
            {tools.map((tool, index) => (
              <ToolItem key={tool.id} tool={tool} index={index}  data-qoder-id="qel-toolitem-7ec0dbdf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toolitem-7ec0dbdf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;toolitem&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:15}}"/>
            ))}
            <SkillsSection skills={skills} loadErrors={loadErrors} />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]" data-qoder-id="qel-px-4-a444bfec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-a444bfec&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:11}}">
            <div className="flex items-center justify-between text-[10px] text-[var(--seed-muted)]" data-qoder-id="qel-flex-5d79ad7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5d79ad7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:13}}">
              <span className="uppercase tracking-[0.06em]" data-qoder-id="qel-uppercase-bbfda19e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-uppercase-bbfda19e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;uppercase&quot;,&quot;loc&quot;:{&quot;line&quot;:231,&quot;column&quot;:15}}">执行时间</span>
              <span className="font-mono" data-qoder-id="qel-font-mono-4cfb4326" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-4cfb4326&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ToolPanel.jsx&quot;,&quot;componentName&quot;:&quot;ToolPanel&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:15}}">
                {totalCount === 0 ? '-' : `${completedCount}/${totalCount}`}
              </span>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
