import { handleTabCapture } from '@/utils/captureSession'
import { cleanupOldSessions } from '@/utils/db'
import type { MessageType } from '@/types/capture'

cleanupOldSessions().catch(() => {})

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse: (response?: unknown) => void) => {
    if (message.type === 'CAPTURE_TAB') {
      handleTabCapture(message.dataUrl)
        .then(sendResponse)
        .catch((err: Error) => sendResponse({ success: false, error: err.message }))
      return true
    }
    return false
  },
)
