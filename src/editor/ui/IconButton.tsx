import type { ReactNode } from 'react'
import Tooltip from '@/editor/ui/Tooltip'

interface IconButtonProps {
  icon: ReactNode
  label: string
  description?: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md'
  tooltipSide?: 'top' | 'bottom'
}

export default function IconButton({
  icon,
  label,
  description,
  shortcut,
  active = false,
  disabled = false,
  onClick,
  className = '',
  size = 'md',
  tooltipSide = 'bottom',
}: IconButtonProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'

  return (
    <Tooltip label={label} description={description} shortcut={shortcut} side={tooltipSide}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={`flex shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${sizeClass} ${
          active
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
        } disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
      >
        {icon}
      </button>
    </Tooltip>
  )
}
