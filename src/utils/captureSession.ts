import { cleanupOldSessions, saveSession } from '@/utils/db'
import { dataUrlToBlob, getImageDimensions } from '@/utils/image'

export async function createCaptureSession(blob: Blob): Promise<string> {
  const { width, height } = await getImageDimensions(blob)
  const id = crypto.randomUUID()
  await saveSession({ id, blob, width, height, createdAt: Date.now() })
  return id
}

export async function openEditor(sessionId: string): Promise<void> {
  const url = chrome.runtime.getURL(`src/editor/index.html?session=${encodeURIComponent(sessionId)}`)
  await chrome.tabs.create({ url })
}

export async function handleTabCapture(dataUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    await cleanupOldSessions()
    const blob = await dataUrlToBlob(dataUrl)
    const sessionId = await createCaptureSession(blob)
    await openEditor(sessionId)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture failed'
    return { success: false, error: message }
  }
}
