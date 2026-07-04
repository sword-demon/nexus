import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, User, Puzzle, Plug, Server, ChevronRight, ToggleLeft, ToggleRight, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'general', label: '基础配置', icon: Settings },
  { id: 'account', label: '账号配置', icon: User },
  { id: 'skills', label: 'Skills', icon: Puzzle },
  { id: 'plugins', label: 'Plugins', icon: Plug },
  { id: 'mcp', label: 'MCP', icon: Server },
]

function Toggle({ enabled, onChange, ...qoderProps }) {
  return (
    <button
      onClick={() => onChange?.(!enabled)}
      className={[(cn(
        'relative w-9 h-5 rounded-full transition-colors duration-200',
        enabled
          ? 'bg-[var(--seed-primary)]'
          : 'bg-[var(--color-border-subtle)]'
      )), qoderProps?.className].filter(Boolean).join(" ")}
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-[var(--seed-fg)]"
        animate={{ left: enabled ? '18px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
       data-qoder-id="qel-absolute-41cc23fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-41cc23fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;Toggle&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:7}}"/>
    </button>
  )
}

function SettingRow({ label, description, children, ...qoderProps }) {
  return (
    <div className={["flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)] last:border-b-0", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
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

function GeneralSettings({ theme, onThemeChange }) {
  const [streaming, setStreaming] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [language, setLanguage] = useState('zh-CN')

  return (
    <div className="space-y-1" data-qoder-id="qel-space-y-1-ab3aa0cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-ab3aa0cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:55,&quot;column&quot;:5}}">
      <SettingRow label="界面主题" description="选择界面配色方案" data-qoder-id="qel-settingrow-80de1419" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-80de1419&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:56,&quot;column&quot;:7}}">
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
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
      <SettingRow label="最大上下文长度" description="单次对话最大 token 数" data-qoder-id="qel-settingrow-87a5c091" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-87a5c091&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}">
        <span className="text-xs font-mono text-[var(--seed-fg)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)]" data-qoder-id="qel-text-xs-f64f2065" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-f64f2065&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;GeneralSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:9}}">
          128,000
        </span>
      </SettingRow>
    </div>
  )
}

function AccountSettings() {
  const [providers, setProviders] = useState([
    {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-proj-****...8f3a',
      apiKeyFull: '',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
      enabled: true,
      status: 'connected',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: 'sk-ant-****...2c7b',
      apiKeyFull: '',
      models: ['claude-4-sonnet', 'claude-4-opus', 'claude-3.5-sonnet', 'claude-3-haiku'],
      enabled: true,
      status: 'connected',
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      apiKeyFull: '',
      models: [],
      enabled: false,
      status: 'disconnected',
    },
  ])
  const [defaultModel, setDefaultModel] = useState('claude-4-sonnet')
  const [editingProvider, setEditingProvider] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProvider, setNewProvider] = useState({ name: '', baseUrl: '', apiKey: '' })
  const [fetchingModels, setFetchingModels] = useState(null)
  const [saved, setSaved] = useState(false)

  // All available models across enabled providers
  const allModels = providers
    .filter(p => p.enabled && p.models.length > 0)
    .flatMap(p => p.models.map(m => ({ model: m, provider: p.name })))

  const handleFetchModels = (providerId) => {
    setFetchingModels(providerId)
    // Simulate API call to fetch models from base_url/models
    setTimeout(() => {
      setProviders(prev => prev.map(p => {
        if (p.id === providerId) {
          // Simulate fetched models based on provider
          const mockModels = {
            openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini', 'gpt-3.5-turbo'],
            anthropic: ['claude-4-sonnet', 'claude-4-opus', 'claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-haiku'],
            deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
          }
          return {
            ...p,
            models: mockModels[p.id] || ['model-1', 'model-2'],
            status: 'connected',
            enabled: true,
          }
        }
        return p
      }))
      setFetchingModels(null)
    }, 1500)
  }

  const handleSave = () => {
    // Simulate persisting to localStorage / config file
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddProvider = () => {
    if (!newProvider.name || !newProvider.baseUrl) return
    const id = newProvider.name.toLowerCase().replace(/\s+/g, '-')
    setProviders(prev => [...prev, {
      id,
      name: newProvider.name,
      baseUrl: newProvider.baseUrl,
      apiKey: newProvider.apiKey ? `${newProvider.apiKey.slice(0, 6)}****...${newProvider.apiKey.slice(-4)}` : '',
      apiKeyFull: newProvider.apiKey,
      models: [],
      enabled: false,
      status: 'disconnected',
    }])
    setNewProvider({ name: '', baseUrl: '', apiKey: '' })
    setShowAddForm(false)
  }

  const handleRemoveProvider = (id) => {
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  const handleToggleProvider = (id) => {
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const statusColors = {
    connected: 'var(--seed-primary)',
    disconnected: 'var(--seed-muted)',
    error: 'var(--seed-accent)',
  }

  return (
    <div className="space-y-4" data-qoder-id="qel-space-y-4-ac578db8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-4-ac578db8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;space-y-4&quot;,&quot;loc&quot;:{&quot;line&quot;:203,&quot;column&quot;:5}}">
      {/* Provider List */}
      <div data-qoder-id="qel-div-b482efbb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-b482efbb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:205,&quot;column&quot;:7}}">
        <div className="flex items-center justify-between mb-3" data-qoder-id="qel-flex-edc22e28" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-edc22e28&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:206,&quot;column&quot;:9}}">
          <p className="text-[11px] text-[var(--seed-muted)] uppercase tracking-[0.06em]" data-qoder-id="qel-text-11px-2fd435dd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-2fd435dd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:207,&quot;column&quot;:11}}">LLM Providers</p>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5 text-[10px]" data-qoder-id="qel-gap-1-5-b6f95f78" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-b6f95f78&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:208,&quot;column&quot;:11}}">
            <Plus size={11}  data-qoder-id="qel-plus-3abae4bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-3abae4bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:13}}"/>
            添加
          </Button>
        </div>

        <div className="space-y-2" data-qoder-id="qel-space-y-2-baf57c8b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-2-baf57c8b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;space-y-2&quot;,&quot;loc&quot;:{&quot;line&quot;:214,&quot;column&quot;:9}}">
          {providers.map(provider => (
            <div
              key={provider.id}
              className="rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] overflow-hidden"
             data-qoder-id="qel-rounded-var-seed-radius-fe118235" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-var-seed-radius-fe118235&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;rounded-var-seed-radius&quot;,&quot;loc&quot;:{&quot;line&quot;:216,&quot;column&quot;:13}}">
              {/* Provider Header */}
              <div className="flex items-center gap-3 p-3" data-qoder-id="qel-flex-71bf2c5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-71bf2c5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:221,&quot;column&quot;:15}}">
                <div className="relative flex-shrink-0" data-qoder-id="qel-relative-20263031" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-20263031&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:222,&quot;column&quot;:17}}">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColors[provider.status] }}
                   data-qoder-id="qel-w-2-45375628" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-2-45375628&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-2&quot;,&quot;loc&quot;:{&quot;line&quot;:223,&quot;column&quot;:19}}"/>
                </div>
                <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-33d3eae8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-33d3eae8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:228,&quot;column&quot;:17}}">
                  <div className="flex items-center gap-2" data-qoder-id="qel-flex-6dbf2611" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-6dbf2611&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:19}}">
                    <span className="text-sm text-[var(--seed-fg)] font-medium" data-qoder-id="qel-text-sm-35fe5768" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-35fe5768&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:21}}">{provider.name}</span>
                    {provider.status === 'connected' && (
                      <span className="text-[9px] text-[var(--seed-primary)] bg-[color-mix(in_srgb,var(--seed-primary)_10%,transparent)] px-1.5 py-0.5 rounded font-mono" data-qoder-id="qel-text-9px-f9ed5610" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-f9ed5610&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:232,&quot;column&quot;:23}}">
                        {provider.models.length} 模型
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--seed-muted)] font-mono truncate" data-qoder-id="qel-text-10px-00de72f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-00de72f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:237,&quot;column&quot;:19}}">{provider.baseUrl}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" data-qoder-id="qel-flex-67bcde08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-67bcde08&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:17}}">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleFetchModels(provider.id)}
                    title="获取模型列表"
                    disabled={!provider.apiKey}
                   data-qoder-id="qel-button-f1ed37f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f1ed37f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:19}}">
                    {fetchingModels === provider.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-3 h-3 border-[1.5px] border-[var(--seed-muted)] border-t-transparent rounded-full"
                       data-qoder-id="qel-w-3-086ad93a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-3-086ad93a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-3&quot;,&quot;loc&quot;:{&quot;line&quot;:248,&quot;column&quot;:23}}"/>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-svg-04e2e9db" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-04e2e9db&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:254,&quot;column&quot;:23}}">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" data-qoder-id="qel-path-ef1a1ffe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ef1a1ffe&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:255,&quot;column&quot;:25}}"/>
                        <path d="M3 3v5h5" data-qoder-id="qel-path-ee1a1e6b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ee1a1e6b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:256,&quot;column&quot;:25}}"/>
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" data-qoder-id="qel-path-ed1a1cd8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ed1a1cd8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:257,&quot;column&quot;:25}}"/>
                        <path d="M16 16h5v5" data-qoder-id="qel-path-ec1a1b45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-ec1a1b45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:258,&quot;column&quot;:25}}"/>
                      </svg>
                    )}
                  </Button>
                  <Toggle enabled={provider.enabled} onChange={() => handleToggleProvider(provider.id)}  data-qoder-id="qel-toggle-6a500db8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-6a500db8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:262,&quot;column&quot;:19}}"/>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="text-[var(--seed-muted)] hover:text-[var(--seed-accent)]"
                    title="移除"
                   data-qoder-id="qel-text-var-seed-muted-108c6d3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-108c6d3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:263,&quot;column&quot;:19}}">
                    <X size={12}  data-qoder-id="qel-x-6c1e82a1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-6c1e82a1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:21}}"/>
                  </Button>
                </div>
              </div>

              {/* API Key Row */}
              <div className="px-3 pb-3 pt-0" data-qoder-id="qel-px-3-e5ae8ad1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-px-3-e5ae8ad1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;px-3&quot;,&quot;loc&quot;:{&quot;line&quot;:276,&quot;column&quot;:15}}">
                <div className="flex items-center gap-2" data-qoder-id="qel-flex-61ba95ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-61ba95ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:277,&quot;column&quot;:17}}">
                  <span className="text-[10px] text-[var(--seed-muted)] w-14 flex-shrink-0" data-qoder-id="qel-text-10px-a0bd2251" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-a0bd2251&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:278,&quot;column&quot;:19}}">API Key</span>
                  {editingProvider === provider.id ? (
                    <div className="flex-1 flex items-center gap-1.5" data-qoder-id="qel-flex-1-22d84d53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-22d84d53&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:280,&quot;column&quot;:21}}">
                      <input
                        type="password"
                        placeholder="输入 API Key..."
                        autoFocus
                        className="flex-1 text-[11px] font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded px-2 py-1 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setProviders(prev => prev.map(p =>
                              p.id === provider.id
                                ? { ...p, apiKey: `${e.target.value.slice(0, 6)}****...${e.target.value.slice(-4)}`, apiKeyFull: e.target.value }
                                : p
                            ))
                            setEditingProvider(null)
                          }
                          if (e.key === 'Escape') setEditingProvider(null)
                        }}
                       data-qoder-id="qel-flex-1-dae53299" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-dae53299&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:281,&quot;column&quot;:23}}"/>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditingProvider(null)} data-qoder-id="qel-button-04eb174b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-04eb174b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:298,&quot;column&quot;:23}}">
                        <X size={10}  data-qoder-id="qel-x-631e7476" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-631e7476&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:299,&quot;column&quot;:25}}"/>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-1.5" data-qoder-id="qel-flex-1-2ed86037" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-2ed86037&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:21}}">
                      <span className="text-[11px] font-mono text-[var(--seed-muted)]" data-qoder-id="qel-text-11px-49c3aa1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-49c3aa1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:304,&quot;column&quot;:23}}">
                        {provider.apiKey || '未设置'}
                      </span>
                      <button
                        onClick={() => setEditingProvider(provider.id)}
                        className="text-[10px] text-[var(--seed-primary)] hover:underline"
                       data-qoder-id="qel-text-10px-12223e0d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-12223e0d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:307,&quot;column&quot;:23}}">
                        {provider.apiKey ? '修改' : '设置'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Provider Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-[var(--seed-radius)] border border-[var(--seed-primary)] bg-[color-mix(in_srgb,var(--seed-primary)_5%,transparent)] p-3 space-y-2.5 overflow-hidden"
         data-qoder-id="qel-rounded-var-seed-radius-ec7af84a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rounded-var-seed-radius-ec7af84a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;rounded-var-seed-radius&quot;,&quot;loc&quot;:{&quot;line&quot;:324,&quot;column&quot;:9}}">
          <p className="text-xs font-medium text-[var(--seed-fg)]" data-qoder-id="qel-text-xs-26093e4d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-26093e4d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:329,&quot;column&quot;:11}}">添加 Provider</p>
          <input
            type="text"
            placeholder="名称 (如 OpenRouter, Ollama...)"
            value={newProvider.name}
            onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
            className="w-full text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)] placeholder:text-[var(--seed-muted)]"
           data-qoder-id="qel-w-full-3677e4e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-3677e4e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:330,&quot;column&quot;:11}}"/>
          <input
            type="text"
            placeholder="Base URL (如 https://api.openrouter.ai/v1)"
            value={newProvider.baseUrl}
            onChange={(e) => setNewProvider(prev => ({ ...prev, baseUrl: e.target.value }))}
            className="w-full text-xs font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)] placeholder:text-[var(--seed-muted)]"
           data-qoder-id="qel-w-full-3777e67b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-3777e67b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:337,&quot;column&quot;:11}}"/>
          <input
            type="password"
            placeholder="API Key"
            value={newProvider.apiKey}
            onChange={(e) => setNewProvider(prev => ({ ...prev, apiKey: e.target.value }))}
            className="w-full text-xs font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)] placeholder:text-[var(--seed-muted)]"
           data-qoder-id="qel-w-full-3877e80e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-3877e80e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:344,&quot;column&quot;:11}}"/>
          <div className="flex items-center gap-2 pt-1" data-qoder-id="qel-flex-5db8511c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5db8511c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:351,&quot;column&quot;:11}}">
            <Button variant="default" size="sm" onClick={handleAddProvider} className="gap-1.5 text-xs" data-qoder-id="qel-gap-1-5-4003317f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-4003317f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:13}}">
              <Check size={12}  data-qoder-id="qel-check-e8a7318a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-check-e8a7318a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;check&quot;,&quot;loc&quot;:{&quot;line&quot;:353,&quot;column&quot;:15}}"/>
              添加
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="text-xs" data-qoder-id="qel-text-xs-7a7ec343" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-7a7ec343&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:356,&quot;column&quot;:13}}">
              取消
            </Button>
          </div>
        </motion.div>
      )}

      {/* Default Model Selection */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)]" data-qoder-id="qel-pt-2-307b1537" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pt-2-307b1537&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;pt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:7}}">
        <SettingRow label="默认模型" description="所有对话使用的默认模型" data-qoder-id="qel-settingrow-7a98ddfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-7a98ddfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:365,&quot;column&quot;:9}}">
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--seed-radius)] px-2.5 py-1.5 text-[var(--seed-fg)] focus:outline-none focus:border-[var(--seed-primary)] max-w-[180px]"
           data-qoder-id="qel-text-xs-39ece34e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-39ece34e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:366,&quot;column&quot;:11}}">
            {allModels.length > 0 ? (
              allModels.map(({ model, provider }) => (
                <option key={`${provider}-${model}`} value={model} data-qoder-id="qel-option-cc45c28e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-cc45c28e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:373,&quot;column&quot;:17}}">
                  {model} ({provider})
                </option>
              ))
            ) : (
              <option disabled data-qoder-id="qel-option-cd45c421" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-option-cd45c421&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;option&quot;,&quot;loc&quot;:{&quot;line&quot;:378,&quot;column&quot;:15}}">请先连接 Provider 获取模型</option>
            )}
          </select>
        </SettingRow>
      </div>

      {/* Save Button */}
      <div className="pt-2" data-qoder-id="qel-pt-2-2d7b107e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pt-2-2d7b107e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;pt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:385,&quot;column&quot;:7}}">
        <Button variant="accent" size="sm" onClick={handleSave} className="w-full gap-2 text-xs" data-qoder-id="qel-w-full-737b578a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-737b578a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:386,&quot;column&quot;:9}}">
          {saved ? (
            <>
              <Check size={13}  data-qoder-id="qel-check-e3a4eb14" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-check-e3a4eb14&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;check&quot;,&quot;loc&quot;:{&quot;line&quot;:389,&quot;column&quot;:15}}"/>
              已保存
            </>
          ) : (
            '保存配置'
          )}
        </Button>
        <p className="text-[10px] text-[var(--seed-muted)] mt-2 text-center" data-qoder-id="qel-text-10px-01dc35ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-01dc35ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;AccountSettings&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:396,&quot;column&quot;:9}}">
          配置将持久化保存到本地 ~/.nexusagent/config.json
        </p>
      </div>
    </div>
  )
}

function SkillsSettings() {
  const [skills] = useState([
    { id: 'code-analysis', name: '代码分析', description: '静态分析、安全审计、性能检测', enabled: true },
    { id: 'file-ops', name: '文件操作', description: '读写、搜索、重构项目文件', enabled: true },
    { id: 'web-search', name: '联网搜索', description: '实时搜索网络获取最新信息', enabled: true },
    { id: 'code-exec', name: '代码执行', description: '在沙箱中运行代码片段', enabled: false },
    { id: 'git-ops', name: 'Git 操作', description: '提交、分支、合并等版本控制', enabled: true },
    { id: 'docs-gen', name: '文档生成', description: 'API 文档、README 自动生成', enabled: false },
  ])
  const [enabledMap, setEnabledMap] = useState(
    Object.fromEntries(skills.map(s => [s.id, s.enabled]))
  )

  return (
    <div className="space-y-1" data-qoder-id="qel-space-y-1-084e7561" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-084e7561&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SkillsSettings&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:418,&quot;column&quot;:5}}">
      {skills.map(skill => (
        <SettingRow key={skill.id} label={skill.name} description={skill.description} data-qoder-id="qel-settingrow-8d85e691" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-8d85e691&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SkillsSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:420,&quot;column&quot;:9}}">
          <Toggle
            enabled={enabledMap[skill.id]}
            onChange={(v) => setEnabledMap(prev => ({ ...prev, [skill.id]: v }))}
           data-qoder-id="qel-toggle-709860b8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-709860b8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;SkillsSettings&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:421,&quot;column&quot;:11}}"/>
        </SettingRow>
      ))}
    </div>
  )
}

function PluginsSettings() {
  const [plugins] = useState([
    { id: 'prettier', name: 'Prettier', description: '代码格式化', version: 'v3.2.0', enabled: true },
    { id: 'eslint', name: 'ESLint', description: '代码规范检查', version: 'v9.0.0', enabled: true },
    { id: 'typescript', name: 'TypeScript', description: '类型检查增强', version: 'v5.4.0', enabled: true },
    { id: 'docker', name: 'Docker', description: '容器管理和部署', version: 'v2.1.0', enabled: false },
    { id: 'db-client', name: 'DB Client', description: '数据库查询和管理', version: 'v1.3.0', enabled: false },
  ])
  const [enabledMap, setEnabledMap] = useState(
    Object.fromEntries(plugins.map(p => [p.id, p.enabled]))
  )

  return (
    <div className="space-y-1" data-qoder-id="qel-space-y-1-b7e9bd2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-b7e9bd2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:444,&quot;column&quot;:5}}">
      {plugins.map(plugin => (
        <SettingRow
          key={plugin.id}
          label={
            <span className="flex items-center gap-2" data-qoder-id="qel-flex-cd6c438c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-cd6c438c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:449,&quot;column&quot;:13}}">
              {plugin.name}
              <span className="text-[9px] font-mono text-[var(--seed-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded" data-qoder-id="qel-text-9px-d3fcb097" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d3fcb097&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:451,&quot;column&quot;:15}}">{plugin.version}</span>
            </span>
          }
          description={plugin.description}
         data-qoder-id="qel-settingrow-aa64884e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingrow-aa64884e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;settingrow&quot;,&quot;loc&quot;:{&quot;line&quot;:446,&quot;column&quot;:9}}">
          <Toggle
            enabled={enabledMap[plugin.id]}
            onChange={(v) => setEnabledMap(prev => ({ ...prev, [plugin.id]: v }))}
           data-qoder-id="qel-toggle-443eca1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toggle-443eca1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;toggle&quot;,&quot;loc&quot;:{&quot;line&quot;:456,&quot;column&quot;:11}}"/>
        </SettingRow>
      ))}
      <div className="pt-3" data-qoder-id="qel-pt-3-e84479c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pt-3-e84479c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;pt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:462,&quot;column&quot;:7}}">
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs" data-qoder-id="qel-w-full-0d47e8ce" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-0d47e8ce&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:463,&quot;column&quot;:9}}">
          <Plug size={12}  data-qoder-id="qel-plug-996129e3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plug-996129e3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;PluginsSettings&quot;,&quot;elementRole&quot;:&quot;plug&quot;,&quot;loc&quot;:{&quot;line&quot;:464,&quot;column&quot;:11}}"/>
          浏览插件市场
        </Button>
      </div>
    </div>
  )
}

function MCPSettings() {
  const [servers] = useState([
    { id: 'filesystem', name: 'Filesystem', endpoint: 'stdio', status: 'connected', description: '本地文件系统访问' },
    { id: 'github', name: 'GitHub', endpoint: 'https://mcp.github.com', status: 'connected', description: 'GitHub 仓库操作' },
    { id: 'postgres', name: 'PostgreSQL', endpoint: 'localhost:5432', status: 'disconnected', description: '数据库读写' },
    { id: 'slack', name: 'Slack', endpoint: 'https://mcp.slack.com', status: 'error', description: '消息发送和频道管理' },
  ])

  const statusColors = {
    connected: 'var(--seed-primary)',
    disconnected: 'var(--seed-muted)',
    error: 'var(--seed-accent)',
  }

  const statusLabels = {
    connected: '已连接',
    disconnected: '未连接',
    error: '错误',
  }

  return (
    <div className="space-y-1" data-qoder-id="qel-space-y-1-e36e1dcf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-e36e1dcf&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:493,&quot;column&quot;:5}}">
      <div className="pb-2 mb-2 border-b border-[var(--color-border-subtle)]" data-qoder-id="qel-pb-2-3e5b60e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pb-2-3e5b60e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;pb-2&quot;,&quot;loc&quot;:{&quot;line&quot;:494,&quot;column&quot;:7}}">
        <p className="text-[11px] text-[var(--seed-muted)]" data-qoder-id="qel-text-11px-8fc716aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-8fc716aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:495,&quot;column&quot;:9}}">
          Model Context Protocol 服务器管理，连接外部工具和数据源。
        </p>
      </div>
      {servers.map(server => (
        <div key={server.id} className="flex items-center justify-between py-3 border-b border-[var(--color-border-subtle)] last:border-b-0" data-qoder-id="qel-flex-1628f3bd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1628f3bd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:500,&quot;column&quot;:9}}">
          <div className="flex items-center gap-3 flex-1 min-w-0" data-qoder-id="qel-flex-1528f22a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1528f22a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:501,&quot;column&quot;:11}}">
            <div className="relative" data-qoder-id="qel-relative-0b33e90e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-0b33e90e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:502,&quot;column&quot;:13}}">
              <Server size={16} className="text-[var(--seed-muted)]"  data-qoder-id="qel-text-var-seed-muted-d753c568" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-d753c568&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:503,&quot;column&quot;:15}}"/>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--seed-surface)]"
                style={{ backgroundColor: statusColors[server.status] }}
               data-qoder-id="qel-absolute-ffb3da67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-absolute-ffb3da67&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;absolute&quot;,&quot;loc&quot;:{&quot;line&quot;:504,&quot;column&quot;:15}}"/>
            </div>
            <div className="min-w-0" data-qoder-id="qel-min-w-0-ec517462" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-ec517462&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:509,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2" data-qoder-id="qel-flex-0087c73b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0087c73b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:510,&quot;column&quot;:15}}">
                <p className="text-sm text-[var(--seed-fg)]" data-qoder-id="qel-text-sm-d2870e48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-d2870e48&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:511,&quot;column&quot;:17}}">{server.name}</p>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    color: statusColors[server.status],
                    backgroundColor: `color-mix(in srgb, ${statusColors[server.status]} 12%, transparent)`,
                  }}
                 data-qoder-id="qel-text-9px-4db78696" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-4db78696&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:512,&quot;column&quot;:17}}">
                  {statusLabels[server.status]}
                </span>
              </div>
              <p className="text-[10px] text-[var(--seed-muted)] font-mono truncate" data-qoder-id="qel-text-10px-511e8e77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-511e8e77&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:522,&quot;column&quot;:15}}">{server.endpoint}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" data-qoder-id="qel-button-140de09d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-140de09d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:525,&quot;column&quot;:11}}">
            <ChevronRight size={14}  data-qoder-id="qel-chevronright-f067d9bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chevronright-f067d9bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;chevronright&quot;,&quot;loc&quot;:{&quot;line&quot;:526,&quot;column&quot;:13}}"/>
          </Button>
        </div>
      ))}
      <div className="pt-3" data-qoder-id="qel-pt-3-0de56dfa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pt-3-0de56dfa&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;pt-3&quot;,&quot;loc&quot;:{&quot;line&quot;:530,&quot;column&quot;:7}}">
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs" data-qoder-id="qel-w-full-e3732ded" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-e3732ded&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:531,&quot;column&quot;:9}}">
          <Server size={12}  data-qoder-id="qel-server-9f5f0cc7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-server-9f5f0cc7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/SettingsModal.jsx&quot;,&quot;componentName&quot;:&quot;MCPSettings&quot;,&quot;elementRole&quot;:&quot;server&quot;,&quot;loc&quot;:{&quot;line&quot;:532,&quot;column&quot;:11}}"/>
          添加 MCP 服务器
        </Button>
      </div>
    </div>
  )
}

const TAB_CONTENT = {
  general: GeneralSettings,
  account: AccountSettings,
  skills: SkillsSettings,
  plugins: PluginsSettings,
  mcp: MCPSettings,
}

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange }) {
  const [activeTab, setActiveTab] = useState('general')
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
