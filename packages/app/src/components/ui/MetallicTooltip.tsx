import { type ReactNode, useState } from 'react'

interface MetallicTooltipProps {
  children: ReactNode
  content: ReactNode
  /**
   * If true, the tooltip logic is active and will show on hover.
   * If false, the tooltip is completely disabled (will not show).
   */
  shouldShow?: boolean
  /**
   * Alignment of the tooltip relative to the trigger.
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end'
}

export function MetallicTooltip({ children, content, shouldShow = true, align = 'center' }: MetallicTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Alignment classes
  const alignClasses = {
    start: 'left-0 -translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0 translate-x-0',
  }

  const arrowAlignClasses = {
    start: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-4',
  }

  if (!shouldShow) return <>{children}</>

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute bottom-full z-50 mb-2 w-48 rounded-md border border-amber-500/30 bg-black/95 p-3 text-amber-100 text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-md ${alignClasses[align]}`}
        >
          <div className="relative z-10 text-center leading-relaxed">{content}</div>
          {/* Arrow */}
          <div
            className={`-mt-1 absolute top-full h-2 w-2 rotate-45 border-amber-500/30 border-r border-b bg-black/95 ${arrowAlignClasses[align]}`}
          />
        </div>
      )}
    </div>
  )
}
