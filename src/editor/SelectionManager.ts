import type { Rect, ResizeHandle } from '@/types/editor'
import { clampRect, normalizeRect } from '@/utils/image'
import { hitTestHandle, pointInRect, resizeRect } from '@/editor/drawUtils'

type DragMode = 'create' | 'move' | 'resize' | null

export class SelectionManager {
  private mode: DragMode = null
  private startPoint = { x: 0, y: 0 }
  private originRect: Rect | null = null
  private activeHandle: ResizeHandle | null = null
  private bounds = { width: 0, height: 0 }

  setBounds(width: number, height: number) {
    this.bounds = { width, height }
  }

  onPointerDown(
    point: { x: number; y: number },
    selection: Rect | null,
  ): { mode: DragMode; selection: Rect | null } {
    this.startPoint = point

    if (selection) {
      const handle = hitTestHandle(selection, point)
      if (handle) {
        this.mode = 'resize'
        this.activeHandle = handle
        this.originRect = { ...selection }
        return { mode: this.mode, selection }
      }
      if (pointInRect(point, selection)) {
        this.mode = 'move'
        this.originRect = { ...selection }
        return { mode: this.mode, selection }
      }
    }

    this.mode = 'create'
    this.originRect = null
    return { mode: this.mode, selection: { x: point.x, y: point.y, width: 0, height: 0 } }
  }

  onPointerMove(point: { x: number; y: number }, selection: Rect | null): Rect | null {
    if (!this.mode) return selection

    if (this.mode === 'create') {
      const rect = normalizeRect(this.startPoint, point)
      return clampRect(rect, this.bounds)
    }

    if (this.mode === 'move' && this.originRect) {
      const dx = point.x - this.startPoint.x
      const dy = point.y - this.startPoint.y
      return clampRect(
        {
          x: this.originRect.x + dx,
          y: this.originRect.y + dy,
          width: this.originRect.width,
          height: this.originRect.height,
        },
        this.bounds,
      )
    }

    if (this.mode === 'resize' && this.originRect && this.activeHandle) {
      return clampRect(resizeRect(this.originRect, this.activeHandle, point), this.bounds)
    }

    return selection
  }

  onPointerUp(): void {
    this.mode = null
    this.originRect = null
    this.activeHandle = null
  }

  isDragging(): boolean {
    return this.mode !== null
  }
}
