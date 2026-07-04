import { useState, useEffect } from 'react'
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

const DEMO_CONVERSATIONS = [
  { id: '1', title: '分析认证逻辑安全漏洞', time: '14:32', active: true },
  { id: '2', title: '重构数据库查询优化', time: '昨天', active: false },
  { id: '3', title: '部署流程自动化脚本', time: '周一', active: false },
  { id: '4', title: 'API 接口文档生成', time: '6月28日', active: false },
]

const CONTEXT_FILES = [
  { name: 'auth.ts', path: 'src/utils/', type: 'ts' },
  { name: 'middleware.ts', path: 'src/', type: 'ts' },
  { name: 'package.json', path: '/', type: 'json' },
]

function Sidebar({ onOpenSettings, collapsed, onToggleCollapse, ...qoderProps }) {
  const [activeTab, setActiveTab] = useState('conversations')

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 260 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={["h-full border-r border-[var(--color-border-subtle)] bg-[var(--seed-bg)] flex flex-col overflow-hidden flex-shrink-0", qoderProps?.className].filter(Boolean).join(" ")}
      data-component="Sidebar"
      data-od-id="sidebar-left"
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Brand Header */}
      <div className={cn('py-4 border-b border-[var(--color-border-subtle)]', collapsed ? 'px-2' : 'px-4')} data-qoder-id="qel-div-6dc3fc6d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-6dc3fc6d&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:7}}">
        <div className="flex items-center gap-2.5" data-qoder-id="qel-flex-d0aa3756" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-d0aa3756&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:9}}">
          <div className="w-7 h-7 rounded-lg bg-[var(--seed-primary)] flex items-center justify-center flex-shrink-0" data-qoder-id="qel-w-7-4ce4c0fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-7-4ce4c0fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-7&quot;,&quot;loc&quot;:{&quot;line&quot;:40,&quot;column&quot;:11}}">
            <Zap size={14} className="text-[var(--seed-bg)]"  data-qoder-id="qel-text-var-seed-bg-9667dcb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-bg-9667dcb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-var-seed-bg&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:13}}"/>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0"
             data-qoder-id="qel-min-w-0-6ec1aded" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-6ec1aded&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:44,&quot;column&quot;:13}}">
              <h1 className="text-sm font-medium tracking-[-0.02em]" data-qoder-id="qel-text-sm-e6223695" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-e6223695&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:49,&quot;column&quot;:15}}">NexusAgent</h1>
              <p className="text-[10px] text-[var(--seed-muted)] tracking-[0.02em]" data-qoder-id="qel-text-10px-77b073c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-77b073c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:50,&quot;column&quot;:15}}">v2.4.0</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* New Chat Button */}
      <div className={cn('pt-3', collapsed ? 'px-2' : 'px-3')} data-qoder-id="qel-div-62c3eb1c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-62c3eb1c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:57,&quot;column&quot;:7}}">
        {collapsed ? (
          <Button variant="accent" size="icon-sm" className="w-full aspect-square" title="新建对话" data-qoder-id="qel-w-full-0f4ee54f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-0f4ee54f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:11}}">
            <Plus size={16}  data-qoder-id="qel-plus-543fd3ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-543fd3ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:13}}"/>
          </Button>
        ) : (
          <Button variant="accent" size="sm" className="w-full gap-2 text-xs" data-qoder-id="qel-w-full-114ee875" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-114ee875&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:11}}">
            <Plus size={14}  data-qoder-id="qel-plus-563fd725" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-plus-563fd725&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;plus&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:13}}"/>
            新建对话
          </Button>
        )}
      </div>

      {/* Tab Switcher (hidden when collapsed) */}
      {!collapsed && (
        <div className="flex px-3 pt-3 gap-1" data-qoder-id="qel-flex-59efe24c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-59efe24c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:72,&quot;column&quot;:9}}">
          <Button
            variant={activeTab === 'conversations' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('conversations')}
            className="flex-1 gap-1.5 text-[11px]"
           data-qoder-id="qel-flex-1-2c5af640" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-2c5af640&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:11}}">
            <MessageSquare size={12}  data-qoder-id="qel-messagesquare-7d05e98a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-messagesquare-7d05e98a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;messagesquare&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:13}}"/>
            对话
          </Button>
          <Button
            variant={activeTab === 'context' ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('context')}
            className="flex-1 gap-1.5 text-[11px]"
           data-qoder-id="qel-flex-1-2e5af966" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-2e5af966&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:11}}">
            <FolderOpen size={12}  data-qoder-id="qel-folderopen-b7019d64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-folderopen-b7019d64&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;folderopen&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:13}}"/>
            上下文
          </Button>
        </div>
      )}

      {/* Collapsed icon tabs */}
      {collapsed && (
        <div className="flex flex-col items-center gap-1 px-2 pt-3" data-qoder-id="qel-flex-5eefea2b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5eefea2b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:9}}">
          <Button
            variant={activeTab === 'conversations' ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTab('conversations')}
            title="对话"
           data-qoder-id="qel-button-f1fdb4af" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f1fdb4af&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:11}}">
            <MessageSquare size={14}  data-qoder-id="qel-messagesquare-e80d4dc0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-messagesquare-e80d4dc0&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;messagesquare&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:13}}"/>
          </Button>
          <Button
            variant={activeTab === 'context' ? 'outline' : 'ghost'}
            size="icon-sm"
            onClick={() => setActiveTab('context')}
            title="上下文"
           data-qoder-id="qel-button-f3fdb7d5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f3fdb7d5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:11}}">
            <FolderOpen size={14}  data-qoder-id="qel-folderopen-420933fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-folderopen-420933fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;folderopen&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:13}}"/>
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" data-qoder-id="qel-flex-1-ccd119c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-ccd119c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:7}}">
        {!collapsed && (
          <AnimatePresence mode="wait" data-qoder-id="qel-animatepresence-3a061484" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-3a061484&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:119,&quot;column&quot;:11}}">
            {activeTab === 'conversations' ? (
              <motion.div
                key="conversations"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-1"
               data-qoder-id="qel-space-y-1-904c87cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-904c87cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:15}}">
                {DEMO_CONVERSATIONS.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className={cn(
                      'w-full text-left px-3 py-2.5 h-auto justify-start',
                      conv.active
                        ? 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-active)]'
                        : 'border border-transparent'
                    )}
                   data-qoder-id="qel-button-eefdaff6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-eefdaff6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:129,&quot;column&quot;:19}}">
                    <div className="flex items-start justify-between gap-2 w-full" data-qoder-id="qel-flex-dff77103" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-dff77103&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:21}}">
                      <span className={cn(
                        'text-xs leading-snug line-clamp-2',
                        conv.active ? 'text-[var(--seed-fg)] font-medium' : 'text-[var(--color-text-secondary)]'
                      )} data-qoder-id="qel-span-f6e95830" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-f6e95830&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:140,&quot;column&quot;:23}}">
                        {conv.title}
                      </span>
                      <span className="text-[10px] text-[var(--seed-muted)] flex-shrink-0 mt-0.5" data-qoder-id="qel-text-10px-4cc0bd91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-4cc0bd91&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:146,&quot;column&quot;:23}}">
                        {conv.time}
                      </span>
                    </div>
                  </Button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="context"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-1"
               data-qoder-id="qel-space-y-1-134f949c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-space-y-1-134f949c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;space-y-1&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:15}}">
                <p className="text-[10px] text-[var(--seed-muted)] uppercase tracking-[0.06em] px-2 pb-1" data-qoder-id="qel-text-10px-62b9c375" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-62b9c375&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:17}}">
                  活跃文件
                </p>
                {CONTEXT_FILES.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--seed-radius)] hover:bg-[var(--color-bg-hover)] transition-colors duration-[var(--duration-fast)]"
                   data-qoder-id="qel-flex-e0f533ff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-e0f533ff&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:19}}">
                    <FileCode size={13} className="text-[var(--seed-primary)] flex-shrink-0"  data-qoder-id="qel-text-var-seed-primary-b80a8c35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-primary-b80a8c35&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-var-seed-primary&quot;,&quot;loc&quot;:{&quot;line&quot;:169,&quot;column&quot;:21}}"/>
                    <div className="min-w-0" data-qoder-id="qel-min-w-0-70fa426b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-min-w-0-70fa426b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;min-w-0&quot;,&quot;loc&quot;:{&quot;line&quot;:170,&quot;column&quot;:21}}">
                      <p className="text-xs text-[var(--seed-fg)] truncate" data-qoder-id="qel-text-xs-1c8d43e9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-1c8d43e9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:23}}">{file.name}</p>
                      <p className="text-[10px] text-[var(--seed-muted)] font-mono" data-qoder-id="qel-text-10px-5db9bb96" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-10px-5db9bb96&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-10px&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:23}}">{file.path}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className={cn('py-3 border-t border-[var(--color-border-subtle)] space-y-1', collapsed ? 'px-2' : 'px-3')} data-qoder-id="qel-div-1a83f1c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1a83f1c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:7}}">
        {collapsed ? (
          <>
            <Button variant="ghost" size="icon-sm" className="w-full" onClick={onOpenSettings} title="设置" data-qoder-id="qel-w-full-9a49aff2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-9a49aff2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:13}}">
              <Settings size={14}  data-qoder-id="qel-settings-35ed9a07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settings-35ed9a07&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;settings&quot;,&quot;loc&quot;:{&quot;line&quot;:187,&quot;column&quot;:15}}"/>
            </Button>
            <Button variant="ghost" size="icon-sm" className="w-full" onClick={onToggleCollapse} title="展开侧边栏" data-qoder-id="qel-w-full-9242e795" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-9242e795&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:189,&quot;column&quot;:13}}">
              <PanelLeft size={14}  data-qoder-id="qel-panelleft-00bfc1bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-panelleft-00bfc1bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;panelleft&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:15}}"/>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onOpenSettings} data-qoder-id="qel-w-full-9042e46f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-9042e46f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:13}}">
              <Settings size={13}  data-qoder-id="qel-settings-31ed93bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settings-31ed93bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;settings&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:15}}"/>
              <span className="text-xs" data-qoder-id="qel-text-xs-7883bb49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-7883bb49&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:197,&quot;column&quot;:15}}">设置</span>
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onToggleCollapse} data-qoder-id="qel-w-full-8b42dc90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-w-full-8b42dc90&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;w-full&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:13}}">
              <PanelLeftClose size={13}  data-qoder-id="qel-panelleftclose-88ecb3c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-panelleftclose-88ecb3c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;panelleftclose&quot;,&quot;loc&quot;:{&quot;line&quot;:200,&quot;column&quot;:15}}"/>
              <span className="text-xs" data-qoder-id="qel-text-xs-8383cc9a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-8383cc9a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;Sidebar&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:201,&quot;column&quot;:15}}">收起</span>
            </Button>
          </>
        )}
      </div>
    </motion.aside>
  )
}

const THEME_PRESETS = {
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

export default function App(qoderProps) {
  const [toolPanelOpen, setToolPanelOpen] = useState(true)
  const [agentStatus, setAgentStatus] = useState('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [permissionRequest, setPermissionRequest] = useState(null)
  const [currentTheme, setCurrentTheme] = useState('dark')

  // Apply theme tokens to :root
  useEffect(() => {
    const tokens = THEME_PRESETS[currentTheme]
    if (!tokens) return
    const root = document.documentElement
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [currentTheme])

  // Demo: cycle through statuses
  useEffect(() => {
    const statuses = ['idle', 'thinking', 'executing', 'streaming', 'done', 'idle']
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % statuses.length
      const status = statuses[index]
      setAgentStatus(status)

      // Show permission prompt when entering 'executing'
      if (status === 'executing') {
        setPermissionRequest({
          title: 'Agent 请求写入文件',
          description: '将修改 src/utils/auth.ts，添加 token 过期验证和黑名单检查逻辑。此操作会覆盖原有文件内容。',
          type: 'file_write',
          risk: 'medium',
          command: 'write_file src/utils/auth.ts (+18/-7 lines)',
        })
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = (message) => {
    setAgentStatus('thinking')
    setTimeout(() => setAgentStatus('executing'), 1500)
    setTimeout(() => setAgentStatus('streaming'), 3000)
    setTimeout(() => setAgentStatus('done'), 5000)
    setTimeout(() => setAgentStatus('idle'), 7000)
  }

  return (
    <div
      className={["flex h-screen w-screen overflow-hidden", qoderProps?.className].filter(Boolean).join(" ")}
      data-component="App"
      data-od-id="app-root"
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Left Sidebar */}
      <Sidebar
        onOpenSettings={() => setSettingsOpen(true)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
       data-qoder-id="qel-sidebar-0db8b095" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-sidebar-0db8b095&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;sidebar&quot;,&quot;loc&quot;:{&quot;line&quot;:296,&quot;column&quot;:7}}"/>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" data-component="MainArea" data-od-id="chat-main" data-qoder-id="qel-mainarea-c50be21f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mainarea-c50be21f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;mainarea&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:7}}">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border-subtle)]"
          data-component="TopBar"
          data-od-id="status-bar"
         data-qoder-id="qel-topbar-ff18eff6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-topbar-ff18eff6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;topbar&quot;,&quot;loc&quot;:{&quot;line&quot;:305,&quot;column&quot;:9}}">
          <div className="flex items-center gap-4" data-qoder-id="qel-flex-4c635202" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-4c635202&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:11}}">
            <div className="flex items-center gap-2" data-qoder-id="qel-flex-47634a23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-47634a23&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:311,&quot;column&quot;:13}}">
              <Hash size={14} className="text-[var(--seed-muted)]"  data-qoder-id="qel-text-var-seed-muted-bd6f8251" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-var-seed-muted-bd6f8251&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-var-seed-muted&quot;,&quot;loc&quot;:{&quot;line&quot;:312,&quot;column&quot;:15}}"/>
              <h2 className="text-sm font-medium tracking-[-0.01em]" data-qoder-id="qel-text-sm-b8b08acb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-b8b08acb&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:313,&quot;column&quot;:15}}">分析认证逻辑安全漏洞</h2>
            </div>
            <StatusIndicator status={agentStatus} size="md"  data-qoder-id="qel-statusindicator-f42ffd8c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-statusindicator-f42ffd8c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;statusindicator&quot;,&quot;loc&quot;:{&quot;line&quot;:315,&quot;column&quot;:13}}"/>
          </div>

          <div className="flex items-center gap-2" data-qoder-id="qel-flex-53635d07" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-53635d07&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:318,&quot;column&quot;:11}}">
            <Button
              variant={toolPanelOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={() => setToolPanelOpen(!toolPanelOpen)}
              title="工具面板"
             data-qoder-id="qel-button-ce9ce8fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-ce9ce8fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:319,&quot;column&quot;:13}}">
              <PanelRight size={16}  data-qoder-id="qel-panelright-9985de1e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-panelright-9985de1e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;panelright&quot;,&quot;loc&quot;:{&quot;line&quot;:325,&quot;column&quot;:15}}"/>
            </Button>
          </div>
        </header>

        {/* Chat + Input */}
        <div className="flex-1 flex flex-col min-h-0" data-qoder-id="qel-flex-1-29e8a1d9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-29e8a1d9&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:331,&quot;column&quot;:9}}">
          <div className="flex-1 overflow-hidden" data-qoder-id="qel-flex-1-26e89d20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-26e89d20&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:332,&quot;column&quot;:11}}">
            <ChatPanel agentStatus={agentStatus}  data-qoder-id="qel-chatpanel-9d776f0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-chatpanel-9d776f0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;chatpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:333,&quot;column&quot;:13}}"/>
          </div>
          <PermissionPrompt
            isVisible={!!permissionRequest}
            permission={permissionRequest}
            onAllow={() => {
              setPermissionRequest(null)
              setAgentStatus('streaming')
            }}
            onDeny={() => {
              setPermissionRequest(null)
              setAgentStatus('idle')
            }}
           data-qoder-id="qel-permissionprompt-d56a86e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-permissionprompt-d56a86e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;permissionprompt&quot;,&quot;loc&quot;:{&quot;line&quot;:335,&quot;column&quot;:11}}"/>
          <CommandInput onSend={handleSend} agentStatus={agentStatus}  data-qoder-id="qel-commandinput-b6abb5b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-commandinput-b6abb5b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;commandinput&quot;,&quot;loc&quot;:{&quot;line&quot;:347,&quot;column&quot;:11}}"/>
        </div>
      </main>

      {/* Right Tool Panel */}
      <ToolPanel isOpen={toolPanelOpen} onToggle={() => setToolPanelOpen(false)}  data-qoder-id="qel-toolpanel-ca7e67ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-toolpanel-ca7e67ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;toolpanel&quot;,&quot;loc&quot;:{&quot;line&quot;:352,&quot;column&quot;:7}}"/>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} theme={currentTheme} onThemeChange={setCurrentTheme}  data-qoder-id="qel-settingsmodal-ee2816c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-settingsmodal-ee2816c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;settingsmodal&quot;,&quot;loc&quot;:{&quot;line&quot;:355,&quot;column&quot;:7}}"/>
    </div>
  )
}
