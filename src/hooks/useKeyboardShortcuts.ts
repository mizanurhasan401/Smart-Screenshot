import { useEffect } from 'react'
import { useEditorStore } from '@/store/useEditorStore'
import type { ToolType } from '@/types/editor'
import type { ExportFormat } from '@/utils/download'

const TOOL_KEYS: Record<string, ToolType> = {
  s: 'selection',
  c: 'crop',
  t: 'text',
  a: 'arrow',
  r: 'rectangle',
  o: 'circle',
  h: 'highlight',
  b: 'blur',
}

interface ShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onDownload: (format: ExportFormat) => void
  onDelete: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  const setSelectedObjectId = useEditorStore((s) => s.setSelectedObjectId)
  const setDrawPreview = useEditorStore((s) => s.setDrawPreview)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      const key = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey

      if (mod && key === 'z' && e.shiftKey) {
        e.preventDefault()
        handlers.onRedo()
        return
      }
      if (mod && key === 'z') {
        e.preventDefault()
        handlers.onUndo()
        return
      }
      if (mod && key === 'c') {
        e.preventDefault()
        handlers.onCopy()
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        handlers.onDownload('png')
        return
      }

      if (e.key === 'Escape') {
        setDrawPreview(null)
        setSelectedObjectId(null)
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handlers.onDelete()
        return
      }

      if (!mod && TOOL_KEYS[key]) {
        setActiveTool(TOOL_KEYS[key]!)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, setActiveTool, setDrawPreview, setSelectedObjectId])
}
