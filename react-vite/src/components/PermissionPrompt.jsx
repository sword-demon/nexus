import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Check, X, Terminal, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const PERMISSION_ICONS = {
  file_write: FileText,
  execute: Terminal,
  dangerous: AlertTriangle,
  default: ShieldAlert,
}

const RISK_LEVELS = {
  low: {
    label: '低风险',
    color: 'var(--seed-primary)',
    bgClass: 'bg-[color-mix(in_srgb,var(--seed-primary)_8%,transparent)]',
    borderClass: 'border-[color-mix(in_srgb,var(--seed-primary)_25%,transparent)]',
  },
  medium: {
    label: '中风险',
    color: 'var(--seed-accent)',
    bgClass: 'bg-[color-mix(in_srgb,var(--seed-accent)_6%,transparent)]',
    borderClass: 'border-[color-mix(in_srgb,var(--seed-accent)_20%,transparent)]',
  },
  high: {
    label: '高风险',
    color: 'var(--seed-accent)',
    bgClass: 'bg-[color-mix(in_srgb,var(--seed-accent)_10%,transparent)]',
    borderClass: 'border-[color-mix(in_srgb,var(--seed-accent)_35%,transparent)]',
  },
}

export default function PermissionPrompt({ isVisible, permission, onAllow, onDeny }) {
  if (!permission) return null

  const Icon = PERMISSION_ICONS[permission.type] || PERMISSION_ICONS.default
  const risk = RISK_LEVELS[permission.risk || 'low']

  return (
    <AnimatePresence data-qoder-id="qel-animatepresence-cadb554a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-animatepresence-cadb554a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;animatepresence&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:5}}">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'mx-5 mb-2 rounded-[var(--seed-radius)] border overflow-hidden',
            risk.bgClass,
            risk.borderClass
          )}
          data-component="PermissionPrompt"
          data-od-id="permission-prompt"
         data-qoder-id="qel-permissionprompt-0992da0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-permissionprompt-0992da0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;permissionprompt&quot;,&quot;loc&quot;:{&quot;line&quot;:43,&quot;column&quot;:9}}">
          {/* Header Row */}
          <div className="flex items-start gap-3 px-4 pt-3 pb-2" data-qoder-id="qel-flex-577764e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-577764e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:57,&quot;column&quot;:11}}">
            {/* Icon */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
              style={{ backgroundColor: `color-mix(in srgb, ${risk.color} 15%, transparent)` }}
             data-qoder-id="qel-flex-shrink-0-75bb6d7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-shrink-0-75bb6d7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;flex-shrink-0&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:13}}">
              <Icon size={16} style={{ color: risk.color }}  data-qoder-id="qel-icon-20f3fe50" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-icon-20f3fe50&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;icon&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:15}}"/>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0" data-qoder-id="qel-flex-1-45070b11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-1-45070b11&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;flex-1&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:13}}">
              <div className="flex items-center gap-2 mb-1" data-qoder-id="qel-flex-5b776b2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-5b776b2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:68,&quot;column&quot;:15}}">
                <h4 className="text-sm font-medium text-[var(--seed-fg)]" data-qoder-id="qel-text-sm-d3f11ce5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-sm-d3f11ce5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-sm&quot;,&quot;loc&quot;:{&quot;line&quot;:69,&quot;column&quot;:17}}">
                  {permission.title}
                </h4>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-[0.06em]"
                  style={{
                    color: risk.color,
                    backgroundColor: `color-mix(in srgb, ${risk.color} 12%, transparent)`,
                  }}
                 data-qoder-id="qel-text-9px-d24c4ab7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-9px-d24c4ab7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-9px&quot;,&quot;loc&quot;:{&quot;line&quot;:72,&quot;column&quot;:17}}">
                  {risk.label}
                </span>
              </div>
              <p className="text-[12px] text-[var(--seed-muted)] leading-relaxed" data-qoder-id="qel-text-12px-63bedb01" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-12px-63bedb01&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-12px&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:15}}">
                {permission.description}
              </p>

              {/* Command/Detail Preview */}
              {permission.command && (
                <div className="mt-2 px-2.5 py-1.5 rounded-md bg-[color-mix(in_srgb,var(--seed-bg)_60%,var(--seed-surface)_40%)] border border-[var(--color-border-subtle)]" data-qoder-id="qel-mt-2-94db8362" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-mt-2-94db8362&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;mt-2&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:17}}">
                  <code className="text-[11px] font-mono text-[var(--seed-fg)]" data-qoder-id="qel-text-11px-9bc45b15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-9bc45b15&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:19}}">
                    {permission.command}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-1" data-qoder-id="qel-flex-0bf90b6f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-flex-0bf90b6f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;flex&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:11}}">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeny}
              className="gap-1.5 text-[var(--seed-muted)] hover:text-[var(--seed-accent)]"
             data-qoder-id="qel-gap-1-5-afe22e58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-afe22e58&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:13}}">
              <X size={13}  data-qoder-id="qel-x-6b345c45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-x-6b345c45&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;x&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:15}}"/>
              <span className="text-xs" data-qoder-id="qel-text-xs-249216f3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-249216f3&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:15}}">拒绝</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onAllow}
              className="gap-1.5"
             data-qoder-id="qel-gap-1-5-b2e23311" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-gap-1-5-b2e23311&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;gap-1-5&quot;,&quot;loc&quot;:{&quot;line&quot;:108,&quot;column&quot;:13}}">
              <Check size={13}  data-qoder-id="qel-check-748868de" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-check-748868de&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;check&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:15}}"/>
              <span className="text-xs" data-qoder-id="qel-text-xs-31922b6a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-xs-31922b6a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PermissionPrompt.jsx&quot;,&quot;componentName&quot;:&quot;PermissionPrompt&quot;,&quot;elementRole&quot;:&quot;text-xs&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:15}}">允许</span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
