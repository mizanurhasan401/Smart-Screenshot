import { friendlyCaptureError, isHttpUrl } from '@/utils/tabCaptureGuard'
import { dataUrlToBlob } from '@/utils/image'

const CAPTURE_DELAY_MS = 550
const SCROLL_SETTLE_MS = 200
const MAX_CANVAS_HEIGHT = 32_000

export interface PageMetrics {
  scrollWidth: number
  scrollHeight: number
  viewportWidth: number
  viewportHeight: number
  scrollX: number
  scrollY: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readMetricsInPage(): PageMetrics {
  return {
    scrollWidth: Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.offsetWidth,
    ),
    scrollHeight: Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
    ),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  }
}

function scrollInPage(scrollX: number, scrollY: number): void {
  window.scrollTo(scrollX, scrollY)
}

async function getPageMetricsViaScripting(tabId: number): Promise<PageMetrics> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    func: readMetricsInPage,
  })
  if (!result?.result) throw new Error('Could not read page dimensions')
  return result.result as PageMetrics
}

async function scrollTabViaScripting(tabId: number, x: number, y: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId, frameIds: [0] },
    func: scrollInPage,
    args: [x, y],
  })
  await sleep(SCROLL_SETTLE_MS)
}

async function getPageMetricsViaMessage(tabId: number): Promise<PageMetrics> {
  return chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_METRICS' })
}

async function scrollTabViaMessage(tabId: number, x: number, y: number): Promise<void> {
  await chrome.tabs.sendMessage(tabId, { type: 'SCROLL_TO', x, y })
  await sleep(SCROLL_SETTLE_MS)
}

async function getPageMetrics(tabId: number, url: string | undefined): Promise<PageMetrics> {
  if (!isHttpUrl(url)) {
    throw new Error('Full page only works on regular website tabs (http/https).')
  }

  let metrics: PageMetrics | undefined

  try {
    metrics = await getPageMetricsViaMessage(tabId)
  } catch {
    try {
      metrics = await getPageMetricsViaScripting(tabId)
    } catch (err) {
      throw new Error(friendlyCaptureError(err))
    }
  }

  if (!metrics?.scrollHeight || !metrics.viewportHeight) {
    throw new Error('Could not read page dimensions. Refresh the page and try again.')
  }

  return metrics
}

async function scrollTab(tabId: number, x: number, y: number): Promise<void> {
  try {
    await scrollTabViaMessage(tabId, x, y)
  } catch {
    await scrollTabViaScripting(tabId, x, y)
  }
}

async function captureVisiblePng(windowId: number): Promise<Blob> {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' })
    return dataUrlToBlob(dataUrl)
  } catch (err) {
    throw new Error(friendlyCaptureError(err))
  }
}

async function stitchSlices(
  slices: { blob: Blob; y: number }[],
  viewportWidth: number,
  scrollHeight: number,
  viewportHeight: number,
): Promise<Blob> {
  const firstBitmap = await createImageBitmap(slices[0]!.blob)
  const dpr = firstBitmap.width / viewportWidth
  const canvasWidth = firstBitmap.width
  const canvasHeight = Math.round(scrollHeight * dpr)
  firstBitmap.close()

  if (canvasHeight > MAX_CANVAS_HEIGHT) {
    throw new Error('Page is too long to capture (exceeds 32,000px)')
  }

  const canvas = new OffscreenCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  for (let i = 0; i < slices.length; i++) {
    const { blob, y } = slices[i]!
    const bitmap = await createImageBitmap(blob)
    const destY = Math.round(y * dpr)
    const remainingCss = scrollHeight - y
    const sliceCssHeight = Math.min(viewportHeight, remainingCss)
    const slicePxHeight = Math.round(sliceCssHeight * dpr)

    ctx.drawImage(
      bitmap,
      0,
      0,
      bitmap.width,
      slicePxHeight,
      0,
      destY,
      bitmap.width,
      slicePxHeight,
    )
    bitmap.close()
  }

  const result = await canvas.convertToBlob({ type: 'image/png' })
  if (!result) throw new Error('Failed to stitch screenshot')
  return result
}

export async function captureFullPage(tab: chrome.tabs.Tab): Promise<Blob> {
  if (!tab.id || !tab.windowId) throw new Error('Invalid tab')

  const metrics = await getPageMetrics(tab.id, tab.url)
  const { scrollHeight, viewportWidth, viewportHeight, scrollX, scrollY } = metrics

  if (scrollHeight <= viewportHeight) {
    return captureVisiblePng(tab.windowId)
  }

  const numSlices = Math.ceil(scrollHeight / viewportHeight)
  const slices: { blob: Blob; y: number }[] = []

  try {
    for (let i = 0; i < numSlices; i++) {
      const y = i * viewportHeight
      await scrollTab(tab.id, scrollX, y)
      await sleep(CAPTURE_DELAY_MS)
      const blob = await captureVisiblePng(tab.windowId)
      slices.push({ blob, y })
    }
  } finally {
    await scrollTab(tab.id, scrollX, scrollY).catch(() => {})
  }

  return stitchSlices(slices, viewportWidth, scrollHeight, viewportHeight)
}
