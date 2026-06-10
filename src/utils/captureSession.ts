import type { CaptureMode } from '@/types/capture'
import { cleanupOldSessions, saveSession } from '@/utils/db'
import { captureFullPage } from '@/utils/fullPageCapture'
import { dataUrlToBlob, getImageDimensions } from '@/utils/image'

export async function openEditor(sessionId: string): Promise<void> {
  const url = chrome.runtime.getURL(`src/editor/index.html?session=${encodeURIComponent(sessionId)}`)
  await chrome.tabs.create({ url })
}

async function captureVisibleArea(tab: chrome.tabs.Tab): Promise<Blob> {
  if (!tab.windowId) throw new Error('No active window')
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' })
  return dataUrlToBlob(dataUrl)
}

async function captureBlob(tab: chrome.tabs.Tab, mode: CaptureMode): Promise<Blob> {
  if (mode === 'fullpage') return captureFullPage(tab)
  return captureVisibleArea(tab)
}

export async function captureAndOpenEditor(tab: chrome.tabs.Tab, mode: CaptureMode): Promise<void> {
  await cleanupOldSessions()

  const blob = await captureBlob(tab, mode)
  const { width, height } = await getImageDimensions(blob)

  const sessionId = crypto.randomUUID()
  await saveSession({
    id: sessionId,
    blob,
    width,
    height,
    url: tab.url,
    title: tab.title,
    createdAt: Date.now(),
  })
  await openEditor(sessionId)
}
