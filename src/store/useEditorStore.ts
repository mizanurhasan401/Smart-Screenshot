import { create } from 'zustand'
import type {
  AnnotationObject,
  DrawPreview,
  EditorSnapshot,
  Rect,
  ToolType,
  ZoomLevel,
} from '@/types/editor'
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from '@/types/editor'

interface EditorState {
  activeTool: ToolType
  selectedObjectId: string | null
  zoomLevel: ZoomLevel
  panOffset: { x: number; y: number }
  selection: Rect | null
  cropRect: Rect | null
  objects: AnnotationObject[]
  drawPreview: DrawPreview | null
  isPanning: boolean
  imageWidth: number
  imageHeight: number
  canUndo: boolean
  canRedo: boolean
  editingTextId: string | null
  defaultColor: string
  defaultStrokeWidth: number
  defaultFontSize: number
  defaultFontFamily: string
  defaultFontWeight: number
  defaultOpacity: number
  defaultBlurStrength: number

  setActiveTool: (tool: ToolType) => void
  setSelectedObjectId: (id: string | null) => void
  setZoomLevel: (level: ZoomLevel) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  setPanOffset: (offset: { x: number; y: number }) => void
  setSelection: (rect: Rect | null) => void
  setCropRect: (rect: Rect | null) => void
  setObjects: (objects: AnnotationObject[]) => void
  addObject: (obj: AnnotationObject) => void
  updateObject: (id: string, updates: Partial<AnnotationObject>) => void
  removeObject: (id: string) => void
  setDrawPreview: (preview: DrawPreview | null) => void
  setIsPanning: (panning: boolean) => void
  setImageDimensions: (width: number, height: number) => void
  setHistoryState: (canUndo: boolean, canRedo: boolean) => void
  setEditingTextId: (id: string | null) => void
  applySnapshot: (snapshot: EditorSnapshot) => void
  getSnapshot: () => EditorSnapshot
  resetCrop: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'selection',
  selectedObjectId: null,
  zoomLevel: 'fit',
  panOffset: { x: 0, y: 0 },
  selection: null,
  cropRect: null,
  objects: [],
  drawPreview: null,
  isPanning: false,
  imageWidth: 0,
  imageHeight: 0,
  canUndo: false,
  canRedo: false,
  editingTextId: null,
  defaultColor: '#ef4444',
  defaultStrokeWidth: 3,
  defaultFontSize: 20,
  defaultFontFamily: 'Inter, system-ui, sans-serif',
  defaultFontWeight: 600,
  defaultOpacity: 0.4,
  defaultBlurStrength: 8,

  setActiveTool: (tool) => set({ activeTool: tool, drawPreview: null }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setZoomLevel: (level) => set({ zoomLevel: level }),
  zoomIn: () => {
    const { zoomLevel } = get()
    if (zoomLevel === 'fit') {
      set({ zoomLevel: 100 })
      return
    }
    set({ zoomLevel: Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX) })
  },
  zoomOut: () => {
    const { zoomLevel } = get()
    if (zoomLevel === 'fit') {
      set({ zoomLevel: 100 })
      return
    }
    if (zoomLevel <= ZOOM_MIN) {
      set({ zoomLevel: 'fit' })
      return
    }
    set({ zoomLevel: Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN) })
  },
  zoomFit: () => set({ zoomLevel: 'fit' }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setSelection: (rect) => set({ selection: rect }),
  setCropRect: (rect) => set({ cropRect: rect }),
  setObjects: (objects) => set({ objects }),
  addObject: (obj) => set((s) => ({ objects: [...s.objects, obj], selectedObjectId: obj.id })),
  updateObject: (id, updates) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...updates } as AnnotationObject : o)),
    })),
  removeObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
    })),
  setDrawPreview: (preview) => set({ drawPreview: preview }),
  setIsPanning: (panning) => set({ isPanning: panning }),
  setImageDimensions: (width, height) =>
    set({
      imageWidth: width,
      imageHeight: height,
      selection: { x: 0, y: 0, width, height },
    }),
  setHistoryState: (canUndo, canRedo) => set({ canUndo, canRedo }),
  setEditingTextId: (id) => set({ editingTextId: id }),
  applySnapshot: (snapshot) =>
    set({
      objects: snapshot.objects,
      selection: snapshot.selection,
      cropRect: snapshot.cropRect,
    }),
  getSnapshot: () => {
    const s = get()
    return {
      objects: structuredClone(s.objects),
      selection: s.selection ? { ...s.selection } : null,
      cropRect: s.cropRect ? { ...s.cropRect } : null,
    }
  },
  resetCrop: () => set({ cropRect: null }),
}))
