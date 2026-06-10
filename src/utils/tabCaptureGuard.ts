export function isHttpUrl(url: string | undefined): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.startsWith('http://') || lower.startsWith('https://')
}

export function canUseFullPageCapture(url: string | undefined): boolean {
  return isHttpUrl(url)
}

export function getFullPageDisabledReason(url: string | undefined): string | null {
  if (!url) return 'Page URL is unavailable'

  const lower = url.toLowerCase()

  if (lower.startsWith('chrome-extension://')) {
    if (lower.includes('/content/web/viewer.html') || lower.includes('pdf')) {
      return 'PDF viewer tabs are not supported. Open the PDF on a website or use Visible Area.'
    }
    return 'Extension pages are not supported. Switch to a regular website tab.'
  }

  if (lower.startsWith('chrome://') || lower.startsWith('edge://') || lower.startsWith('about:')) {
    return 'Browser internal pages are not supported. Open a regular website tab.'
  }

  if (!isHttpUrl(url)) {
    return 'Full page only works on http/https websites.'
  }

  return null
}

export function isScriptingConnectionError(message: string): boolean {
  return (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection')
  )
}

export function friendlyCaptureError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('chrome-extension:// URL of different extension')) {
    return 'Full page is not supported on this tab. Use Visible Area or switch to a regular website.'
  }

  if (isScriptingConnectionError(message)) {
    return 'Could not access this page. Refresh the tab and try again.'
  }

  return message
}
