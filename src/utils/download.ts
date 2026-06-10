export type ExportFormat = 'png' | 'jpg' | 'webp'

function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

function getHostnameSlug(url: string | undefined): string | null {
  if (!url) return null
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const slug = hostname.replace(/[^a-zA-Z0-9.-]/g, '-').replace(/-+/g, '-')
    return slug || null
  } catch {
    return null
  }
}

export function getTimestampFilename(format: ExportFormat): string {
  return `screenshot-${getTimestamp()}.${format}`
}

export function getFilenameFromUrl(url: string | undefined, format: ExportFormat): string {
  const slug = getHostnameSlug(url)
  const stamp = getTimestamp()
  return slug ? `screenshot-${slug}-${stamp}.${format}` : `screenshot-${stamp}.${format}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality = 0.92,
): Promise<Blob> {
  const mimeType =
    format === 'png' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/webp'

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to export image'))
      },
      mimeType,
      quality,
    )
  })
}
