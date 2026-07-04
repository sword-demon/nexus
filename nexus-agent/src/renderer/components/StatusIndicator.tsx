import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type StatusKey = 'idle' | 'thinking' | 'streaming' | 'executing' | 'done' | 'error' | 'awaiting-permission'

interface StatusConfig {
  color: string
  label: string
  description: string
}

const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
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
  'awaiting-permission': {
    color: 'var(--seed-accent)',
    label: '待授权',
    description: '等待用户确认...',
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

interface StatusIndicatorProps {
  status?: StatusKey
  size?: 'sm' | 'md'
  className?: string
  style?: React.CSSProperties
  'data-qoder-id'?: string
  'data-qoder-source'?: string
}

export default function StatusIndicator({
  status = 'idle',
  size = 'md',
  className,
  style,
  ...qoderProps
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const isActive = status === 'thinking' || status === 'streaming' || status === 'executing'

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        size === 'sm' ? 'gap-1.5' : 'gap-2',
        className
      )}
      data-component="StatusIndicator"
      data-od-id="status-indicator"
      style={style}
      data-qoder-id={qoderProps['data-qoder-id']}
      data-qoder-source={qoderProps['data-qoder-source']}>
      {/* Animated Dot */}
      <div>
        <motion.div
          className={cn('rounded-full', dotSize)}
          style={{ backgroundColor: config.color }}
          animate={isActive ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] } : {}}
          transition={isActive ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : {}}
        />
        {isActive && (
          <motion.div
            className={cn('absolute inset-0 rounded-full', dotSize)}
            style={{ backgroundColor: config.color }}
            animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'font-medium tracking-[-0.01em]',
          size === 'sm' ? 'text-[11px]' : 'text-xs'
        )}
        style={{ color: config.color }}>
        {config.label}
      </span>

      {/* Description (only on md size) */}
      {size === 'md' && (
        <span className="text-[11px] text-[var(--seed-muted)]">
          {config.description}
        </span>
      )}
    </div>
  )
}
