import { blobToDataUrl } from '@/utils/image'
import type { CaptureSource } from '@/types/capture'

async function getDesktopStream(streamId: string): Promise<MediaStream> {
  const constraintSets: MediaStreamConstraints[] = [
    {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
    },
    {
      audio: false,
      video: {
        // @ts-expect-error Chrome extension desktop capture constraints
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: streamId,
      },
    },
  ]

  let lastError: Error | null = null
  for (const constraints of constraintSets) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('getUserMedia failed')
    }
  }

  throw lastError ?? new Error('Permission dismissed')
}

async function captureFrameFromStreamId(streamId: string): Promise<Blob> {
  const stream = await getDesktopStream(streamId)

  try {
    const video = document.createElement('video')
    video.srcObject = stream
    video.muted = true

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play().then(resolve).catch(reject)
      }
      video.onerror = () => reject(new Error('Video load failed'))
    })

    await new Promise((r) => requestAnimationFrame(r))

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')

    ctx.drawImage(video, 0, 0)

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Blob conversion failed'))),
        'image/png',
      )
    })
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}

function captureDesktop(source: 'screen' | 'window'): Promise<Blob> {
  const sources = (source === 'screen' ? ['screen'] : ['window']) as [
    chrome.desktopCapture.DesktopCaptureSourceType,
  ]

  return new Promise((resolve, reject) => {
    chrome.desktopCapture.chooseDesktopMedia(sources, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (!streamId) {
        reject(new Error('Capture cancelled'))
        return
      }

      captureFrameFromStreamId(streamId).then(resolve).catch(reject)
    })
  })
}

export async function openCaptureWindow(source: 'screen' | 'window'): Promise<void> {
  await chrome.windows.create({
    url: chrome.runtime.getURL(`src/capture/index.html?source=${source}`),
    type: 'popup',
    width: 360,
    height: 140,
    focused: true,
  })
}

export async function completeDesktopCapture(source: CaptureSource): Promise<void> {
  if (source !== 'screen' && source !== 'window') return

  const blob = await captureDesktop(source)
  const dataUrl = await blobToDataUrl(blob)
  const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB', dataUrl })

  if (!response?.success) {
    throw new Error(response?.error || 'Capture failed')
  }

  window.close()
}
