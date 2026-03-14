import type * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomSidebarTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  labelOpen?: string
  labelClosed?: string
}

export function CustomSidebarTriggerAlt({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = false,
  labelOpen = 'Close Sidebar',
  labelClosed = 'Open Sidebar',
  ...props
}: CustomSidebarTriggerProps) {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isOpen = state === 'expanded'

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleSidebar}
      className={cn(
        'cursor-pointer group relative',
        size !== 'icon' && 'w-fit',
        showLabel && 'w-fit',
        className,
      )}
      {...props}
    >
      <ChevronRight
        className={cn(
          'h-4 w-4 transition-transform duration-500 ease-in-out',
          isOpen ? 'rotate-180' : 'rotate-0',
        )}
      />

      {showLabel && (
        <span className="ml-2">{isOpen ? labelOpen : labelClosed}</span>
      )}

      <span className="sr-only">
        {isOpen ? 'Close sidebar' : 'Open sidebar'}
      </span>
    </Button>
  )
}
