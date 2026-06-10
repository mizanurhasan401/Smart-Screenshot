type PageMetrics = {
  scrollWidth: number
  scrollHeight: number
  viewportWidth: number
  viewportHeight: number
  scrollX: number
  scrollY: number
}

function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}

function readPageMetrics(): PageMetrics {
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

function safeSendResponse(sendResponse: (response: unknown) => void, value: unknown): void {
  try {
    if (!isExtensionContextValid()) return
    sendResponse(value)
  } catch {
    // Extension was reloaded while this content script was still active.
  }
}

if (isExtensionContextValid()) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_METRICS') {
      safeSendResponse(sendResponse, readPageMetrics())
      return false
    }

    if (message.type === 'SCROLL_TO') {
      window.scrollTo(message.x, message.y)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          safeSendResponse(sendResponse, { ok: true })
        })
      })
      return true
    }

    return false
  })
}
