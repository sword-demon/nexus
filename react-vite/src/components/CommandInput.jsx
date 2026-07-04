import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Terminal, ChevronUp, ChevronDown, Mic, File, Folder, AtSign, X, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Demo file tree (simulates a real project, respecting .gitignore)
const DEMO_FILES = [
  { name: 'src/', type: 'folder', path: 'src/' },
  { name: 'src/utils/', type: 'folder', path: 'src/utils/' },
  { name: 'src/utils/auth.ts', type: 'file', path: 'src/utils/auth.ts' },
  { name: 'src/utils/db.ts', type: 'file', path: 'src/utils/db.ts' },
  { name: 'src/utils/logger.ts', type: 'file', path: 'src/utils/logger.ts' },
  { name: 'src/middleware.ts', type: 'file', path: 'src/middleware.ts' },
  { name: 'src/index.ts', type: 'file', path: 'src/index.ts' },
  { name: 'src/routes/', type: 'folder', path: 'src/routes/' },
  { name: 'src/routes/api.ts', type: 'file', path: 'src/routes/api.ts' },
  { name: 'src/routes/auth.ts', type: 'file', path: 'src/routes/auth.ts' },
  { name: 'package.json', type: 'file', path: 'package.json' },
  { name: 'tsconfig.json', type: 'file', path: 'tsconfig.json' },
  { name: '.env', type: 'file', path: '.env' },
  { name: 'README.md', type: 'file', path: 'README.md' },
]

// Files that would be in .gitignore
const GITIGNORED = new Set([
  'node_modules/',
  'dist/',
  '.env.local',
  'coverage/',
  '.next/',
  '*.log',
])

function FileSelector({ query, onSelect, onClose, ...qoderProps }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return DEMO_FILES.filter(f => {
      for (const pattern of GITIGNORED) {
        if (pattern.endsWith('/') && f.path.startsWith(pattern)) return false
        if (f.name === pattern) return false
      }
      return !q || f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
    })
  }, [query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (filtered.length === 0) {
    return (
      <div className={["absolute bottom-full left-0 right-0 mb-2 p-3 rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--seed-surface)] shadow-lg z-50", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
        <p className="text-xs text-[var(--seed-muted)]" data-qoder-id="qel-text-xs-eeaa5e04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-eeaa5e04&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:9}}">没有匹配的文件</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-full left-0 right-0 mb-2 rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--seed-surface)] shadow-lg overflow-hidden z-50"
     data-qoder-id="qel-absolute-079324a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-079324a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:5}}">
      <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] flex items-center gap-2" data-qoder-id="qel-px-3-a5874f22" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-a5874f22&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:92,&quot;column&quot;:7}}">
        <AtSign size={12} className="text-[var(--seed-primary)]"  data-qoder-id="qel-text-var-seed-primary-c4e77574" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-c4e77574&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:9}}"/>
        <span className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-10px-77a6aeee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-77a6aeee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:9}}">选择文件或文件夹</span>
        <span className="ml-auto text-[10px] text-[var(--seed-muted)]" data-qoder-id="qel-ml-auto-815c7389" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-auto-815c7389&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;ml-auto&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:9}}">
          <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]" data-qoder-id="qel-px-1-86120080" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-1-86120080&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;px-1&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">↑↓</kbd> 选择
          <kbd className="ml-1 px-1 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]" data-qoder-id="qel-ml-1-4efa19c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-1-4efa19c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;ml-1&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:11}}">Enter</kbd> 确认
        </span>
      </div>
      <div className="max-h-[200px] overflow-y-auto py-1" data-qoder-id="qel-max-h-200px-70fb8ebb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-h-200px-70fb8ebb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;max-h-200px&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:7}}">
        {filtered.map((file, index) => (
          <button
            key={file.path}
            onClick={() => onSelect(file)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors duration-75',
              index === selectedIndex
                ? 'bg-[color-mix(in_srgb,var(--seed-primary)_12%,transparent)] text-[var(--seed-fg)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            )}
           data-qoder-id="qel-button-5b1debdd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5b1debdd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:11}}">
            {file.type === 'folder' ? (
              <Folder size={13} className="text-[var(--seed-primary)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-primary-ed9109b2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-ed9109b2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:113,&quot;column&quot;:15}}"/>
            ) : (
              <File size={13} className="text-[var(--seed-muted)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-muted-6261f350" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-6261f350&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:15}}"/>
            )}
            <span className="text-xs font-mono truncate" data-qoder-id="qel-text-xs-60af2129" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-60af2129&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileSelector&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:13}}">{file.path}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

/** Tag chip for selected files — red-orange highlight, no @ sign visible */
function FileTag({ file, onRemove, ...qoderProps }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={["inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color-mix(in_srgb,var(--seed-accent)_14%,transparent)] border border-[color-mix(in_srgb,var(--seed-accent)_30%,transparent)] text-[var(--seed-accent)] cursor-default group", qoderProps?.className].filter(Boolean).join(" ")}
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {file.type === 'folder' ? (
        <Folder size={11} className="flex-shrink-0 opacity-80"  data-qoder-id="qel-flex-shrink-0-5964a29d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-5964a29d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileTag&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:9}}"/>
      ) : (
        <File size={11} className="flex-shrink-0 opacity-80"  data-qoder-id="qel-flex-shrink-0-3046cd10" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-3046cd10&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileTag&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:138,&quot;column&quot;:9}}"/>
      )}
      <span className="text-[11px] font-mono font-medium leading-none" data-qoder-id="qel-text-11px-7d159bad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-7d159bad&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileTag&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:7}}">{file.path}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(file); }}
        className="ml-0.5 p-0.5 rounded opacity-50 hover:opacity-100 hover:bg-[color-mix(in_srgb,var(--seed-accent)_20%,transparent)] transition-opacity"
       data-qoder-id="qel-ml-0-5-9125b1f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ml-0-5-9125b1f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileTag&quot;,&quot;elementRole&quot;:&quot;ml-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:141,&quot;column&quot;:7}}">
        <X size={10}  data-qoder-id="qel-x-85320c32" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-85320c32&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;FileTag&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:9}}"/>
      </button>
    </motion.span>
  )
}

// LLM Providers with models (synced from settings)
const MODEL_PROVIDERS = [
  {
    name: 'Anthropic',
    models: [
      { id: 'claude-4-sonnet', label: 'Claude 4 Sonnet', tag: '推荐' },
      { id: 'claude-4-opus', label: 'Claude 4 Opus', tag: '' },
      { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', tag: '' },
      { id: 'claude-3-haiku', label: 'Claude 3 Haiku', tag: '快速' },
    ],
  },
  {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o', tag: '' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tag: '快速' },
      { id: 'o1-preview', label: 'o1-preview', tag: '推理' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', tag: '' },
    ],
  },
  {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', tag: '' },
      { id: 'deepseek-coder', label: 'DeepSeek Coder', tag: '代码' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', tag: '推理' },
    ],
  },
]

function ModelSelector({ selectedModel, onSelectModel, ...qoderProps }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Find current model info
  const currentModel = useMemo(() => {
    for (const provider of MODEL_PROVIDERS) {
      const found = provider.models.find(m => m.id === selectedModel)
      if (found) return { ...found, provider: provider.name }
    }
    return { id: selectedModel, label: selectedModel, provider: '', tag: '' }
  }, [selectedModel])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  return (
    <div className={["relative", qoderProps?.className].filter(Boolean).join(" ")} ref={dropdownRef} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] transition-all duration-[var(--duration-fast)]',
          isOpen
            ? 'bg-[var(--color-bg-elevated)] text-[var(--seed-fg)] border border-[var(--color-border-active)]'
            : 'text-[var(--seed-muted)] hover:text-[var(--seed-fg)] hover:bg-[var(--color-bg-hover)] border border-transparent'
        )}
       data-qoder-id="qel-button-68593592" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-68593592&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:7}}">
        <Cpu size={10} className="text-[var(--seed-primary)]"  data-qoder-id="qel-text-var-seed-primary-b3958773" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-b3958773&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:218,&quot;column&quot;:9}}"/>
        <span className="font-mono" data-qoder-id="qel-font-mono-056f4fc9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-font-mono-056f4fc9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;font-mono&quot;,&quot;loc&quot;:{&quot;line&quot;:219,&quot;column&quot;:9}}">{currentModel.label}</span>
        <ChevronDown size={9} className={cn('transition-transform', isOpen && 'rotate-180')}  data-qoder-id="qel-chevrondown-32140ac7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevrondown-32140ac7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;chevrondown&quot;,&quot;loc&quot;:{&quot;line&quot;:220,&quot;column&quot;:9}}"/>
      </button>

      {/* Dropdown */}
      <AnimatePresence data-qoder-id="qel-animatepresence-e9a2f59e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-e9a2f59e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:7}}">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-full left-0 mb-2 w-[220px] rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--seed-surface)] shadow-xl overflow-hidden z-50"
           data-qoder-id="qel-absolute-76cc4f85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-76cc4f85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:226,&quot;column&quot;:11}}">
            <div className="max-h-[280px] overflow-y-auto py-1" data-qoder-id="qel-max-h-280px-33794211" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-max-h-280px-33794211&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;max-h-280px&quot;,&quot;loc&quot;:{&quot;line&quot;:233,&quot;column&quot;:13}}">
              {MODEL_PROVIDERS.map((provider) => (
                <div key={provider.name} data-qoder-id="qel-div-d376ffbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-d376ffbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:17}}">
                  {/* Provider Group Header */}
                  <div className="px-3 pt-2 pb-1" data-qoder-id="qel-px-3-795f515a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-795f515a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:237,&quot;column&quot;:19}}">
                    <span className="text-[9px] text-[var(--seed-muted)] uppercase tracking-[0.08em] font-medium" data-qoder-id="qel-text-9px-9166f259" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-9166f259&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:238,&quot;column&quot;:21}}">
                      {provider.name}
                    </span>
                  </div>
                  {/* Models */}
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id)
                        setIsOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors duration-75',
                        model.id === selectedModel
                          ? 'bg-[color-mix(in_srgb,var(--seed-primary)_10%,transparent)] text-[var(--seed-fg)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--seed-fg)]'
                      )}
                     data-qoder-id="qel-button-6a5b774f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-6a5b774f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:244,&quot;column&quot;:21}}">
                      <span className="text-[11px] font-mono flex-1" data-qoder-id="qel-text-11px-313c8894" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-313c8894&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:257,&quot;column&quot;:23}}">{model.label}</span>
                      {model.tag && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--seed-primary)_10%,transparent)] text-[var(--seed-primary)] font-medium uppercase tracking-wide" data-qoder-id="qel-text-8px-85a6e933" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-8px-85a6e933&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;text-8px&quot;,&quot;loc&quot;:{&quot;line&quot;:259,&quot;column&quot;:25}}">
                          {model.tag}
                        </span>
                      )}
                      {model.id === selectedModel && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--seed-primary)]"  data-qoder-id="qel-w-1-5-84509640" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-1-5-84509640&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;ModelSelector&quot;,&quot;elementRole&quot;:&quot;w-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:264,&quot;column&quot;:25}}"/>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CommandInput({ onSend, agentStatus, ...qoderProps }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showFileSelector, setShowFileSelector] = useState(false)
  const [fileQuery, setFileQuery] = useState('')
  const [isCommandMode, setIsCommandMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [selectedModel, setSelectedModel] = useState('claude-4-sonnet')
  const textareaRef = useRef(null)

  const isStreaming = agentStatus === 'streaming' || agentStatus === 'executing'
  const hasContent = value.trim().length > 0 || selectedFiles.length > 0

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [value])

  // Detect @ trigger and ! prefix
  useEffect(() => {
    if (value.startsWith('!')) {
      setIsCommandMode(true)
    } else {
      setIsCommandMode(false)
    }

    // Check for @ trigger (only trigger on standalone @, not inside words)
    const atMatch = value.match(/(^|[\s])@([^\s]*)$/)
    if (atMatch) {
      setShowFileSelector(true)
      setFileQuery(atMatch[2])
    } else {
      setShowFileSelector(false)
      setFileQuery('')
    }
  }, [value])

  const handleFileSelect = (file) => {
    // Add to selected files (no duplicates)
    if (!selectedFiles.find(f => f.path === file.path)) {
      setSelectedFiles(prev => [...prev, file])
    }
    // Remove the @query text from input
    const newValue = value.replace(/(^|[\s])@[^\s]*$/, '$1').trim()
    setValue(newValue)
    setShowFileSelector(false)
    textareaRef.current?.focus()
  }

  const handleRemoveFile = (file) => {
    setSelectedFiles(prev => prev.filter(f => f.path !== file.path))
  }

  const handleSubmit = () => {
    if (!hasContent || isStreaming) return
    // Compose message: include file references
    const fileRefs = selectedFiles.map(f => `@${f.path}`).join(' ')
    const message = [fileRefs, value.trim()].filter(Boolean).join(' ')
    onSend?.(message)
    setValue('')
    setSelectedFiles([])
    setIsCommandMode(false)
  }

  const handleKeyDown = (e) => {
    if (showFileSelector && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) {
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape' && showFileSelector) {
      setShowFileSelector(false)
    }
    // Backspace on empty input removes last file tag
    if (e.key === 'Backspace' && value === '' && selectedFiles.length > 0) {
      setSelectedFiles(prev => prev.slice(0, -1))
    }
  }

  return (
    <div
      className={["px-5 pb-5 pt-3", qoderProps?.className].filter(Boolean).join(" ")}
      data-component="CommandInput"
      data-od-id="command-input"
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <motion.div
        className={cn(
          'relative rounded-[var(--seed-radius)] border transition-all duration-[var(--duration-normal)]',
          isCommandMode
            ? 'border-[var(--seed-accent)] shadow-[0_0_12px_var(--color-accent-glow)]'
            : isFocused
              ? 'border-[var(--color-border-active)] glow-primary'
              : 'border-[var(--color-border-subtle)] hover:border-[var(--seed-border)]'
        )}
        animate={isFocused ? { scale: 1.005 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
       data-qoder-id="qel-motion-div-5273296e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-5273296e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:367,&quot;column&quot;:7}}">
        {/* Command Mode Indicator */}
        <AnimatePresence data-qoder-id="qel-animatepresence-c0fe37c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-c0fe37c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:380,&quot;column&quot;:9}}">
          {isCommandMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
             data-qoder-id="qel-overflow-hidden-0c9a9e8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-hidden-0c9a9e8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;overflow-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:382,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2 px-3 pt-2 pb-0" data-qoder-id="qel-flex-9113d3df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9113d3df&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:388,&quot;column&quot;:15}}">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[color-mix(in_srgb,var(--seed-accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--seed-accent)_25%,transparent)]" data-qoder-id="qel-flex-9013d24c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9013d24c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:389,&quot;column&quot;:17}}">
                  <Terminal size={11} className="text-[var(--seed-accent)]"  data-qoder-id="qel-text-var-seed-accent-23803611" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-accent-23803611&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-var-seed-accent&quot;,&quot;loc&quot;:{&quot;line&quot;:390,&quot;column&quot;:19}}"/>
                  <span className="text-[10px] font-mono text-[var(--seed-accent)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-10px-cc82acc1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-cc82acc1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:391,&quot;column&quot;:19}}">Shell</span>
                </div>
                <span className="text-[10px] text-[var(--seed-muted)]" data-qoder-id="qel-text-10px-cd82ae54" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-cd82ae54&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:393,&quot;column&quot;:17}}">命令将在终端中执行</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Selector Popup */}
        <AnimatePresence data-qoder-id="qel-animatepresence-b5fbe7dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-b5fbe7dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:400,&quot;column&quot;:9}}">
          {showFileSelector && (
            <FileSelector
              query={fileQuery}
              onSelect={handleFileSelect}
              onClose={() => setShowFileSelector(false)}
             data-qoder-id="qel-fileselector-2e6be6c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fileselector-2e6be6c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;fileselector&quot;,&quot;loc&quot;:{&quot;line&quot;:402,&quot;column&quot;:13}}"/>
          )}
        </AnimatePresence>

        {/* Selected File Tags */}
        <AnimatePresence data-qoder-id="qel-animatepresence-b7fbeb02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-b7fbeb02&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:411,&quot;column&quot;:9}}">
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
             data-qoder-id="qel-overflow-hidden-15abf5d7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-overflow-hidden-15abf5d7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;overflow-hidden&quot;,&quot;loc&quot;:{&quot;line&quot;:413,&quot;column&quot;:13}}">
              <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 pb-0" data-qoder-id="qel-flex-9813dee4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9813dee4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:419,&quot;column&quot;:15}}">
                <AnimatePresence mode="popLayout" data-qoder-id="qel-animatepresence-4cf903fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-4cf903fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:420,&quot;column&quot;:17}}">
                  {selectedFiles.map(file => (
                    <FileTag key={file.path} file={file} onRemove={handleRemoveFile}  data-qoder-id="qel-filetag-49735ab1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-filetag-49735ab1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;filetag&quot;,&quot;loc&quot;:{&quot;line&quot;:422,&quot;column&quot;:21}}"/>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-3 p-3" data-qoder-id="qel-flex-891188b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-891188b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:431,&quot;column&quot;:9}}">
          <div className="flex items-center gap-1.5 pb-1" data-qoder-id="qel-flex-8a118a43" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-8a118a43&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:432,&quot;column&quot;:11}}">
            <Button variant="ghost" size="icon-sm" title="附加文件 (@)" data-qoder-id="qel-button-e6c9ef5a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e6c9ef5a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:433,&quot;column&quot;:13}}">
              <Paperclip size={16}  data-qoder-id="qel-paperclip-5720b119" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-paperclip-5720b119&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;paperclip&quot;,&quot;loc&quot;:{&quot;line&quot;:434,&quot;column&quot;:15}}"/>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              title="终端模式 (!)"
              className={cn(isCommandMode && 'text-[var(--seed-accent)]')}
              onClick={() => {
                if (!isCommandMode) {
                  setValue('!' + value)
                } else {
                  setValue(value.replace(/^!/, ''))
                }
                textareaRef.current?.focus()
              }}
             data-qoder-id="qel-button-e4c9ec34" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-e4c9ec34&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:436,&quot;column&quot;:13}}">
              <Terminal size={16}  data-qoder-id="qel-terminal-61832143" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-terminal-61832143&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;terminal&quot;,&quot;loc&quot;:{&quot;line&quot;:450,&quot;column&quot;:15}}"/>
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? '输入 Shell 命令...' : '输入命令或提问... (@ 选择文件, ! 执行命令)'}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm text-[var(--seed-fg)]',
              'placeholder:text-[var(--seed-muted)] placeholder:text-sm',
              'focus:outline-none',
              'min-h-[24px] max-h-[160px] leading-relaxed',
              isCommandMode && 'font-mono'
            )}
           data-qoder-id="qel-textarea-ce9567aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-textarea-ce9567aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;textarea&quot;,&quot;loc&quot;:{&quot;line&quot;:454,&quot;column&quot;:11}}"/>

          {/* Send / Mic Button */}
          <motion.button
            onClick={hasContent ? handleSubmit : undefined}
            disabled={isStreaming}
            whileHover={hasContent && !isStreaming ? { scale: 1.05 } : {}}
            whileTap={hasContent && !isStreaming ? { scale: 0.95 } : {}}
            className={cn(
              'flex-shrink-0 p-2 rounded-lg transition-all duration-[var(--duration-normal)]',
              isStreaming
                ? 'bg-[var(--color-bg-elevated)] text-[var(--seed-muted)] cursor-not-allowed'
                : hasContent
                  ? 'bg-[var(--seed-accent)] text-[var(--seed-fg)] shadow-[0_2px_8px_var(--color-accent-glow)]'
                  : 'bg-[var(--color-bg-elevated)] text-[var(--seed-muted)] hover:text-[var(--seed-primary)] hover:bg-[var(--color-bg-hover)]'
            )}
            title={hasContent ? '发送' : '语音输入'}
           data-qoder-id="qel-motion-button-b49cb5be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-button-b49cb5be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;motion-button&quot;,&quot;loc&quot;:{&quot;line&quot;:473,&quot;column&quot;:11}}">
            {isStreaming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-[var(--seed-muted)] border-t-transparent rounded-full"
               data-qoder-id="qel-w-4-3e21ded6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-4-3e21ded6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;w-4&quot;,&quot;loc&quot;:{&quot;line&quot;:489,&quot;column&quot;:15}}"/>
            ) : (
              <AnimatePresence mode="wait" initial={false} data-qoder-id="qel-animatepresence-45f6ba5e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-45f6ba5e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:15}}">
                {hasContent ? (
                  <motion.div
                    key="send"
                    initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                   data-qoder-id="qel-motion-div-d5672bb4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-d5672bb4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:497,&quot;column&quot;:19}}">
                    <Send size={16}  data-qoder-id="qel-send-81553730" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-send-81553730&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;send&quot;,&quot;loc&quot;:{&quot;line&quot;:504,&quot;column&quot;:21}}"/>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                   data-qoder-id="qel-motion-div-d367288e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-d367288e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:507,&quot;column&quot;:19}}">
                    <Mic size={16}  data-qoder-id="qel-mic-e77975d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mic-e77975d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;mic&quot;,&quot;loc&quot;:{&quot;line&quot;:514,&quot;column&quot;:21}}"/>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.button>
        </div>

        {/* Footer Hints */}
        <div className="flex items-center justify-between px-3 pb-2" data-qoder-id="qel-flex-9f0f6cbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9f0f6cbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:523,&quot;column&quot;:9}}">
          <div className="flex items-center gap-3" data-qoder-id="qel-flex-9e0f6b28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-9e0f6b28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:524,&quot;column&quot;:11}}">
            <kbd className="text-[10px] text-[var(--seed-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] tracking-wide" data-qoder-id="qel-text-10px-cac7cc05" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-cac7cc05&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:13}}">
              @
            </kbd>
            <span className="text-[10px] text-[var(--seed-muted)]" data-qoder-id="qel-text-10px-4e87f695" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4e87f695&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:528,&quot;column&quot;:13}}">文件</span>
            <kbd className="text-[10px] text-[var(--seed-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] tracking-wide" data-qoder-id="qel-text-10px-ccc59094" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-ccc59094&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:529,&quot;column&quot;:13}}">
              !
            </kbd>
            <span className="text-[10px] text-[var(--seed-muted)]" data-qoder-id="qel-text-10px-3a8a15b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-3a8a15b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:532,&quot;column&quot;:13}}">命令</span>
          </div>
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel}  data-qoder-id="qel-modelselector-23e0ed66" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-modelselector-23e0ed66&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/CommandInput.jsx&quot;,&quot;componentName&quot;:&quot;CommandInput&quot;,&quot;elementRole&quot;:&quot;modelselector&quot;,&quot;loc&quot;:{&quot;line&quot;:534,&quot;column&quot;:11}}"/>
        </div>
      </motion.div>
    </div>
  )
}
