import type { Point } from '@/types/editor'

export function clampPanOffset(
  offset: Point,
  viewport: { width: number; height: number },
  imageSize: { width: number; height: number },
  scale: number,
): Point {
  const displayW = imageSize.width * scale
  const displayH = imageSize.height * scale

  const excessX = Math.max(0, displayW - viewport.width)
  const excessY = Math.max(0, displayH - viewport.height)

  const maxX = excessX / 2
  const maxY = excessY / 2

  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}
