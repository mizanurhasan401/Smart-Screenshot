import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  label: string
  description?: string
  shortcut?: string
  children: ReactNode
  side?: 'top' | 'bottom'
}

const GAP = 8

export default function Tooltip({
  label,
  description,
  shortcut,
  children,
  side = 'bottom',
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()

    let top = 0
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2

    if (side === 'top') {
      top = rect.top - tooltipRect.height - GAP
    } else {
      top = rect.bottom + GAP
    }

    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8))
    top = Math.max(8, top)

    setCoords({ top, left })
  }, [side])

  useLayoutEffect(() => {
    if (visible) updatePosition()
  }, [visible, updatePosition, label, description, shortcut])

  useEffect(() => {
    if (!visible) return

    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [visible, updatePosition])

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        <div aria-describedby={visible ? id : undefined}>{children}</div>
      </div>
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className="pointer-events-none fixed z-[9999] w-max max-w-[220px] rounded-lg bg-zinc-900 px-2.5 py-2 text-left shadow-lg dark:bg-zinc-800"
          >
            <p className="text-xs font-semibold text-white">{label}</p>
            {description && (
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-300">{description}</p>
            )}
            {shortcut && (
              <p className="mt-1 text-[10px] text-zinc-400">Shortcut: {shortcut}</p>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
