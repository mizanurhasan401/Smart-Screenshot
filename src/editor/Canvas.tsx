import { useCallback, useEffect, useRef } from 'react'
import { drawAnnotation, drawArrow, drawSelectionOverlay, getObjectBounds, hitTestObject } from '@/editor/drawUtils'
import { SelectionManager } from '@/editor/SelectionManager'
import { useEditorStore } from '@/store/useEditorStore'
import type { AnnotationObject, Point } from '@/types/editor'
import { clampRect, normalizeRect } from '@/utils/image'

interface CanvasProps {
  imageRef: React.RefObject<ImageBitmap | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  onActionComplete: () => void
}

function screenToImage(
  point: Point,
  pan: Point,
  scale: number,
  containerRect: DOMRect,
  imageSize: { width: number; height: number },
): Point {
  const offsetX = (containerRect.width - imageSize.width * scale) / 2 + pan.x
  const offsetY = (containerRect.height - imageSize.height * scale) / 2 + pan.y
  return {
    x: (point.x - containerRect.left - offsetX) / scale,
    y: (point.y - containerRect.top - offsetY) / scale,
  }
}

export default function Canvas({ imageRef, containerRef, onActionComplete }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectionManager = useRef(new SelectionManager())
  const rafRef = useRef<number>(0)
  const dragObjectRef = useRef<{ id: string; start: Point; origin: AnnotationObject } | null>(null)
  const panDragRef = useRef<{ start: Point; origin: Point } | null>(null)

  const activeTool = useEditorStore((s) => s.activeTool)
  const selection = useEditorStore((s) => s.selection)
  const cropRect = useEditorStore((s) => s.cropRect)
  const objects = useEditorStore((s) => s.objects)
  const drawPreview = useEditorStore((s) => s.drawPreview)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const panOffset = useEditorStore((s) => s.panOffset)
  const imageWidth = useEditorStore((s) => s.imageWidth)
  const imageHeight = useEditorStore((s) => s.imageHeight)
  const defaultColor = useEditorStore((s) => s.defaultColor)
  const defaultStrokeWidth = useEditorStore((s) => s.defaultStrokeWidth)
  const defaultFontSize = useEditorStore((s) => s.defaultFontSize)
  const defaultFontFamily = useEditorStore((s) => s.defaultFontFamily)
  const defaultFontWeight = useEditorStore((s) => s.defaultFontWeight)
  const defaultOpacity = useEditorStore((s) => s.defaultOpacity)
  const defaultBlurStrength = useEditorStore((s) => s.defaultBlurStrength)

  const getScale = useCallback(() => {
    const container = containerRef.current
    if (!container || !imageWidth || !imageHeight) return 1
    if (zoomLevel === 'fit') {
      return Math.min(container.clientWidth / imageWidth, container.clientHeight / imageHeight, 1)
    }
    return zoomLevel / 100
  }, [containerRef, imageWidth, imageHeight, zoomLevel])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    const container = containerRef.current
    if (!canvas || !image || !container) return

    const scale = getScale()
    const displayW = image.width * scale
    const displayH = image.height * scale

    canvas.width = displayW
    canvas.height = displayH
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, displayW, displayH)
    ctx.save()
    ctx.scale(scale, scale)

    const viewRect = cropRect ?? { x: 0, y: 0, width: image.width, height: image.height }
    if (cropRect) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(viewRect.x, viewRect.y, viewRect.width, viewRect.height)
      ctx.clip()
    }

    ctx.drawImage(image, 0, 0)

    for (const obj of objects) {
      if (obj.type !== 'blur') drawAnnotation(ctx, obj)
    }

    for (const obj of objects) {
      if (obj.type === 'blur') {
        ctx.save()
        ctx.beginPath()
        ctx.rect(obj.x, obj.y, obj.width, obj.height)
        ctx.clip()
        ctx.filter = `blur(${obj.strength}px)`
        ctx.drawImage(image, 0, 0)
        ctx.restore()
      }
    }

    if (cropRect) ctx.restore()

    if (drawPreview) {
      const { type, start, current } = drawPreview
      if (type === 'arrow') {
        drawArrow(ctx, start.x, start.y, current.x, current.y, defaultColor, defaultStrokeWidth)
      } else if (type === 'rectangle' || type === 'highlight' || type === 'blur') {
        const rect = normalizeRect(start, current)
        if (type === 'highlight') {
          ctx.globalAlpha = defaultOpacity
          ctx.fillStyle = defaultColor
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
          ctx.globalAlpha = 1
        } else if (type === 'blur') {
          ctx.strokeStyle = '#8b5cf6'
          ctx.setLineDash([4, 4])
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = defaultColor
          ctx.lineWidth = defaultStrokeWidth
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
        }
      } else if (type === 'circle') {
        const radius = Math.hypot(current.x - start.x, current.y - start.y)
        ctx.strokeStyle = defaultColor
        ctx.lineWidth = defaultStrokeWidth
        ctx.beginPath()
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    if (activeTool === 'selection' && selection) {
      drawSelectionOverlay(ctx, selection, true)
    } else if (activeTool === 'crop' && (cropRect || drawPreview)) {
      const rect = cropRect ?? (drawPreview ? normalizeRect(drawPreview.start, drawPreview.current) : null)
      if (rect) drawSelectionOverlay(ctx, rect, false)
    }

    const selectedId = useEditorStore.getState().selectedObjectId
    if (selectedId) {
      const obj = objects.find((o) => o.id === selectedId)
      const bounds = obj ? getObjectBounds(obj) : null
      if (bounds) drawSelectionOverlay(ctx, bounds, false)
    }

    ctx.restore()
  }, [
    activeTool,
    cropRect,
    defaultBlurStrength,
    defaultColor,
    defaultFontSize,
    defaultFontFamily,
    defaultFontWeight,
    defaultOpacity,
    defaultStrokeWidth,
    drawPreview,
    getScale,
    imageRef,
    containerRef,
    objects,
    selection,
  ])

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [render])

  useEffect(() => {
    selectionManager.current.setBounds(imageWidth, imageHeight)
  }, [imageWidth, imageHeight])

  const getImagePoint = (e: React.PointerEvent): Point | null => {
    const container = containerRef.current
    if (!container || !imageWidth) return null
    const scale = getScale()
    return screenToImage(
      { x: e.clientX, y: e.clientY },
      panOffset,
      scale,
      container.getBoundingClientRect(),
      { width: imageWidth, height: imageHeight },
    )
  }

  const finishDraw = (start: Point, end: Point, type: typeof activeTool) => {
    const store = useEditorStore.getState()
    const id = crypto.randomUUID()

    if (type === 'arrow') {
      if (Math.hypot(end.x - start.x, end.y - start.y) < 4) return
      store.addObject({
        id,
        type: 'arrow',
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        color: defaultColor,
        strokeWidth: defaultStrokeWidth,
      })
    } else if (type === 'rectangle') {
      const rect = clampRect(normalizeRect(start, end), { width: imageWidth, height: imageHeight })
      if (rect.width < 2 || rect.height < 2) return
      store.addObject({
        id,
        type: 'rectangle',
        ...rect,
        color: defaultColor,
        strokeWidth: defaultStrokeWidth,
        fillColor: null,
      })
    } else if (type === 'circle') {
      const radius = Math.hypot(end.x - start.x, end.y - start.y)
      if (radius < 2) return
      store.addObject({
        id,
        type: 'circle',
        x: start.x,
        y: start.y,
        radius,
        color: defaultColor,
        strokeWidth: defaultStrokeWidth,
        fillColor: null,
      })
    } else if (type === 'highlight') {
      const rect = clampRect(normalizeRect(start, end), { width: imageWidth, height: imageHeight })
      if (rect.width < 2 || rect.height < 2) return
      store.addObject({
        id,
        type: 'highlight',
        ...rect,
        color: defaultColor,
        opacity: defaultOpacity,
      })
    } else if (type === 'blur') {
      const rect = clampRect(normalizeRect(start, end), { width: imageWidth, height: imageHeight })
      if (rect.width < 2 || rect.height < 2) return
      store.addObject({
        id,
        type: 'blur',
        ...rect,
        strength: defaultBlurStrength,
      })
    }

    onActionComplete()
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const point = getImagePoint(e as unknown as React.PointerEvent)
    if (!point) return
    const hit = hitTestObject(objects, point)
    if (hit?.type === 'text') {
      useEditorStore.getState().setEditingTextId(hit.id)
      useEditorStore.getState().setSelectedObjectId(hit.id)
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const point = getImagePoint(e)
    if (!point) return
    const store = useEditorStore.getState()

    if (activeTool === 'pan' || e.button === 1) {
      panDragRef.current = { start: { x: e.clientX, y: e.clientY }, origin: { ...panOffset } }
      store.setIsPanning(true)
      return
    }

    if (activeTool === 'text') {
      const id = crypto.randomUUID()
      store.addObject({
        id,
        type: 'text',
        x: point.x,
        y: point.y,
        text: 'Text',
        color: defaultColor,
        fontSize: defaultFontSize,
        fontFamily: defaultFontFamily,
        fontWeight: defaultFontWeight,
      })
      store.setEditingTextId(id)
      store.setSelectedObjectId(id)
      onActionComplete()
      return
    }

    if (activeTool === 'selection') {
      const result = selectionManager.current.onPointerDown(point, selection)
      if (result.selection) store.setSelection(result.selection)
      return
    }

    if (activeTool === 'crop') {
      store.setDrawPreview({ type: 'crop', start: point, current: point })
      return
    }

    if (['arrow', 'rectangle', 'circle', 'highlight', 'blur'].includes(activeTool)) {
      store.setDrawPreview({ type: activeTool, start: point, current: point })
      return
    }

    const hit = hitTestObject(objects, point)
    if (hit) {
      store.setSelectedObjectId(hit.id)
      dragObjectRef.current = { id: hit.id, start: point, origin: structuredClone(hit) }
    } else {
      store.setSelectedObjectId(null)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.start.x
      const dy = e.clientY - panDragRef.current.start.y
      useEditorStore.getState().setPanOffset({
        x: panDragRef.current.origin.x + dx,
        y: panDragRef.current.origin.y + dy,
      })
      return
    }

    const point = getImagePoint(e)
    if (!point) return
    const store = useEditorStore.getState()

    if (activeTool === 'selection' && selectionManager.current.isDragging()) {
      const next = selectionManager.current.onPointerMove(point, selection)
      if (next) store.setSelection(next)
      return
    }

    if (drawPreview) {
      store.setDrawPreview({ ...drawPreview, current: point })
      return
    }

    if (dragObjectRef.current) {
      const { id, start, origin } = dragObjectRef.current
      const dx = point.x - start.x
      const dy = point.y - start.y
      if (origin.type === 'arrow') {
        store.updateObject(id, {
          x1: origin.x1 + dx,
          y1: origin.y1 + dy,
          x2: origin.x2 + dx,
          y2: origin.y2 + dy,
        })
      } else if ('x' in origin && 'y' in origin) {
        store.updateObject(id, { x: origin.x + dx, y: origin.y + dy })
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (panDragRef.current) {
      panDragRef.current = null
      useEditorStore.getState().setIsPanning(false)
      return
    }

    const point = getImagePoint(e)
    const store = useEditorStore.getState()

    if (activeTool === 'selection') {
      const wasDragging = selectionManager.current.isDragging()
      selectionManager.current.onPointerUp()
      if (wasDragging) onActionComplete()
      return
    }

    if (activeTool === 'crop' && drawPreview) {
      const rect = clampRect(
        normalizeRect(drawPreview.start, drawPreview.current),
        { width: imageWidth, height: imageHeight },
      )
      if (rect.width > 2 && rect.height > 2) {
        store.setCropRect(rect)
        onActionComplete()
      }
      store.setDrawPreview(null)
      return
    }

    if (drawPreview && point) {
      finishDraw(drawPreview.start, point, drawPreview.type)
      store.setDrawPreview(null)
      return
    }

    if (dragObjectRef.current) {
      dragObjectRef.current = null
      onActionComplete()
    }
  }

  const cursor =
    activeTool === 'pan' || useEditorStore.getState().isPanning
      ? 'grab'
      : activeTool === 'text'
        ? 'text'
        : 'crosshair'

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      style={{
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
      }}
    >
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Screenshot editor canvas"
        className="shadow-lg"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
    </div>
  )
}
