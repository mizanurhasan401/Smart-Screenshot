import { getShortcutLabel } from '@/constants/shortcuts'
import IconButton from '@/editor/ui/IconButton'
import { FitIcon, MinusIcon, PlusIcon } from '@/editor/ui/ToolbarIcons'
import { useEditorStore } from '@/store/useEditorStore'
import { ZOOM_MAX, ZOOM_MIN } from '@/types/editor'

export default function ZoomControls() {
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const zoomIn = useEditorStore((s) => s.zoomIn)
  const zoomOut = useEditorStore((s) => s.zoomOut)
  const zoomFit = useEditorStore((s) => s.zoomFit)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)

  const isFit = zoomLevel === 'fit'
  const canZoomOut = !isFit ? zoomLevel > ZOOM_MIN : true
  const canZoomIn = !isFit ? zoomLevel < ZOOM_MAX : true

  const label = isFit ? 'Fit' : `${zoomLevel}%`

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-900">
      <IconButton
        icon={<MinusIcon />}
        label="Zoom out"
        description="Make the screenshot smaller"
        shortcut={`${getShortcutLabel('zoom-out')} or ${getShortcutLabel('zoom-scroll')}`}
        size="sm"
        disabled={!canZoomOut && isFit}
        onClick={zoomOut}
      />
      <button
        type="button"
        onClick={() => setZoomLevel(100)}
        title="Reset to 100% zoom"
        className="min-w-12 rounded px-1.5 py-1 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {label}
      </button>
      <IconButton
        icon={<PlusIcon />}
        label="Zoom in"
        description="Make the screenshot larger"
        shortcut={`${getShortcutLabel('zoom-in')} or ${getShortcutLabel('zoom-scroll')}`}
        size="sm"
        disabled={!canZoomIn}
        onClick={zoomIn}
      />
      <IconButton
        icon={<FitIcon className="h-4 w-4" />}
        label="Fit to screen"
        description="Resize screenshot to fit the editor window"
        shortcut={getShortcutLabel('zoom-fit')}
        size="sm"
        active={isFit}
        onClick={zoomFit}
      />
    </div>
  )
}
