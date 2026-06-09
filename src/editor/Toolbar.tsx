import { useState } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import type { ToolType, ZoomLevel } from '@/types/editor'
import type { ExportFormat } from '@/utils/download'

interface ToolbarProps {
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onDownload: (format: ExportFormat) => void
  onResetCrop: () => void
}

const TOOLS: { id: ToolType; label: string; shortcut: string; icon: string }[] = [
  { id: 'selection', label: 'Select', shortcut: 'S', icon: '⬚' },
  { id: 'crop', label: 'Crop', shortcut: 'C', icon: '✂' },
  { id: 'text', label: 'Text', shortcut: 'T', icon: 'T' },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: '→' },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: '▭' },
  { id: 'circle', label: 'Circle', shortcut: 'O', icon: '○' },
  { id: 'highlight', label: 'Highlight', shortcut: 'H', icon: '▓' },
  { id: 'blur', label: 'Blur', shortcut: 'B', icon: '◎' },
]

const ZOOM_OPTIONS: ZoomLevel[] = [50, 100, 150, 200, 'fit']

function ToolButton({
  active,
  label,
  shortcut,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  shortcut: string
  icon: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} (${shortcut})`}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
      }`}
    >
      {icon}
    </button>
  )
}

export default function Toolbar({ onUndo, onRedo, onCopy, onDownload, onResetCrop }: ToolbarProps) {
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const cropRect = useEditorStore((s) => s.cropRect)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  return (
    <header
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center gap-0.5">
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            active={activeTool === tool.id}
            label={tool.label}
            shortcut={tool.shortcut}
            icon={tool.icon}
            onClick={() => setActiveTool(tool.id)}
          />
        ))}
      </div>

      <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className="flex h-8 w-8 items-center justify-center rounded-md text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
        className="flex h-8 w-8 items-center justify-center rounded-md text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        ↷
      </button>

      <div className="mx-2 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

      <button
        type="button"
        onClick={onCopy}
        title="Copy (Ctrl+C)"
        aria-label="Copy to clipboard"
        className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Copy
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDownloadMenu((v) => !v)}
          title="Download (Ctrl+S)"
          aria-label="Download"
          aria-expanded={showDownloadMenu}
          className="flex h-8 items-center gap-1 rounded-md px-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Download ▾
        </button>
        {showDownloadMenu && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[100px] rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {(['png', 'jpg', 'webp'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-sm uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  onDownload(fmt)
                  setShowDownloadMenu(false)
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        )}
      </div>

      {cropRect && (
        <button
          type="button"
          onClick={onResetCrop}
          className="ml-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Reset crop
        </button>
      )}

      <div className="flex-1" />

      <select
        value={String(zoomLevel)}
        onChange={(e) => {
          const val = e.target.value
          setZoomLevel(val === 'fit' ? 'fit' : (Number(val) as ZoomLevel))
        }}
        aria-label="Zoom level"
        className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {ZOOM_OPTIONS.map((z) => (
          <option key={String(z)} value={String(z)}>
            {z === 'fit' ? 'Fit Screen' : `${z}%`}
          </option>
        ))}
      </select>
    </header>
  )
}
