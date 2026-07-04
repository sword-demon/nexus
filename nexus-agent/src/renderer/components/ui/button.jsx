import * as React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-[var(--seed-primary)] text-[var(--seed-bg)] hover:bg-[color-mix(in_srgb,var(--seed-primary)_85%,var(--seed-fg)_15%)]',
    accent: 'bg-[var(--seed-accent)] text-[var(--seed-fg)] hover:bg-[color-mix(in_srgb,var(--seed-accent)_85%,var(--seed-fg)_15%)] shadow-[0_2px_8px_var(--color-accent-glow)]',
    ghost: 'text-[var(--seed-muted)] hover:text-[var(--seed-fg)] hover:bg-[var(--color-bg-hover)]',
    outline: 'border border-[var(--color-border-subtle)] text-[var(--seed-fg)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--seed-border)]',
  }

  const sizes = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    icon: 'p-1.5',
    'icon-sm': 'p-1',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--seed-radius)] font-medium transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--seed-primary)] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
     style={props?.style} data-qoder-id={props?.["data-qoder-id"]} data-qoder-source={props?.["data-qoder-source"]}/>
  )
})
Button.displayName = 'Button'

export { Button }
