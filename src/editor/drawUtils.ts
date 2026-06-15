import type { AnnotationObject, Point, Rect, ResizeHandle } from '@/types/editor'

const HANDLE_SIZE = 8
const OVERLAY_SCREEN_STROKE_PX = 3

function screenStrokeWidth(scale: number, screenPx = OVERLAY_SCREEN_STROKE_PX): number {
  return Math.max(2, screenPx / scale)
}

function screenHandleSize(scale: number): number {
  return Math.max(HANDLE_SIZE, 10 / scale)
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, obj: AnnotationObject) {
  ctx.save()
  switch (obj.type) {
    case 'arrow':
      drawArrow(ctx, obj.x1, obj.y1, obj.x2, obj.y2, obj.color, obj.strokeWidth)
      break
    case 'rectangle':
      drawRectangle(ctx, obj)
      break
    case 'circle':
      drawCircle(ctx, obj)
      break
    case 'text':
      drawText(ctx, obj)
      break
    case 'highlight':
      drawHighlight(ctx, obj)
      break
    case 'pen':
      drawPen(ctx, obj.points, obj.color, obj.strokeWidth)
      break
    case 'blur':
      // Blur is rendered separately via compositing
      break
  }
  ctx.restore()
}

export function drawPen(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  width: number,
) {
  if (points.length === 0) return
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (points.length === 1) {
    const p = points[0]!
    ctx.beginPath()
    ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i]!.x, points[i]!.y)
  }
  ctx.stroke()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
) {
  const headLength = Math.max(12, width * 4)
  const angle = Math.atan2(y2 - y1, x2 - x1)

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  obj: Extract<AnnotationObject, { type: 'rectangle' }>,
) {
  ctx.strokeStyle = obj.color
  ctx.lineWidth = obj.strokeWidth
  if (obj.fillColor) {
    ctx.fillStyle = obj.fillColor
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
  }
  ctx.strokeRect(obj.x, obj.y, obj.width, obj.height)
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  obj: Extract<AnnotationObject, { type: 'circle' }>,
) {
  ctx.strokeStyle = obj.color
  ctx.lineWidth = obj.strokeWidth
  ctx.beginPath()
  ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2)
  if (obj.fillColor) {
    ctx.fillStyle = obj.fillColor
    ctx.fill()
  }
  ctx.stroke()
}

function drawText(
  ctx: CanvasRenderingContext2D,
  obj: Extract<AnnotationObject, { type: 'text' }>,
) {
  ctx.fillStyle = obj.color
  ctx.font = `${obj.fontWeight} ${obj.fontSize}px ${obj.fontFamily}`
  ctx.textBaseline = 'top'
  const lines = obj.text.split('\n')
  lines.forEach((line, i) => {
    ctx.fillText(line, obj.x, obj.y + i * obj.fontSize * 1.2)
  })
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  obj: Extract<AnnotationObject, { type: 'highlight' }>,
) {
  ctx.globalAlpha = obj.opacity
  ctx.fillStyle = obj.color
  ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
  ctx.globalAlpha = 1
}

export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  showHandles: boolean,
  scale = 1,
) {
  ctx.save()
  const lineWidth = screenStrokeWidth(scale)
  const dash = Math.max(4, 6 / scale)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.lineWidth = lineWidth + Math.max(1, 2 / scale)
  ctx.setLineDash([dash, dash * 0.65])
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = lineWidth
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  ctx.setLineDash([])

  const label = `${Math.round(rect.width)} × ${Math.round(rect.height)}`
  const fontSize = Math.max(11, 12 / scale)
  ctx.font = `${fontSize}px system-ui, sans-serif`
  const padding = 4 / scale
  const textWidth = ctx.measureText(label).width
  const labelX = rect.x
  const labelH = 18 / scale
  const labelY = Math.max(0, rect.y - labelH - 4 / scale)

  ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'
  ctx.fillRect(labelX, labelY, textWidth + padding * 2, labelH)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, labelX + padding, labelY + labelH / 2)

  if (showHandles) {
    const handleSize = screenHandleSize(scale)
    const half = handleSize / 2
    const handles = getHandlePositions(rect)
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = Math.max(1.5, 2 / scale)
    for (const pos of Object.values(handles)) {
      ctx.fillRect(pos.x - half, pos.y - half, handleSize, handleSize)
      ctx.strokeRect(pos.x - half, pos.y - half, handleSize, handleSize)
    }
  }
  ctx.restore()
}

export function getHandlePositions(rect: Rect): Record<ResizeHandle, { x: number; y: number }> {
  const { x, y, width, height } = rect
  const cx = x + width / 2
  const cy = y + height / 2
  return {
    nw: { x, y },
    n: { x: cx, y },
    ne: { x: x + width, y },
    e: { x: x + width, y: cy },
    se: { x: x + width, y: y + height },
    s: { x: cx, y: y + height },
    sw: { x, y: y + height },
    w: { x, y: cy },
  }
}

export function hitTestHandle(
  rect: Rect,
  point: { x: number; y: number },
): ResizeHandle | null {
  const handles = getHandlePositions(rect)
  for (const [key, pos] of Object.entries(handles) as [ResizeHandle, { x: number; y: number }][]) {
    if (
      Math.abs(point.x - pos.x) <= HANDLE_SIZE &&
      Math.abs(point.y - pos.y) <= HANDLE_SIZE
    ) {
      return key
    }
  }
  return null
}

export function pointInRect(point: { x: number; y: number }, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function getObjectBounds(obj: AnnotationObject): Rect | null {
  switch (obj.type) {
    case 'arrow': {
      const x = Math.min(obj.x1, obj.x2)
      const y = Math.min(obj.y1, obj.y2)
      return { x, y, width: Math.abs(obj.x2 - obj.x1), height: Math.abs(obj.y2 - obj.y1) }
    }
    case 'rectangle':
    case 'highlight':
    case 'blur':
      return { x: obj.x, y: obj.y, width: obj.width, height: obj.height }
    case 'circle':
      return {
        x: obj.x - obj.radius,
        y: obj.y - obj.radius,
        width: obj.radius * 2,
        height: obj.radius * 2,
      }
    case 'text':
      return { x: obj.x, y: obj.y, width: 200, height: obj.fontSize * 1.5 }
    case 'pen': {
      if (obj.points.length === 0) return null
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const p of obj.points) {
        if (p.x < minX) minX = p.x
        if (p.y < minY) minY = p.y
        if (p.x > maxX) maxX = p.x
        if (p.y > maxY) maxY = p.y
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    }
    default:
      return null
  }
}

const HIT_PADDING = 8

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - x1, py - y1)

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

function expandedRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

function hitTestSingleObject(
  obj: AnnotationObject,
  point: { x: number; y: number },
): boolean {
  switch (obj.type) {
    case 'arrow': {
      const tolerance = Math.max(HIT_PADDING, obj.strokeWidth * 3)
      return distanceToSegment(point.x, point.y, obj.x1, obj.y1, obj.x2, obj.y2) <= tolerance
    }
    case 'circle': {
      const dist = Math.hypot(point.x - obj.x, point.y - obj.y)
      return dist <= obj.radius + HIT_PADDING
    }
    case 'pen': {
      const tolerance = Math.max(HIT_PADDING, obj.strokeWidth * 3)
      if (obj.points.length === 1) {
        const p = obj.points[0]!
        return Math.hypot(point.x - p.x, point.y - p.y) <= tolerance
      }
      for (let i = 1; i < obj.points.length; i++) {
        const a = obj.points[i - 1]!
        const b = obj.points[i]!
        if (distanceToSegment(point.x, point.y, a.x, a.y, b.x, b.y) <= tolerance) return true
      }
      return false
    }
    case 'text': {
      const bounds = getObjectBounds(obj)
      return bounds ? pointInRect(point, expandedRect(bounds, HIT_PADDING)) : false
    }
    default: {
      const bounds = getObjectBounds(obj)
      return bounds ? pointInRect(point, expandedRect(bounds, HIT_PADDING)) : false
    }
  }
}

export function hitTestObject(
  objects: AnnotationObject[],
  point: { x: number; y: number },
): AnnotationObject | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (!obj) continue
    if (hitTestSingleObject(obj, point)) return obj
  }
  return null
}

export function drawHoverOverlay(ctx: CanvasRenderingContext2D, rect: Rect, scale = 1) {
  ctx.save()
  const lineWidth = screenStrokeWidth(scale, 2.5)
  const dash = Math.max(3, 4 / scale)
  const pad = Math.max(3, 4 / scale)
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)'
  ctx.lineWidth = lineWidth
  ctx.setLineDash([dash, dash])
  const padded = expandedRect(rect, pad)
  ctx.strokeRect(padded.x, padded.y, padded.width, padded.height)
  ctx.setLineDash([])
  ctx.restore()
}

export type ArrowEndpoint = 'start' | 'end'

export const ARROW_HANDLE_RADIUS = 6
const ARROW_ENDPOINT_HIT_RADIUS = 10

type ArrowObject = Extract<AnnotationObject, { type: 'arrow' }>

export type ArrowHitResult = {
  obj: ArrowObject
  endpoint: ArrowEndpoint | 'body'
}

function drawArrowHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath()
  ctx.arc(x, y, ARROW_HANDLE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.stroke()
}

export function drawArrowOverlay(
  ctx: CanvasRenderingContext2D,
  arrow: ArrowObject,
  opts: { handles: boolean; dashed?: boolean },
) {
  ctx.save()
  ctx.strokeStyle = opts.dashed ? 'rgba(59, 130, 246, 0.7)' : '#3b82f6'
  ctx.lineWidth = Math.max(2, arrow.strokeWidth)
  if (opts.dashed) ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(arrow.x1, arrow.y1)
  ctx.lineTo(arrow.x2, arrow.y2)
  ctx.stroke()
  ctx.setLineDash([])
  if (opts.handles) {
    drawArrowHandle(ctx, arrow.x1, arrow.y1)
    drawArrowHandle(ctx, arrow.x2, arrow.y2)
  }
  ctx.restore()
}

export function hitTestArrowEndpoint(
  arrow: ArrowObject,
  point: { x: number; y: number },
): ArrowEndpoint | null {
  const startDist = Math.hypot(point.x - arrow.x1, point.y - arrow.y1)
  const endDist = Math.hypot(point.x - arrow.x2, point.y - arrow.y2)
  const radius = Math.max(ARROW_ENDPOINT_HIT_RADIUS, arrow.strokeWidth * 3)
  if (startDist <= radius && startDist <= endDist) return 'start'
  if (endDist <= radius) return 'end'
  return null
}

function hitTestArrowSingle(
  obj: ArrowObject,
  point: { x: number; y: number },
): ArrowHitResult | null {
  const endpoint = hitTestArrowEndpoint(obj, point)
  if (endpoint) return { obj, endpoint }
  const tolerance = Math.max(HIT_PADDING, obj.strokeWidth * 3)
  if (distanceToSegment(point.x, point.y, obj.x1, obj.y1, obj.x2, obj.y2) <= tolerance) {
    return { obj, endpoint: 'body' }
  }
  return null
}

export function hitTestArrow(
  objects: AnnotationObject[],
  point: { x: number; y: number },
): ArrowHitResult | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    if (!obj || obj.type !== 'arrow') continue
    const hit = hitTestArrowSingle(obj, point)
    if (hit) return hit
  }
  return null
}

export function resizeRect(rect: Rect, handle: ResizeHandle, point: { x: number; y: number }): Rect {
  let { x, y, width, height } = rect
  const right = x + width
  const bottom = y + height

  switch (handle) {
    case 'nw':
      x = point.x
      y = point.y
      width = right - x
      height = bottom - y
      break
    case 'n':
      y = point.y
      height = bottom - y
      break
    case 'ne':
      y = point.y
      width = point.x - x
      height = bottom - y
      break
    case 'e':
      width = point.x - x
      break
    case 'se':
      width = point.x - x
      height = point.y - y
      break
    case 's':
      height = point.y - y
      break
    case 'sw':
      x = point.x
      width = right - x
      height = point.y - y
      break
    case 'w':
      x = point.x
      width = right - x
      break
  }

  if (width < 0) {
    x += width
    width = Math.abs(width)
  }
  if (height < 0) {
    y += height
    height = Math.abs(height)
  }

  return { x, y, width, height }
}
