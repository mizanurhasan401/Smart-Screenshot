import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getPanToolShortcutHint, getShortcutLabel, getToolShortcut } from '@/constants/shortcuts'
import ObjectPropertiesBar from '@/editor/ObjectPropertiesBar'
import AppIcon from '@/editor/ui/AppIcon'
import IconButton from '@/editor/ui/IconButton'
import ShortcutsSheet from '@/editor/ui/ShortcutsSheet'
import ZoomControls from '@/editor/ui/ZoomControls'
import {
  ArrowIcon,
  BlurIcon,
  CheckIcon,
  CircleIcon,
  CopyIcon,
  CropIcon,
  DownloadIcon,
  HighlightIcon,
  InfoIcon,
  PanIcon,
  PenIcon,
  RectIcon,
  RedoIcon,
  ResetIcon,
  SelectIcon,
  TextIcon,
  UndoIcon,
} from '@/editor/ui/ToolbarIcons'
import Tooltip from '@/editor/ui/Tooltip'
import { useEditorStore } from '@/store/useEditorStore'
import type { ToolType } from '@/types/editor'
import type { ExportFormat } from '@/utils/download'

interface ToolbarProps {
  onUndo: () => void
  onRedo: () => void
  onCopy: () => boolean | Promise<boolean>
  onDownload: (format: ExportFormat) => void
  onResetCrop: () => void
  onChangeComplete: () => void
  showShortcuts: boolean
  onShortcutsOpenChange: (open: boolean) => void
}

interface ToolDef {
  id: ToolType
  label: string
  description: string
  shortcut: string
  icon: ReactNode
}

const TOOLS: ToolDef[] = [
  {
    id: 'selection',
    label: 'Select',
    description: 'Click and move annotations on the image',
    shortcut: getToolShortcut('selection'),
    icon: <SelectIcon />,
  },
  {
    id: 'pan',
    label: 'Move',
    description: 'Drag to move only the screenshot image, or hold Ctrl and drag anytime',
    shortcut: getPanToolShortcutHint(),
    icon: <PanIcon />,
  },
  {
    id: 'crop',
    label: 'Crop',
    description: 'Drag to keep only the area you need',
    shortcut: getToolShortcut('crop'),
    icon: <CropIcon />,
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Click to add editable text labels',
    shortcut: getToolShortcut('text'),
    icon: <TextIcon />,
  },
  {
    id: 'pen',
    label: 'Pen',
    description: 'Draw freehand',
    shortcut: getToolShortcut('pen'),
    icon: <PenIcon />,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    description: 'Draw arrows to point at details',
    shortcut: getToolShortcut('arrow'),
    icon: <ArrowIcon />,
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Draw rectangular outlines',
    shortcut: getToolShortcut('rectangle'),
    icon: <RectIcon />,
  },
  {
    id: 'circle',
    label: 'Circle',
    description: 'Draw circular outlines',
    shortcut: getToolShortcut('circle'),
    icon: <CircleIcon />,
  },
  {
    id: 'highlight',
    label: 'Highlight',
    description: 'Mark important areas with color',
    shortcut: getToolShortcut('highlight'),
    icon: <HighlightIcon />,
  },
  {
    id: 'blur',
    label: 'Blur',
    description: 'Hide sensitive content',
    shortcut: getToolShortcut('blur'),
    icon: <BlurIcon />,
  },
]

const DOWNLOAD_FORMATS: ExportFormat[] = ['png', 'jpg', 'webp']
const COPIED_FEEDBACK_MS = 2000

function Divider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
}

export default function Toolbar({
  onUndo,
  onRedo,
  onCopy,
  onDownload,
  onResetCrop,
  onChangeComplete,
  showShortcuts,
  onShortcutsOpenChange,
}: ToolbarProps) {
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const cropRect = useEditorStore((s) => s.cropRect)

  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 })

  const downloadTriggerRef = useRef<HTMLDivElement>(null)
  const downloadMenuRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateMenuPosition = useCallback(() => {
    const trigger = downloadTriggerRef.current
    const menu = downloadMenuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const menuRect = menu.getBoundingClientRect()
    let left = rect.left
    let top = rect.bottom + 4

    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8))
    if (top + menuRect.height > window.innerHeight - 8) {
      top = rect.top - menuRect.height - 4
    }

    setMenuCoords({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (showDownloadMenu) updateMenuPosition()
  }, [showDownloadMenu, updateMenuPosition])

  useEffect(() => {
    if (!showDownloadMenu) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        downloadTriggerRef.current?.contains(target) ||
        downloadMenuRef.current?.contains(target)
      ) {
        return
      }
      setShowDownloadMenu(false)
    }

    const onScrollOrResize = () => updateMenuPosition()
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [showDownloadMenu, updateMenuPosition])

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    const ok = await onCopy()
    if (!ok) return

    setCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  return (
    <header
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950 sm:px-3"
    >
      <AppIcon size={28} alt="Chrome Screenshot Pro" className="mr-0.5 hidden sm:block" />

      <div className="flex shrink-0 items-center gap-1 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-0.5">
          {TOOLS.map((tool) => (
            <IconButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              shortcut={tool.shortcut}
              active={activeTool === tool.id}
              onClick={() => setActiveTool(tool.id)}
            />
          ))}
        </div>

        <Divider />

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            icon={<UndoIcon />}
            label="Undo"
            description="Undo your last change"
            shortcut={getShortcutLabel('undo')}
            disabled={!canUndo}
            onClick={onUndo}
          />
          <IconButton
            icon={<RedoIcon />}
            label="Redo"
            description="Redo an undone change"
            shortcut={getShortcutLabel('redo')}
            disabled={!canRedo}
            onClick={onRedo}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center overflow-x-auto px-2">
        <ObjectPropertiesBar onChangeComplete={onChangeComplete} />
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <IconButton
          icon={copied ? <CheckIcon /> : <CopyIcon />}
          label={copied ? 'Copied' : 'Copy'}
          description={
            copied ? 'Image copied to clipboard' : 'Copy the edited image to clipboard'
          }
          shortcut={getShortcutLabel('copy')}
          className={
            copied
              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-600 dark:hover:bg-emerald-600'
              : ''
          }
          dismissTooltipOnClick
          onClick={handleCopy}
        />

        <div ref={downloadTriggerRef} className="inline-flex">
          <IconButton
            icon={<DownloadIcon />}
            label="Download"
            description="Save the edited image to your computer"
            shortcut={getShortcutLabel('download')}
            active={showDownloadMenu}
            dismissTooltipOnClick
            onClick={() => setShowDownloadMenu((v) => !v)}
          />
        </div>

        {cropRect && (
          <Tooltip
            label="Reset crop"
            description="Remove the crop and show the full screenshot again"
          >
            <button
              type="button"
              onClick={onResetCrop}
              className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ResetIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Reset crop</span>
            </button>
          </Tooltip>
        )}

        <IconButton
          icon={<InfoIcon />}
          label="Keyboard shortcuts"
          description="View all keyboard shortcuts"
          shortcut={getShortcutLabel('shortcuts-help')}
          active={showShortcuts}
          dismissTooltipOnClick
          onClick={() => onShortcutsOpenChange(true)}
        />
      </div>

      {showDownloadMenu &&
        createPortal(
          <div
            ref={downloadMenuRef}
            role="menu"
            aria-label="Download format"
            style={{ top: menuCoords.top, left: menuCoords.left }}
            className="fixed z-[10000] min-w-[108px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
          >
            {DOWNLOAD_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                role="menuitem"
                className="block w-full px-3 py-1.5 text-left text-sm font-medium uppercase tracking-wide text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  onDownload(fmt)
                  setShowDownloadMenu(false)
                }}
              >
                {fmt}
              </button>
            ))}
          </div>,
          document.body,
        )}

      <ZoomControls />

      <ShortcutsSheet
        open={showShortcuts}
        onClose={() => onShortcutsOpenChange(false)}
      />
    </header>
  )
}
