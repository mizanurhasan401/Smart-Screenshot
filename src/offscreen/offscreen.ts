import type { MessageType } from '@/types/capture'

async function captureFrame(streamId: string): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      // @ts-expect-error Chrome extension desktop capture constraints
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: streamId,
    },
  })

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

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Blob conversion failed'))),
        'image/png',
      )
    })

    return blob
  } finally {
    stream.getTracks().forEach((track) => track.stop())
  }
}

chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse: (response?: unknown) => void) => {
    if (message.type === 'CAPTURE_FRAME') {
      captureFrame(message.streamId)
        .then((blob) => sendResponse({ blob }))
        .catch((err: Error) => sendResponse({ error: err.message }))
      return true
    }
    return false
  },
)
