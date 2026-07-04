import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  idle: {
    color: 'var(--seed-muted)',
    label: '就绪',
    description: '等待输入',
  },
  thinking: {
    color: 'var(--seed-primary)',
    label: '思考中',
    description: '分析问题...',
  },
  streaming: {
    color: 'var(--seed-primary)',
    label: '输出中',
    description: '生成回复...',
  },
  executing: {
    color: 'var(--seed-accent)',
    label: '执行中',
    description: '调用工具...',
  },
  done: {
    color: 'var(--seed-primary)',
    label: '完成',
    description: '任务已完成',
  },
  error: {
    color: 'var(--seed-accent)',
    label: '错误',
    description: '执行出错',
  },
}

export default function StatusIndicator({ status = 'idle', size = 'md', ...qoderProps }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const isActive = status === 'thinking' || status === 'streaming' || status === 'executing'

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div
      className={[(cn(
        'flex items-center gap-2',
        size === 'sm' ? 'gap-1.5' : 'gap-2'
      )), qoderProps?.className].filter(Boolean).join(" ")}
      data-component="StatusIndicator"
      data-od-id="status-indicator"
     style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Animated Dot */}
      <div className="relative" data-qoder-id="qel-relative-e1789990" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-e1789990&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/StatusIndicator.jsx&quot;,&quot;componentName&quot;:&quot;StatusIndicator&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:53,&quot;column&quot;:7}}">
        <motion.div
          className={cn('rounded-full', dotSize)}
          style={{ backgroundColor: config.color }}
          animate={isActive ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
         data-qoder-id="qel-motion-div-c374339d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-c374339d&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/StatusIndicator.jsx&quot;,&quot;componentName&quot;:&quot;StatusIndicator&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:54,&quot;column&quot;:9}}"/>
        {isActive && (
          <motion.div
            className={cn('absolute inset-0 rounded-full', dotSize)}
            style={{ backgroundColor: config.color }}
            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
           data-qoder-id="qel-motion-div-bc742898" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-motion-div-bc742898&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/StatusIndicator.jsx&quot;,&quot;componentName&quot;:&quot;StatusIndicator&quot;,&quot;elementRole&quot;:&quot;motion-div&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:11}}"/>
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'font-medium tracking-[-0.01em]',
          size === 'sm' ? 'text-[11px]' : 'text-xs'
        )}
        style={{ color: config.color }}
       data-qoder-id="qel-span-0a145c0e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-0a145c0e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/StatusIndicator.jsx&quot;,&quot;componentName&quot;:&quot;StatusIndicator&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:7}}">
        {config.label}
      </span>

      {/* Description (only on md size) */}
      {size === 'md' && (
        <span className="text-[11px] text-[var(--seed-muted)]" data-qoder-id="qel-text-11px-263d2421" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-text-11px-263d2421&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/StatusIndicator.jsx&quot;,&quot;componentName&quot;:&quot;StatusIndicator&quot;,&quot;elementRole&quot;:&quot;text-11px&quot;,&quot;loc&quot;:{&quot;line&quot;:83,&quot;column&quot;:9}}">
          {config.description}
        </span>
      )}
    </div>
  )
}
