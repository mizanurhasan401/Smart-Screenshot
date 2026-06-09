export type CaptureSource = 'screen' | 'window' | 'tab'

export interface CaptureSession {
  id: string
  blob: Blob
  width: number
  height: number
  createdAt: number
}

export type MessageType =
  | { type: 'CAPTURE_TAB'; dataUrl: string }
  | { type: 'CAPTURE_FRAME'; streamId: string }
  | { type: 'CAPTURE_RESULT'; success: boolean; sessionId?: string; error?: string }
  | { type: 'FRAME_CAPTURED'; blob?: Blob; error?: string }
