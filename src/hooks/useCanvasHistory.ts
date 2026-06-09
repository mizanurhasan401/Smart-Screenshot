import { useCallback, useRef } from 'react'
import { HistoryManager } from '@/editor/HistoryManager'
import { useEditorStore } from '@/store/useEditorStore'

export function useCanvasHistory() {
  const historyRef = useRef(new HistoryManager())
  const getSnapshot = useEditorStore((s) => s.getSnapshot)
  const applySnapshot = useEditorStore((s) => s.applySnapshot)
  const setHistoryState = useEditorStore((s) => s.setHistoryState)

  const syncHistoryState = useCallback(() => {
    const hm = historyRef.current
    setHistoryState(hm.canUndo(), hm.canRedo())
  }, [setHistoryState])

  const pushHistory = useCallback(() => {
    historyRef.current.push(getSnapshot())
    syncHistoryState()
  }, [getSnapshot, syncHistoryState])

  const undo = useCallback(() => {
    const snapshot = historyRef.current.undo(getSnapshot())
    if (snapshot) {
      applySnapshot(snapshot)
      syncHistoryState()
    }
  }, [applySnapshot, getSnapshot, syncHistoryState])

  const redo = useCallback(() => {
    const snapshot = historyRef.current.redo(getSnapshot())
    if (snapshot) {
      applySnapshot(snapshot)
      syncHistoryState()
    }
  }, [applySnapshot, getSnapshot, syncHistoryState])

  return { pushHistory, undo, redo, syncHistoryState }
}
