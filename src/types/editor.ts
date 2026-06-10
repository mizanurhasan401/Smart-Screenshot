export type ToolType =
  | 'selection'
  | 'crop'
  | 'text'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'highlight'
  | 'blur'
  | 'pan'

export type ZoomLevel = number | 'fit'

export const ZOOM_MIN = 10
export const ZOOM_MAX = 300
export const ZOOM_STEP = 10

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface BaseObject {
  id: string
  type: ToolType
}

export interface ArrowObject extends BaseObject {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  strokeWidth: number
}

export interface RectObject extends BaseObject {
  type: 'rectangle'
  x: number
  y: number
  width: number
  height: number
  color: string
  strokeWidth: number
  fillColor: string | null
}

export interface CircleObject extends BaseObject {
  type: 'circle'
  x: number
  y: number
  radius: number
  color: string
  strokeWidth: number
  fillColor: string | null
}

export interface TextObject extends BaseObject {
  type: 'text'
  x: number
  y: number
  text: string
  color: string
  fontSize: number
  fontFamily: string
  fontWeight: number
}

export interface HighlightObject extends BaseObject {
  type: 'highlight'
  x: number
  y: number
  width: number
  height: number
  color: string
  opacity: number
}

export interface BlurObject extends BaseObject {
  type: 'blur'
  x: number
  y: number
  width: number
  height: number
  strength: number
}

export type AnnotationObject =
  | ArrowObject
  | RectObject
  | CircleObject
  | TextObject
  | HighlightObject
  | BlurObject

export interface EditorSnapshot {
  objects: AnnotationObject[]
  selection: Rect | null
  cropRect: Rect | null
}

export interface DrawPreview {
  type: ToolType
  start: Point
  current: Point
}

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
