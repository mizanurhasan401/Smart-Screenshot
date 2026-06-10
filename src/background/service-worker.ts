import type { MessageType } from '@/types/capture'
import { captureAndOpenEditor } from '@/utils/captureSession'
import { cleanupOldSessions } from '@/utils/db'
import { friendlyCaptureError } from '@/utils/tabCaptureGuard'

cleanupOldSessions().catch(() => {})

function showCaptureError(): void {
  chrome.action.setBadgeText({ text: '!' })
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000)
}

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse: (response?: unknown) => void) => {
    if (message.type !== 'CAPTURE_REQUEST') return false

    chrome.tabs.get(message.tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        showCaptureError()
        sendResponse({ success: false, error: chrome.runtime.lastError?.message ?? 'Tab not found' })
        return
      }

      captureAndOpenEditor(tab, message.mode)
        .then(() => sendResponse({ success: true }))
        .catch((err: Error) => {
          showCaptureError()
          sendResponse({ success: false, error: friendlyCaptureError(err) })
        })
    })

    return true
  },
)
