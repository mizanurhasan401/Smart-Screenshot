import { useEffect, useState } from 'react'
import AppIcon from '@/editor/ui/AppIcon'
import type { CaptureMode } from '@/types/capture'
import { canUseFullPageCapture, getFullPageDisabledReason } from '@/utils/tabCaptureGuard'

const OPTIONS: { mode: CaptureMode; label: string; description: string; icon: string }[] = [
  { mode: 'visible', label: 'Visible Area', description: 'Capture what you see now', icon: '▣' },
  { mode: 'fullpage', label: 'Full Page', description: 'Capture entire scrollable page', icon: '⇅' },
]

export default function Popup() {
  const [loading, setLoading] = useState<CaptureMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tabTitle, setTabTitle] = useState<string>('')
  const [tabUrl, setTabUrl] = useState<string>('')
  const [tabId, setTabId] = useState<number | null>(null)

  useEffect(() => {
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setTabTitle(tab?.title ?? 'Untitled')
      setTabUrl(tab?.url ?? '')
      setTabId(tab?.id ?? null)
    })
  }, [])

  const fullPageDisabledReason = getFullPageDisabledReason(tabUrl)
  const fullPageEnabled = canUseFullPageCapture(tabUrl)

  const handleCapture = async (mode: CaptureMode) => {
    if (mode === 'fullpage' && !fullPageEnabled) {
      setError(fullPageDisabledReason ?? 'Full page is not available on this tab')
      return
    }

    if (!tabId) {
      setError('No active tab found')
      return
    }

    setLoading(mode)
    setError(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CAPTURE_REQUEST',
        mode,
        tabId,
      })

      if (!response?.success) {
        setError(response?.error ?? 'Capture failed')
        return
      }

      window.close()
    } catch {
      setError('Capture failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="w-80 bg-white p-3 dark:bg-zinc-950">
      <div className="mb-2 flex items-center gap-2">
        <AppIcon size={28} alt="Chrome Screenshot Pro" />
        <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Take Screenshot
        </h1>
      </div>

      <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/80 px-2.5 py-2 dark:border-blue-900 dark:bg-blue-950/30">
        <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100" title={tabTitle}>
          {tabTitle || 'Loading tab…'}
        </p>
        <p className="truncate text-[11px] text-blue-600 dark:text-blue-400" title={tabUrl}>
          {tabUrl || '…'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {OPTIONS.map((opt) => {
          const isFullPage = opt.mode === 'fullpage'
          const disabled = loading !== null || (isFullPage && !fullPageEnabled)

          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => void handleCapture(opt.mode)}
              disabled={disabled}
              aria-label={`${opt.label}: ${opt.description}`}
              title={isFullPage && fullPageDisabledReason ? fullPageDisabledReason : opt.description}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-base text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                aria-hidden="true"
              >
                {opt.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {loading === opt.mode ? 'Capturing…' : opt.label}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  {isFullPage && fullPageDisabledReason
                    ? fullPageDisabledReason
                    : opt.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 text-center text-[10px] text-zinc-400">
        Full Page works on regular website tabs only
      </p>
    </div>
  )
}
