import type { ToolType } from '@/types/editor'

export type ShortcutGroup =
  | 'Tools'
  | 'History'
  | 'Export'
  | 'Zoom'
  | 'Selection'
  | 'Navigation'
  | 'General'

export interface ShortcutItem {
  id: string
  label: string
  keys: string[]
  group: ShortcutGroup
}

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

const KEY_LABELS: Record<string, string> = {
  mod: isMac ? '⌘' : 'Ctrl',
  shift: isMac ? '⇧' : 'Shift',
  alt: isMac ? '⌥' : 'Alt',
  '+': '+',
  '-': '−',
  '=': '=',
  '0': '0',
  scroll: 'Scroll',
  drag: 'Drag',
}

export function formatKey(key: string): string {
  const lower = key.toLowerCase()
  if (KEY_LABELS[lower]) return KEY_LABELS[lower]
  if (KEY_LABELS[key]) return KEY_LABELS[key]
  return key.length === 1 ? key.toUpperCase() : key
}

export function formatShortcut(keys: string[]): string {
  const parts = keys.map(formatKey)
  return isMac ? parts.join('') : parts.join(' + ')
}

export const TOOL_SHORTCUT_KEYS: Record<ToolType, string> = {
  selection: 'S',
  pan: 'P',
  crop: 'C',
  text: 'T',
  arrow: 'A',
  rectangle: 'R',
  circle: 'O',
  highlight: 'H',
  blur: 'B',
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  'Tools',
  'History',
  'Export',
  'Zoom',
  'Selection',
  'Navigation',
  'General',
]

export const SHORTCUTS: ShortcutItem[] = [
  { id: 'tool-select', label: 'Select', keys: ['S'], group: 'Tools' },
  { id: 'tool-pan', label: 'Move', keys: ['P'], group: 'Tools' },
  { id: 'tool-crop', label: 'Crop', keys: ['C'], group: 'Tools' },
  { id: 'tool-text', label: 'Text', keys: ['T'], group: 'Tools' },
  { id: 'tool-arrow', label: 'Arrow', keys: ['A'], group: 'Tools' },
  { id: 'tool-rectangle', label: 'Rectangle', keys: ['R'], group: 'Tools' },
  { id: 'tool-circle', label: 'Circle', keys: ['O'], group: 'Tools' },
  { id: 'tool-highlight', label: 'Highlight', keys: ['H'], group: 'Tools' },
  { id: 'tool-blur', label: 'Blur', keys: ['B'], group: 'Tools' },

  { id: 'undo', label: 'Undo', keys: ['mod', 'Z'], group: 'History' },
  { id: 'redo', label: 'Redo', keys: ['mod', 'shift', 'Z'], group: 'History' },

  { id: 'copy', label: 'Copy image', keys: ['mod', 'C'], group: 'Export' },
  { id: 'download', label: 'Download PNG', keys: ['mod', 'S'], group: 'Export' },

  { id: 'zoom-in', label: 'Zoom in', keys: ['mod', '+'], group: 'Zoom' },
  { id: 'zoom-out', label: 'Zoom out', keys: ['mod', '-'], group: 'Zoom' },
  { id: 'zoom-fit', label: 'Fit to screen', keys: ['mod', '0'], group: 'Zoom' },
  { id: 'zoom-scroll', label: 'Zoom with scroll', keys: ['mod', 'scroll'], group: 'Zoom' },

  { id: 'delete', label: 'Delete selected', keys: ['Delete'], group: 'Selection' },
  { id: 'deselect', label: 'Deselect / cancel', keys: ['Escape'], group: 'Selection' },

  { id: 'pan-drag', label: 'Pan image', keys: ['mod', 'drag'], group: 'Navigation' },

  { id: 'shortcuts-help', label: 'Keyboard shortcuts', keys: ['?'], group: 'General' },
]

export function getShortcutLabel(id: string): string {
  const item = SHORTCUTS.find((s) => s.id === id)
  return item ? formatShortcut(item.keys) : ''
}

export function getToolShortcut(tool: ToolType): string {
  return TOOL_SHORTCUT_KEYS[tool]
}

export function getPanToolShortcutHint(): string {
  const mod = isMac ? '⌘' : 'Ctrl'
  return `${getToolShortcut('pan')} or ${mod} + Drag`
}

export function groupShortcuts(): Map<ShortcutGroup, ShortcutItem[]> {
  const map = new Map<ShortcutGroup, ShortcutItem[]>()
  for (const group of SHORTCUT_GROUPS) {
    const items = SHORTCUTS.filter((s) => s.group === group)
    if (items.length > 0) map.set(group, items)
  }
  return map
}
