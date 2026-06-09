import { useMemo } from 'react'
import { getObjectBounds } from '@/editor/drawUtils'
import { useEditorStore } from '@/store/useEditorStore'
import type { AnnotationObject } from '@/types/editor'

interface FloatingToolbarProps {
  scale: number
  panOffset: { x: number; y: number }
  containerSize: { width: number; height: number }
  imageSize: { width: number; height: number }
  onChangeComplete: () => void
}

type ControlType =
  | 'color'
  | 'stroke'
  | 'fontSize'
  | 'fontFamily'
  | 'fontWeight'
  | 'opacity'
  | 'strength'
  | 'fill'
  | 'delete'

function getControlsForObject(obj: AnnotationObject): ControlType[] {
  switch (obj.type) {
    case 'arrow':
    case 'rectangle':
    case 'circle':
      return ['color', 'stroke', 'delete']
    case 'text':
      return ['color', 'fontSize', 'fontFamily', 'fontWeight', 'delete']
    case 'highlight':
      return ['color', 'opacity', 'delete']
    case 'blur':
      return ['strength', 'delete']
    default:
      return ['delete']
  }
}

export default function FloatingToolbar({
  scale,
  panOffset,
  containerSize,
  imageSize,
  onChangeComplete,
}: FloatingToolbarProps) {
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const objects = useEditorStore((s) => s.objects)
  const updateObject = useEditorStore((s) => s.updateObject)
  const removeObject = useEditorStore((s) => s.removeObject)

  const selected = useMemo(
    () => objects.find((o) => o.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  )

  if (!selected) return null

  const bounds = getObjectBounds(selected)
  if (!bounds) return null

  const offsetX = (containerSize.width - imageSize.width * scale) / 2 + panOffset.x
  const offsetY = (containerSize.height - imageSize.height * scale) / 2 + panOffset.y
  const left = offsetX + (bounds.x + bounds.width / 2) * scale
  const top = offsetY + bounds.y * scale - 44

  const controls = getControlsForObject(selected)

  return (
    <div
      role="toolbar"
      aria-label="Object properties"
      className="pointer-events-auto absolute z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
      style={{ left, top: Math.max(8, top) }}
    >
      {controls.includes('color') && 'color' in selected && (
        <input
          type="color"
          value={selected.color}
          aria-label="Color"
          onChange={(e) => updateObject(selected.id, { color: e.target.value })}
          onPointerUp={onChangeComplete}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      )}

      {controls.includes('stroke') && 'strokeWidth' in selected && (
        <input
          type="range"
          min={1}
          max={20}
          value={selected.strokeWidth}
          aria-label="Stroke width"
          onChange={(e) => updateObject(selected.id, { strokeWidth: Number(e.target.value) })}
          onPointerUp={onChangeComplete}
          className="w-16"
        />
      )}

      {controls.includes('fontSize') && selected.type === 'text' && (
        <input
          type="number"
          min={8}
          max={96}
          value={selected.fontSize}
          aria-label="Font size"
          onChange={(e) => updateObject(selected.id, { fontSize: Number(e.target.value) })}
          className="w-14 rounded border border-zinc-200 px-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
        />
      )}

      {controls.includes('fontFamily') && selected.type === 'text' && (
        <select
          value={selected.fontFamily}
          aria-label="Font family"
          onChange={(e) => updateObject(selected.id, { fontFamily: e.target.value })}
          className="rounded border border-zinc-200 px-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="Inter, system-ui, sans-serif">Inter</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="monospace">Monospace</option>
        </select>
      )}

      {controls.includes('fontWeight') && selected.type === 'text' && (
        <select
          value={selected.fontWeight}
          aria-label="Font weight"
          onChange={(e) => updateObject(selected.id, { fontWeight: Number(e.target.value) })}
          className="rounded border border-zinc-200 px-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value={400}>Regular</option>
          <option value={600}>Semi-bold</option>
          <option value={700}>Bold</option>
        </select>
      )}

      {controls.includes('opacity') && selected.type === 'highlight' && (
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.05}
          value={selected.opacity}
          aria-label="Opacity"
          onChange={(e) => updateObject(selected.id, { opacity: Number(e.target.value) })}
          className="w-16"
        />
      )}

      {controls.includes('strength') && selected.type === 'blur' && (
        <input
          type="range"
          min={2}
          max={30}
          value={selected.strength}
          aria-label="Blur strength"
          onChange={(e) => updateObject(selected.id, { strength: Number(e.target.value) })}
          className="w-16"
        />
      )}

      {(selected.type === 'rectangle' || selected.type === 'circle') && 'fillColor' in selected && (
        <input
          type="color"
          value={selected.fillColor ?? '#ffffff'}
          aria-label="Fill color"
          onChange={(e) =>
            updateObject(selected.id, {
              fillColor: e.target.value,
            })
          }
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
        />
      )}

      <button
        type="button"
        aria-label="Delete object"
        onClick={() => {
          removeObject(selected.id)
          onChangeComplete()
        }}
        className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </div>
  )
}
