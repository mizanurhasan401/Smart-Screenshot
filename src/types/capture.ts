export type CaptureMode = 'visible' | 'fullpage'

export interface CaptureSession {
  id: string
  blob: Blob
  width: number
  height: number
  url?: string
  title?: string
  createdAt: number
}

export type MessageType =
  | { type: 'CAPTURE_REQUEST'; mode: CaptureMode; tabId: number }
