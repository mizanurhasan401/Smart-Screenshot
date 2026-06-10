import { useState, type ReactNode } from 'react'
import IconButton from '@/editor/ui/IconButton'
import ZoomControls from '@/editor/ui/ZoomControls'
import {
  ArrowIcon,
  BlurIcon,
  CircleIcon,
  CopyIcon,
  CropIcon,
  DownloadIcon,
  HighlightIcon,
  PanIcon,
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
  onCopy: () => void
  onDownload: (format: ExportFormat) => void
  onResetCrop: () => void
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
    shortcut: 'S',
    icon: <SelectIcon />,
  },
  {
    id: 'pan',
    label: 'Move',
    description: 'Drag to move only the screenshot image, or hold Ctrl and drag anytime',
    shortcut: 'P or Ctrl + Drag',
    icon: <PanIcon />,
  },
  {
    id: 'crop',
    label: 'Crop',
    description: 'Drag to keep only the area you need',
    shortcut: 'C',
    icon: <CropIcon />,
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Click to add editable text labels',
    shortcut: 'T',
    icon: <TextIcon />,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    description: 'Draw arrows to point at details',
    shortcut: 'A',
    icon: <ArrowIcon />,
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    description: 'Draw rectangular outlines',
    shortcut: 'R',
    icon: <RectIcon />,
  },
  {
    id: 'circle',
    label: 'Circle',
    description: 'Draw circular outlines',
    shortcut: 'O',
    icon: <CircleIcon />,
  },
  {
    id: 'highlight',
    label: 'Highlight',
    description: 'Mark important areas with color',
    shortcut: 'H',
    icon: <HighlightIcon />,
  },
  {
    id: 'blur',
    label: 'Blur',
    description: 'Hide sensitive content',
    shortcut: 'B',
    icon: <BlurIcon />,
  },
]

function Divider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />
}

export default function Toolbar({ onUndo, onRedo, onCopy, onDownload, onResetCrop }: ToolbarProps) {
  const activeTool = useEditorStore((s) => s.activeTool)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const cropRect = useEditorStore((s) => s.cropRect)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  return (
    <header
      role="toolbar"
      aria-label="Editor toolbar"
      className="flex h-12 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-950 sm:px-3"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
            shortcut="Ctrl + Z"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <IconButton
            icon={<RedoIcon />}
            label="Redo"
            description="Redo an undone change"
            shortcut="Ctrl + Shift + Z"
            disabled={!canRedo}
            onClick={onRedo}
          />
        </div>

        <Divider />

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            icon={<CopyIcon />}
            label="Copy"
            description="Copy the edited image to clipboard"
            shortcut="Ctrl + C"
            onClick={onCopy}
          />

          <div className="relative">
            <IconButton
              icon={<DownloadIcon />}
              label="Download"
              description="Save the edited image to your computer"
              shortcut="Ctrl + S"
              onClick={() => setShowDownloadMenu((v) => !v)}
            />
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
            <Tooltip
              label="Reset crop"
              description="Remove the crop and show the full screenshot again"
            >
              <button
                type="button"
                onClick={onResetCrop}
                className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ResetIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Reset crop</span>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <ZoomControls />
    </header>
  )
}
