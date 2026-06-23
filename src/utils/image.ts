export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image data'))
    reader.readAsDataURL(blob)
  })
}

export async function blobToImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob)
}

/**
 * Build a self-contained demo screenshot so the editor is fully usable even when
 * no capture session exists (e.g. opened directly, or during store review where a
 * live capture could not be produced). Lets users edit and export right away.
 */
export async function createDemoImageBitmap(): Promise<{
  bitmap: ImageBitmap
  width: number
  height: number
}> {
  const width = 1280
  const height = 800
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#eff6ff')
  bg.addColorStop(1, '#e0e7ff')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  // Faux browser window card
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  const cardX = 120
  const cardY = 120
  const cardW = width - cardX * 2
  const cardH = height - cardY * 2
  ctx.fillRect(cardX, cardY, cardW, cardH)
  ctx.strokeRect(cardX, cardY, cardW, cardH)

  // Title bar
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(cardX, cardY, cardW, 56)
  ctx.fillStyle = '#ef4444'
  ctx.beginPath(); ctx.arc(cardX + 28, cardY + 28, 8, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#f59e0b'
  ctx.beginPath(); ctx.arc(cardX + 56, cardY + 28, 8, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#22c55e'
  ctx.beginPath(); ctx.arc(cardX + 84, cardY + 28, 8, 0, Math.PI * 2); ctx.fill()

  // Headings
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 44px system-ui, -apple-system, sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText('Screenshot Pro — Demo', cardX + 48, cardY + 110)

  ctx.fillStyle = '#475569'
  ctx.font = '24px system-ui, -apple-system, sans-serif'
  const lines = [
    'This is a sample image so you can try every tool right now:',
    '• Pick Text, Arrow, Rectangle, Circle, Highlight, Blur or Pen',
    '• Draw on this image, then Undo / Redo',
    '• Click Copy, or Download as PNG / JPG / WEBP',
    '',
    'Capture a real page anytime from the toolbar extension icon.',
  ]
  lines.forEach((line, i) => {
    ctx.fillText(line, cardX + 48, cardY + 190 + i * 44)
  })

  const bitmap = await createImageBitmap(canvas)
  return { bitmap, width, height }
}

export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  bitmap.close()
  return { width, height }
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export function clampRect(
  rect: { x: number; y: number; width: number; height: number },
  bounds: { width: number; height: number },
) {
  const x = Math.max(0, Math.min(rect.x, bounds.width))
  const y = Math.max(0, Math.min(rect.y, bounds.height))
  const width = Math.max(1, Math.min(rect.width, bounds.width - x))
  const height = Math.max(1, Math.min(rect.height, bounds.height - y))
  return { x, y, width, height }
}

export function normalizeRect(start: { x: number; y: number }, end: { x: number; y: number }) {
  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  return { x, y, width, height }
}
