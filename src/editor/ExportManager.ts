import type { AnnotationObject, Rect } from '@/types/editor'
import { drawAnnotation } from '@/editor/drawUtils'

interface ExportOptions {
  image: ImageBitmap
  objects: AnnotationObject[]
  cropRect: Rect | null
  selection: Rect | null
}

export class ExportManager {
  async renderToCanvas({
    image,
    objects,
    cropRect,
    selection,
  }: ExportOptions): Promise<HTMLCanvasElement> {
    const region = cropRect ?? selection ?? {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(region.width)
    canvas.height = Math.round(region.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')

    ctx.drawImage(
      image,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height,
    )

    const offsetObjects = objects.map((obj) => offsetObject(obj, region.x, region.y))

    for (const obj of offsetObjects) {
      if (obj.type === 'blur') {
        await this.applyBlur(ctx, obj, image, region)
      } else {
        drawAnnotation(ctx, obj)
      }
    }

    return canvas
  }

  private async applyBlur(
    ctx: CanvasRenderingContext2D,
    obj: Extract<AnnotationObject, { type: 'blur' }>,
    image: ImageBitmap,
    region: Rect,
  ) {
    const temp = document.createElement('canvas')
    temp.width = Math.round(obj.width)
    temp.height = Math.round(obj.height)
    const tctx = temp.getContext('2d')
    if (!tctx) return

    const srcX = region.x + obj.x
    const srcY = region.y + obj.y

    tctx.drawImage(image, srcX, srcY, obj.width, obj.height, 0, 0, obj.width, obj.height)
    tctx.filter = `blur(${obj.strength}px)`
    tctx.drawImage(temp, 0, 0)
    tctx.filter = 'none'

    ctx.drawImage(temp, obj.x, obj.y)
  }
}

function offsetObject(obj: AnnotationObject, ox: number, oy: number): AnnotationObject {
  switch (obj.type) {
    case 'arrow':
      return { ...obj, x1: obj.x1 - ox, y1: obj.y1 - oy, x2: obj.x2 - ox, y2: obj.y2 - oy }
    case 'rectangle':
    case 'highlight':
    case 'blur':
      return { ...obj, x: obj.x - ox, y: obj.y - oy }
    case 'circle':
      return { ...obj, x: obj.x - ox, y: obj.y - oy }
    case 'text':
      return { ...obj, x: obj.x - ox, y: obj.y - oy }
    default:
      return obj
  }
}
