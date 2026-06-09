import { useEffect, useRef, useState } from 'react'
import { completeDesktopCapture } from '@/utils/captureDesktop'
import type { CaptureSource } from '@/types/capture'

function getSource(): CaptureSource | null {
  const source = new URLSearchParams(window.location.search).get('source')
  if (source === 'screen' || source === 'window') return source
  return null
}

export default function CapturePage() {
  const source = getSource()
  const started = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  const runCapture = async () => {
    if (!source || started.current) return
    started.current = true
    setBusy(true)
    setError(null)

    try {
      await completeDesktopCapture(source)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Capture failed'
      setError(message)
      setBusy(false)
      started.current = false
    }
  }

  useEffect(() => {
    void runCapture()
  }, [])

  if (!source) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-red-500">
        Invalid capture source
      </div>
    )
  }

  const label = source === 'screen' ? 'Entire Screen' : 'Window'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-white p-4 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {busy ? `Select ${label} to share…` : `Select ${label}`}
      </p>
      {error && (
        <p className="text-center text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      {!busy && (
        <button
          type="button"
          onClick={() => void runCapture()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Try again
        </button>
      )}
    </div>
  )
}
