import * as React from 'react'
import { cn } from '@/lib/utils'

const Tooltip = React.forwardRef(({ children, content, className, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      ref={ref}
      {...props}
     data-qoder-id="qel-relative-c1839f91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-relative-c1839f91&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ui/tooltip.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;relative&quot;,&quot;loc&quot;:{&quot;line&quot;:8,&quot;column&quot;:5}}">
      {children}
      {isVisible && content && (
        <div
          className={cn(
            'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md',
            'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]',
            'text-[10px] text-[var(--seed-fg)] whitespace-nowrap z-50',
            'animate-fade-in',
            className
          )}
         data-qoder-id="qel-div-ee57b6cb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-ee57b6cb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/ui/tooltip.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:17,&quot;column&quot;:9}}">
          {content}
        </div>
      )}
    </div>
  )
})
Tooltip.displayName = 'Tooltip'

export { Tooltip }
