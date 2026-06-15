import { useMemo, type ReactNode } from 'react'
import { getShortcutLabel } from '@/constants/shortcuts'
import IconButton from '@/editor/ui/IconButton'
import { DeleteIcon } from '@/editor/ui/ToolbarIcons'
import Tooltip from '@/editor/ui/Tooltip'
import { useEditorStore } from '@/store/useEditorStore'
import type { AnnotationObject } from '@/types/editor'

interface ObjectPropertiesBarProps {
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
      return ['color', 'stroke', 'fill', 'delete']
    case 'pen':
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

const controlInputClass =
  'rounded border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-900 scheme-light dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:scheme-dark'

function LabeledControl({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  return (
    <Tooltip label={label} description={description}>
      <div className="flex items-center">{children}</div>
    </Tooltip>
  )
}

export default function ObjectPropertiesBar({ onChangeComplete }: ObjectPropertiesBarProps) {
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const objects = useEditorStore((s) => s.objects)
  const updateObject = useEditorStore((s) => s.updateObject)
  const removeObject = useEditorStore((s) => s.removeObject)

  const selected = useMemo(
    () => objects.find((o) => o.id === selectedObjectId) ?? null,
    [objects, selectedObjectId],
  )

  if (!selected) return null

  const controls = getControlsForObject(selected)

  return (
    <div
      role="toolbar"
      aria-label="Object properties"
      className="flex shrink-0 items-center gap-2"
    >
      {controls.includes('color') && 'color' in selected && (
        <LabeledControl label="Color" description="Change the stroke or text color">
          <input
            type="color"
            value={selected.color}
            aria-label="Color"
            onChange={(e) => updateObject(selected.id, { color: e.target.value })}
            onPointerUp={onChangeComplete}
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
          />
        </LabeledControl>
      )}

      {controls.includes('stroke') && 'strokeWidth' in selected && (
        <LabeledControl label="Stroke width" description="Adjust the line thickness">
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
        </LabeledControl>
      )}

      {controls.includes('fontSize') && selected.type === 'text' && (
        <LabeledControl label="Font size" description="Change the text size in pixels">
          <input
            type="number"
            min={8}
            max={96}
            value={selected.fontSize}
            aria-label="Font size"
            onChange={(e) => updateObject(selected.id, { fontSize: Number(e.target.value) })}
            className={`w-14 ${controlInputClass}`}
          />
        </LabeledControl>
      )}

      {controls.includes('fontFamily') && selected.type === 'text' && (
        <LabeledControl label="Font family" description="Choose the text font style">
          <select
            value={selected.fontFamily}
            aria-label="Font family"
            onChange={(e) => updateObject(selected.id, { fontFamily: e.target.value })}
            className={controlInputClass}
          >
            <option value="Inter, system-ui, sans-serif">Inter</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="monospace">Monospace</option>
          </select>
        </LabeledControl>
      )}

      {controls.includes('fontWeight') && selected.type === 'text' && (
        <LabeledControl label="Font weight" description="Make text regular, semi-bold, or bold">
          <select
            value={selected.fontWeight}
            aria-label="Font weight"
            onChange={(e) => updateObject(selected.id, { fontWeight: Number(e.target.value) })}
            className={controlInputClass}
          >
            <option value={400}>Regular</option>
            <option value={600}>Semi-bold</option>
            <option value={700}>Bold</option>
          </select>
        </LabeledControl>
      )}

      {controls.includes('opacity') && selected.type === 'highlight' && (
        <LabeledControl label="Opacity" description="Adjust how transparent the highlight is">
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={selected.opacity}
            aria-label="Opacity"
            onChange={(e) => updateObject(selected.id, { opacity: Number(e.target.value) })}
            onPointerUp={onChangeComplete}
            className="w-16"
          />
        </LabeledControl>
      )}

      {controls.includes('strength') && selected.type === 'blur' && (
        <LabeledControl label="Blur strength" description="Increase or decrease the blur intensity">
          <input
            type="range"
            min={2}
            max={30}
            value={selected.strength}
            aria-label="Blur strength"
            onChange={(e) => updateObject(selected.id, { strength: Number(e.target.value) })}
            onPointerUp={onChangeComplete}
            className="w-16"
          />
        </LabeledControl>
      )}

      {controls.includes('fill') &&
        (selected.type === 'rectangle' || selected.type === 'circle') &&
        'fillColor' in selected && (
          <LabeledControl label="Fill color" description="Set the shape fill color">
            <input
              type="color"
              value={selected.fillColor ?? '#ffffff'}
              aria-label="Fill color"
              onChange={(e) =>
                updateObject(selected.id, {
                  fillColor: e.target.value,
                })
              }
              onPointerUp={onChangeComplete}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </LabeledControl>
        )}

      <IconButton
        icon={<DeleteIcon className="h-4 w-4 text-red-500" />}
        label="Delete"
        description="Remove this annotation from the image"
        shortcut={getShortcutLabel('delete')}
        size="sm"
        onClick={() => {
          removeObject(selected.id)
          onChangeComplete()
        }}
      />
    </div>
  )
}
