import { useState } from 'react'
import type { CaptureSource } from '@/types/capture'
import { openCaptureWindow } from '@/utils/captureDesktop'

const OPTIONS: { source: CaptureSource; label: string; description: string; icon: string }[] = [
  { source: 'screen', label: 'Entire Screen', description: 'Capture full display', icon: '🖥' },
  { source: 'window', label: 'Window', description: 'Capture an app window', icon: '🪟' },
  { source: 'tab', label: 'Browser Tab', description: 'Capture current tab', icon: '🌐' },
]

export default function Popup() {
  const [loading, setLoading] = useState<CaptureSource | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCapture = async (source: CaptureSource) => {
    setLoading(source)
    setError(null)
    try {
      if (source === 'tab') {
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' })
        const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB', dataUrl })
        if (!response?.success) {
          setError(response?.error || 'Capture failed')
        } else {
          window.close()
        }
      } else {
        // Open a persistent window — the action popup closes when the system share dialog appears
        await openCaptureWindow(source)
        window.close()
      }
    } catch {
      setError('Capture failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="w-72 bg-white p-3 dark:bg-zinc-950">
      <h1 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Chrome Screenshot Pro
      </h1>
      <div className="flex flex-col gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.source}
            type="button"
            onClick={() => handleCapture(opt.source)}
            disabled={loading !== null}
            aria-label={`${opt.label}: ${opt.description}`}
            title={opt.description}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
          >
            <span className="text-lg" aria-hidden="true">
              {opt.icon}
            </span>
            <span>
              <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                {loading === opt.source ? 'Capturing…' : opt.label}
              </span>
              <span className="block text-xs text-zinc-500">{opt.description}</span>
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-center text-[10px] text-zinc-400">
        Private · Local · No tracking
      </p>
    </div>
  )
}
