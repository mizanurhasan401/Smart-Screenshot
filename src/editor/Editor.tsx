import { useCallback, useEffect, useRef, useState } from 'react'
import Canvas from '@/editor/Canvas'
import CaptureInfoBar from '@/editor/CaptureInfoBar'
import AppIcon from '@/editor/ui/AppIcon'
import { ExportManager } from '@/editor/ExportManager'
import Toolbar from '@/editor/Toolbar'
import { useCanvasHistory } from '@/hooks/useCanvasHistory'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/hooks/useTheme'
import { useEditorStore } from '@/store/useEditorStore'
import { copyImageToClipboard } from '@/utils/clipboard'
import { getSession } from '@/utils/db'
import { canvasToBlob, downloadBlob, getFilenameFromUrl } from '@/utils/download'
import type { ExportFormat } from '@/utils/download'
import { blobToImageBitmap } from '@/utils/image'

export default function Editor() {
  useTheme()
  const imageRef = useRef<ImageBitmap | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const exportManager = useRef(new ExportManager())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [pageTitle, setPageTitle] = useState<string | undefined>()
  const [pageUrl, setPageUrl] = useState<string | undefined>()

  const imageWidth = useEditorStore((s) => s.imageWidth)
  const imageHeight = useEditorStore((s) => s.imageHeight)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const panOffset = useEditorStore((s) => s.panOffset)
  const objects = useEditorStore((s) => s.objects)
  const cropRect = useEditorStore((s) => s.cropRect)
  const selection = useEditorStore((s) => s.selection)
  const selectedObjectId = useEditorStore((s) => s.selectedObjectId)
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const setImageDimensions = useEditorStore((s) => s.setImageDimensions)
  const removeObject = useEditorStore((s) => s.removeObject)
  const resetCrop = useEditorStore((s) => s.resetCrop)
  const updateObject = useEditorStore((s) => s.updateObject)
  const setEditingTextId = useEditorStore((s) => s.setEditingTextId)
  const activeTool = useEditorStore((s) => s.activeTool)

  const { pushHistory, undo, redo, syncHistoryState } = useCanvasHistory()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session')
    if (!sessionId) {
      setError('No screenshot session found')
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const session = await getSession(sessionId)
        if (!session) throw new Error('Session expired or not found')
        const bitmap = await blobToImageBitmap(session.blob)
        if (cancelled) {
          bitmap.close()
          return
        }
        imageRef.current = bitmap
        setImageDimensions(session.width, session.height)
        setPageTitle(session.title)
        setPageUrl(session.url)
        syncHistoryState()
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load screenshot')
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
      imageRef.current?.close()
      imageRef.current = null
    }
  }, [setImageDimensions, syncHistoryState])

  useEffect(() => {
    if (activeTool) {
      setAnnouncement(`${activeTool} tool active`)
    }
  }, [activeTool])

  const getScale = useCallback(() => {
    const container = containerRef.current
    if (!container || !imageWidth || !imageHeight) return 1
    if (zoomLevel === 'fit') {
      return Math.min(container.clientWidth / imageWidth, container.clientHeight / imageHeight, 1)
    }
    return zoomLevel / 100
  }, [imageWidth, imageHeight, zoomLevel])

  const exportImage = useCallback(async () => {
    const image = imageRef.current
    if (!image) throw new Error('No image loaded')
    return exportManager.current.renderToCanvas({
      image,
      objects,
      cropRect,
      selection,
    })
  }, [objects, cropRect, selection])

  const handleCopy = useCallback(async (): Promise<boolean> => {
    try {
      const canvas = await exportImage()
      const blob = await canvasToBlob(canvas, 'png')
      await copyImageToClipboard(blob)
      setAnnouncement('Copied to clipboard')
      return true
    } catch {
      setAnnouncement('Copy failed')
      return false
    }
  }, [exportImage])

  const handleDownload = useCallback(
    async (format: ExportFormat) => {
      try {
        const canvas = await exportImage()
        const blob = await canvasToBlob(canvas, format)
        downloadBlob(blob, getFilenameFromUrl(pageUrl, format))
        setAnnouncement(`Downloaded as ${format.toUpperCase()}`)
      } catch {
        setAnnouncement('Download failed')
      }
    },
    [exportImage, pageUrl],
  )

  const handleDelete = useCallback(() => {
    if (selectedObjectId) {
      removeObject(selectedObjectId)
      pushHistory()
    }
  }, [selectedObjectId, removeObject, pushHistory])

  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onDownload: handleDownload,
    onDelete: handleDelete,
    onOpenShortcuts: () => setShowShortcuts(true),
    onCloseShortcuts: () => setShowShortcuts(false),
    isShortcutsOpen: showShortcuts,
  })

  const editingText = objects.find(
    (o): o is Extract<typeof o, { type: 'text' }> =>
      o.id === editingTextId && o.type === 'text',
  )

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <AppIcon size={48} alt="Chrome Screenshot Pro" />
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-zinc-500">Loading screenshot…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-zinc-50 px-4 dark:bg-zinc-950">
        <p className="text-sm font-medium text-red-500">{error}</p>
        {pageUrl && (
          <p className="max-w-md truncate text-xs text-zinc-400" title={pageUrl}>
            {pageUrl}
          </p>
        )}
      </div>
    )
  }

  const scale = getScale()

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onResetCrop={() => {
          resetCrop()
          pushHistory()
        }}
        onChangeComplete={pushHistory}
        showShortcuts={showShortcuts}
        onShortcutsOpenChange={setShowShortcuts}
      />
      <CaptureInfoBar title={pageTitle} url={pageUrl} />
      <div className="relative flex-1 overflow-hidden">
        <Canvas
          imageRef={imageRef}
          containerRef={containerRef}
          onActionComplete={pushHistory}
        />
        {editingText && containerRef.current && (() => {
          const rect = containerRef.current!.getBoundingClientRect()
          const offsetX = (rect.width - imageWidth * scale) / 2 + panOffset.x
          const offsetY = (rect.height - imageHeight * scale) / 2 + panOffset.y
          const left = rect.left + offsetX + editingText.x * scale
          const top = rect.top + offsetY + editingText.y * scale
          return (
            <textarea
              autoFocus
              value={editingText.text}
              onChange={(e) => updateObject(editingText.id, { text: e.target.value })}
              onBlur={() => {
                setEditingTextId(null)
                pushHistory()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingTextId(null)
                  pushHistory()
                }
              }}
              className="fixed z-30 resize-none rounded border border-blue-400 bg-white/90 px-1 py-0.5 text-sm shadow dark:bg-zinc-900/90"
              style={{
                left,
                top,
                color: editingText.color,
                fontSize: editingText.fontSize * scale,
                fontFamily: editingText.fontFamily,
                fontWeight: editingText.fontWeight,
                minWidth: 80,
              }}
            />
          )
        })()}
      </div>
    </div>
  )
}
