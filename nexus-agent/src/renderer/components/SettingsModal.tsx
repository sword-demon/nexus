import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, User, ToggleLeft, ToggleRight, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAppStore } from '../store/appStore'
import type { ThemeKey } from '../store/appStore'
import type { ShortcutSettingsDto } from '../../shared/types/ipc'

type TabId = 'general' | 'account'

interface Tab {
  id: TabId
  label: string
  icon: LucideIcon
}

const TABS: Tab[] = [
  { id: 'general', label: '基础配置', icon: Settings },
  { id: 'account', label: '账号配置', icon: User },
]

interface ToggleProps {
  enabled: boolean
  onChange?: (v: boolean) => void
  className?: string
  style?: React.CSSProperties
  'data-od-id'?: string
  'data-qoder-id'?: string
  'data-qoder-source'?: string
}

function Toggle({ enabled, onChange, className, style, ...qoderProps }: ToggleProps) {
  return (
    <button
      onClick={() => onChange?.(!enabled)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors duration-200',
        enabled
          ? 'bg-[var(--seed-primary)]'
          : 'bg-[var(--color-border-subtle)]',
        className
      )}
      style={style} data-od-id={qoderProps['data-od-id']} data-qoder-id={qoderProps['data-qoder-id']} data-qoder-source={qoderProps['data-qoder-source']}>
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-[var(--seed-fg)]"
        animate={{ left: enabled ? '18px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
       data-qoder-id="qel-absolute-41cc23fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-41cc23fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:7}}"/>
    </button>
  )
}

interface SettingRowProps {
  label: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
  'data-qoder-id'?: string
  'data-qoder-source'?: string
}

function SettingRow({ label, description, children, className, style, ...qoderProps }: SettingRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)] last:border-b-0", className)} style={style} data-qoder-id={qoderProps['data-qoder-id']} data-qoder-source={qoderProps['data-qoder-source']}>
      <div className="flex-1 min-w-0 mr-4" data-qoder-id="qel-flex-1-638b90ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-638b90ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingRow&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:7}}">
        <p className="text-sm text-[var(--seed-fg)]" data-qoder-id="qel-text-sm-59f3dd40" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-59f3dd40&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingRow&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:9}}">{label}</p>
        {description && (
          <p className="text-[11px] text-[var(--seed-muted)] mt-0.5" data-qoder-id="qel-text-11px-9dc82003" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-9dc82003&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingRow&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:11}}">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0" data-qoder-id="qel-flex-shrink-0-828e7141" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-828e7141&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingRow&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:44,&quot;column&quot;:7}}">{children}</div>
    </div>
  )
}

interface GeneralSettingsProps {
  theme: ThemeKey
  onThemeChange: (v: ThemeKey) => void
}


function GeneralSettings({ theme, onThemeChange }: GeneralSettingsProps) {
  const [streaming, setStreaming] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [language, setLanguage] = useState('zh-CN')
  const [shortcutEnabled, setShortcutEnabled] = useState(true)
  const [shortcutAccelerator, setShortcutAccelerator] = useState('CommandOrControl+Shift+A')
  const [shortcutStatus, setShortcutStatus] = useState<ShortcutSettingsDto | null>(null)
  const [shortcutError, setShortcutError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.nexus) return
    void window.nexus.getShortcutSettings().then((res) => {
      if (res.status === 'error') {
        setShortcutError(res.error)
        return
      }
      setShortcutStatus(res.settings)
      setShortcutEnabled(res.settings.enabled)
      setShortcutAccelerator(res.settings.accelerator)
      setShortcutError(res.settings.lastError)
    })
  }, [])

  const saveShortcut = async (enabled = shortcutEnabled, accelerator = shortcutAccelerator) => {
    if (typeof window === 'undefined' || !window.nexus) return
    const res = await window.nexus.setShortcutSettings({ enabled, accelerator })
    if (res.status === 'error') {
      setShortcutError(res.error)
      return
    }
    setShortcutStatus(res.settings)
    setShortcutEnabled(res.settings.enabled)
    setShortcutAccelerator(res.settings.accelerator)
    setShortcutError(res.settings.lastError)
  }

  const shortcutDescription = shortcutError
    ? shortcutError
    : shortcutStatus?.registered
      ? '已注册'
      : shortcutStatus
        ? '未注册'
        : '检测中'

  return (
    <div className="space-y-1" data-qoder-id="qel-space-y-1-ab3aa0cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-ab3aa0cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:5}}">
      <SettingRow label="界面主题" description="选择界面配色方案" data-qoder-id="qel-settingrow-80de1419" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-80de1419&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:56,&quot;column&quot;:7}}">
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as ThemeKey)}
          className="text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)]"
         data-qoder-id="qel-text-xs-49fcc75a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-49fcc75a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:57,&quot;column&quot;:9}}">
          <option value="dark" data-qoder-id="qel-option-78315942" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-78315942&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:62,&quot;column&quot;:11}}">深墨绿</option>
          <option value="light" data-qoder-id="qel-option-773157af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-773157af&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:11}}">浅青木</option>
          <option value="warm" data-qoder-id="qel-option-7631561c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7631561c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:11}}">暖橙夜</option>
        </select>
      </SettingRow>
      <SettingRow label="流式输出" description="逐字显示 AI 响应内容" data-qoder-id="qel-settingrow-faad315f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-faad315f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:7}}">
        <Toggle enabled={streaming} onChange={setStreaming}  data-qoder-id="qel-toggle-420a662c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-420a662c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:68,&quot;column&quot;:9}}"/>
      </SettingRow>
      <SettingRow label="自动保存" description="对话内容自动保存到本地" data-qoder-id="qel-settingrow-fcad3485" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-fcad3485&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:70,&quot;column&quot;:7}}">
        <Toggle enabled={autoSave} onChange={setAutoSave}  data-qoder-id="qel-toggle-440a6952" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-440a6952&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:9}}"/>
      </SettingRow>
      <SettingRow label="语言" description="界面显示语言" data-qoder-id="qel-settingrow-fead37ab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-fead37ab&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:7}}">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)]"
         data-qoder-id="qel-text-xs-42fcbc55" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-42fcbc55&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:74,&quot;column&quot;:9}}">
          <option value="zh-CN" data-qoder-id="qel-option-7f33a2de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7f33a2de&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:11}}">中文</option>
          <option value="en-US" data-qoder-id="qel-option-8033a471" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-8033a471&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:11}}">English</option>
          <option value="ja-JP" data-qoder-id="qel-option-7d339fb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-7d339fb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:11}}">日本語</option>
        </select>
      </SettingRow>
      <SettingRow label="全局快捷键" description={shortcutDescription}>
        <div className="flex items-center gap-2" data-od-id="shortcut-settings">
          <Toggle
            enabled={shortcutEnabled}
            onChange={(enabled) => {
              setShortcutEnabled(enabled)
              void saveShortcut(enabled, shortcutAccelerator)
            }}
            data-od-id="shortcut-enabled"
          />
          <input
            value={shortcutAccelerator}
            onChange={(e) => setShortcutAccelerator(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void saveShortcut()
            }}
            className="w-48 text-[11px] font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)]"
            data-od-id="shortcut-accelerator"
          />
          <Button variant="default" size="icon-sm" onClick={() => void saveShortcut()} title="保存快捷键" data-od-id="shortcut-save">
            <Check size={10} />
          </Button>
        </div>
      </SettingRow>
      <SettingRow label="最大上下文长度" description="单次对话最大 token 数" data-qoder-id="qel-settingrow-87a5c091" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-87a5c091&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}">
        <span className="text-xs font-mono text-[var(--seed-fg)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)]" data-qoder-id="qel-text-xs-f64f2065" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f64f2065&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:9}}">
          128,000
        </span>
      </SettingRow>
    </div>
  )
}

function AccountSettings() {
  const apiKeyStatus = useAppStore((s) => s.apiKeyStatus)
  const submitApiKey = useAppStore((s) => s.submitApiKey)
  const clearStoredApiKey = useAppStore((s) => s.clearStoredApiKey)
  const [anthropicKeyInput, setAnthropicKeyInput] = useState('')
  const [showAnthropicForm, setShowAnthropicForm] = useState(false)
  const [anthropicSaveError, setAnthropicSaveError] = useState<string | null>(null)

  const handleSaveAnthropicKey = async () => {
    if (!anthropicKeyInput.trim()) return
    try {
      await submitApiKey(anthropicKeyInput.trim())
      setAnthropicKeyInput('')
      setShowAnthropicForm(false)
      setAnthropicSaveError(null)
    } catch (error) {
      setAnthropicSaveError(error instanceof Error ? error.message : String(error))
    }
  }

  const handleResetAnthropicKey = () => {
    if (!window.confirm('确认清除已保存的 Anthropic API Key?清除后需要重新配置才能继续对话。')) return
    void clearStoredApiKey()
  }

  return (
    <div className="space-y-4" data-od-id="anthropic-settings">
      <div className="rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: apiKeyStatus === 'configured' ? 'var(--seed-primary)' : 'var(--seed-muted)' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--seed-fg)] font-medium">Anthropic</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  color: apiKeyStatus === 'configured' ? 'var(--seed-primary)' : 'var(--seed-muted)',
                  backgroundColor: apiKeyStatus === 'configured'
                    ? 'color-mix(in srgb, var(--seed-primary) 10%, transparent)'
                    : 'color-mix(in srgb, var(--seed-muted) 10%, transparent)',
                }}
              >
                {apiKeyStatus === 'configured' ? '已配置' : apiKeyStatus === 'unset' ? '未配置' : '检测中'}
              </span>
            </div>
            <p className="text-[10px] text-[var(--seed-muted)] font-mono truncate">https://api.anthropic.com/v1</p>
          </div>
        </div>

        <div className="px-3 pb-3 pt-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--seed-muted)] w-14 flex-shrink-0">API Key</span>
            {apiKeyStatus === 'configured' && !showAnthropicForm ? (
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-[var(--seed-muted)]">已隐藏（密文存储）</span>
                <button onClick={() => setShowAnthropicForm(true)} className="text-[10px] text-[var(--seed-primary)] hover:underline">更新</button>
                <button onClick={handleResetAnthropicKey} className="text-[10px] text-[var(--seed-accent)] hover:underline">重置</button>
              </div>
            ) : showAnthropicForm ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="password"
                  placeholder="输入 Anthropic API Key..."
                  autoFocus
                  value={anthropicKeyInput}
                  onChange={(e) => setAnthropicKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleSaveAnthropicKey()
                    if (e.key === 'Escape') {
                      setAnthropicKeyInput('')
                      setShowAnthropicForm(false)
                    }
                  }}
                  className="flex-1 text-[11px] font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)]"
                />
                <Button variant="default" size="icon-sm" onClick={() => void handleSaveAnthropicKey()} title="保存">
                  <Check size={10} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setAnthropicKeyInput('')
                    setShowAnthropicForm(false)
                  }}
                  title="取消"
                >
                  <X size={10} />
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-[var(--seed-muted)]">未设置</span>
                <button onClick={() => setShowAnthropicForm(true)} className="text-[10px] text-[var(--seed-primary)] hover:underline">设置</button>
              </div>
            )}
          </div>
          {anthropicSaveError && <p className="text-[10px] text-[var(--seed-accent)] mt-1.5">{anthropicSaveError}</p>}
        </div>
      </div>
    </div>
  )
}

const TAB_CONTENT: Record<TabId, (props: GeneralSettingsProps) => ReactNode> = {
  general: GeneralSettings,
  account: AccountSettings,
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  theme: ThemeKey
  onThemeChange: (v: ThemeKey) => void
}

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const ActiveContent = TAB_CONTENT[activeTab]

  return (
    <AnimatePresence data-qoder-id="qel-animatepresence-aaf9a8e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-aaf9a8e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:553,&quot;column&quot;:5}}">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[color-mix(in_srgb,var(--seed-bg)_80%,transparent)] backdrop-blur-sm z-50"
           data-qoder-id="qel-fixed-0b95e3bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fixed-0b95e3bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;fixed&quot;,&quot;loc&quot;:{&quot;line&quot;:557,&quot;column&quot;:11}}"/>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
           data-qoder-id="qel-fixed-0c95e54f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-fixed-0c95e54f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;fixed&quot;,&quot;loc&quot;:{&quot;line&quot;:566,&quot;column&quot;:11}}">
            <div
              className="pointer-events-auto w-[680px] max-h-[75vh] rounded-[calc(var(--seed-radius)*1.5)] border border-[var(--color-border-subtle)] bg-[var(--seed-surface)] shadow-2xl overflow-hidden flex"
              data-component="SettingsModal"
              data-od-id="settings-modal"
             data-qoder-id="qel-settingsmodal-87babce4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingsmodal-87babce4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;settingsmodal&quot;,&quot;loc&quot;:{&quot;line&quot;:573,&quot;column&quot;:13}}">
              {/* Sidebar Nav */}
              <nav className="w-[180px] border-r border-[var(--color-border-subtle)] bg-[var(--seed-bg)] py-4 flex flex-col" data-qoder-id="qel-w-180px-d9b6e154" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-180px-d9b6e154&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;w-180px&quot;,&quot;loc&quot;:{&quot;line&quot;:579,&quot;column&quot;:15}}">
                <h2 className="px-4 text-xs font-medium text-[var(--seed-fg)] mb-3 tracking-[-0.01em]" data-qoder-id="qel-px-4-8654e218" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-4-8654e218&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;px-4&quot;,&quot;loc&quot;:{&quot;line&quot;:580,&quot;column&quot;:17}}">设置</h2>
                <div className="space-y-0.5 px-2" data-qoder-id="qel-space-y-0-5-4d627dfc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-0-5-4d627dfc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;space-y-0-5&quot;,&quot;loc&quot;:{&quot;line&quot;:581,&quot;column&quot;:17}}">
                  {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--seed-radius)] text-xs transition-all duration-[var(--duration-fast)]',
                          activeTab === tab.id
                            ? 'bg-[var(--color-bg-elevated)] text-[var(--seed-fg)] font-medium'
                            : 'text-[var(--seed-muted)] hover:text-[var(--seed-fg)] hover:bg-[var(--color-bg-hover)]'
                        )}
                       data-qoder-id="qel-button-5946f895" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-5946f895&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:585,&quot;column&quot;:23}}">
                        <Icon size={14} className={activeTab === tab.id ? 'text-[var(--seed-primary)]' : ''}  data-qoder-id="qel-icon-729c4224" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-icon-729c4224&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;icon&quot;,&quot;loc&quot;:{&quot;line&quot;:595,&quot;column&quot;:25}}"/>
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* Content Area */}
              <div className="flex-1 flex flex-col min-w-0" data-qoder-id="qel-flex-1-3d97a2b9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-3d97a2b9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:604,&quot;column&quot;:15}}">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-flex-d5af86d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d5af86d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:606,&quot;column&quot;:17}}">
                  <h3 className="text-sm font-medium text-[var(--seed-fg)] tracking-[-0.01em]" data-qoder-id="qel-text-sm-50e111f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-50e111f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:607,&quot;column&quot;:19}}">
                    {TABS.find(t => t.id === activeTab)?.label}
                  </h3>
                  <Button variant="ghost" size="icon-sm" onClick={onClose} data-qoder-id="qel-button-11b2429b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-11b2429b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:610,&quot;column&quot;:19}}">
                    <X size={16}  data-qoder-id="qel-x-8beaf5c2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-8beaf5c2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:611,&quot;column&quot;:21}}"/>
                  </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4" data-qoder-id="qel-flex-1-ca9abf47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-ca9abf47&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:616,&quot;column&quot;:17}}">
                  <AnimatePresence mode="wait" data-qoder-id="qel-animatepresence-31f46d38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-31f46d38&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:617,&quot;column&quot;:19}}">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                     data-qoder-id="qel-motion-div-4f85d5f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-4f85d5f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:618,&quot;column&quot;:21}}">
                      <ActiveContent theme={theme} onThemeChange={onThemeChange}  data-qoder-id="qel-activecontent-282ec0ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-activecontent-282ec0ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SettingsModal&quot;,&quot;elementRole&quot;:&quot;activecontent&quot;,&quot;loc&quot;:{&quot;line&quot;:625,&quot;column&quot;:23}}"/>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
