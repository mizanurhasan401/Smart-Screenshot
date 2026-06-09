import type { EditorSnapshot } from '@/types/editor'

export class HistoryManager {
  private undoStack: EditorSnapshot[] = []
  private redoStack: EditorSnapshot[] = []

  push(snapshot: EditorSnapshot): void {
    this.undoStack.push(structuredClone(snapshot))
    this.redoStack = []
  }

  undo(current: EditorSnapshot): EditorSnapshot | null {
    if (this.undoStack.length === 0) return null
    this.redoStack.push(structuredClone(current))
    return this.undoStack.pop() ?? null
  }

  redo(current: EditorSnapshot): EditorSnapshot | null {
    if (this.redoStack.length === 0) return null
    this.undoStack.push(structuredClone(current))
    return this.redoStack.pop() ?? null
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
