import { Fragment, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  formatKey,
  groupShortcuts,
  type ShortcutGroup,
  type ShortcutItem,
} from '@/constants/shortcuts'

interface ShortcutsSheetProps {
  open: boolean
  onClose: () => void
}

const GROUP_LABELS: Record<ShortcutGroup, string> = {
  Tools: 'Tools',
  History: 'History',
  Export: 'Export',
  Zoom: 'Zoom',
  Selection: 'Selection',
  Navigation: 'Navigation',
  General: 'General',
}

const GROUP_ORDER: ShortcutGroup[] = [
  'Tools',
  'History',
  'Export',
  'Zoom',
  'Selection',
  'Navigation',
  'General',
]

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
      {keys.map((key, i) => (
        <Fragment key={`${key}-${i}`}>
          {i > 0 && (
            <span className="px-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
              +
            </span>
          )}
          <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-zinc-200/80 bg-white px-1.5 font-mono text-[11px] font-semibold text-zinc-700 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
            {formatKey(key)}
          </kbd>
        </Fragment>
      ))}
    </span>
  )
}

function ShortcutRow({ item, compact = false }: { item: ShortcutItem; compact?: boolean }) {
  return (
    <li
      className={`flex items-center justify-between gap-3 rounded-lg transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
        }`}
    >
      <span className="min-w-0 truncate text-sm text-zinc-600 dark:text-zinc-300">
        {item.label}
      </span>
      <ShortcutKeys keys={item.keys} />
    </li>
  )
}

function ShortcutSection({
  group,
  items,
}: {
  group: ShortcutGroup
  items: ShortcutItem[]
}) {
  const isTools = group === 'Tools'

  return (
    <section className="flex flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-zinc-700/80 dark:bg-zinc-800/30">
      <h3 className="border-b border-zinc-200/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-700/80 dark:text-zinc-400">
        {GROUP_LABELS[group]}
      </h3>
      <ul
        className={
          isTools
            ? 'grid grid-cols-1 gap-0.5 p-1.5 min-[420px]:grid-cols-2 lg:grid-cols-3'
            : 'flex flex-col gap-0.5 p-1.5'
        }
      >
        {items.map((item) => (
          <ShortcutRow key={item.id} item={item} compact={isTools} />
        ))}
      </ul>
    </section>
  )
}

export default function ShortcutsSheet({ open, onClose }: ShortcutsSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const grouped = groupShortcuts()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm transition-opacity"
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-sheet-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 sm:max-h-[min(88dvh,750px)] sm:rounded-2xl"
      >
        <div className="shrink-0 border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-4 py-4 dark:border-zinc-700 dark:from-zinc-800/80 dark:to-zinc-900 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="shortcuts-sheet-title"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                Keyboard shortcuts
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Press{' '}
                <kbd className="rounded border border-zinc-200 bg-white px-1 py-px font-mono text-[10px] font-semibold dark:border-zinc-600 dark:bg-zinc-800">
                  ?
                </kbd>{' '}
                anytime to open or close this panel
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {GROUP_ORDER.map((group) => {
              const items = grouped.get(group)
              if (!items?.length) return null

              if (group === 'Tools') {
                return (
                  <div key={group} className="md:col-span-2">
                    <ShortcutSection group={group} items={items} />
                  </div>
                )
              }

              return <ShortcutSection key={group} group={group} items={items} />
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-200 px-4 py-2.5 dark:border-zinc-700 sm:px-5">
          <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            {typeof navigator !== 'undefined' &&
              /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
              ? '⌘ = Command key'
              : 'Ctrl = Control key'}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
