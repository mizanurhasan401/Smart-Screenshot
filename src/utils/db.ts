import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CaptureSession } from '@/types/capture'

interface ScreenshotDB extends DBSchema {
  sessions: {
    key: string
    value: CaptureSession
    indexes: { 'by-created': number }
  }
}

const DB_NAME = 'screenshot-pro'
const DB_VERSION = 1
const TTL_MS = 24 * 60 * 60 * 1000

let dbPromise: Promise<IDBPDatabase<ScreenshotDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScreenshotDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' })
        store.createIndex('by-created', 'createdAt')
      },
    })
  }
  return dbPromise
}

export async function saveSession(session: CaptureSession): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getSession(id: string): Promise<CaptureSession | undefined> {
  const db = await getDB()
  return db.get('sessions', id)
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('sessions', id)
}

export async function cleanupOldSessions(): Promise<void> {
  const db = await getDB()
  const cutoff = Date.now() - TTL_MS
  const tx = db.transaction('sessions', 'readwrite')
  const index = tx.store.index('by-created')
  let cursor = await index.openCursor()

  while (cursor) {
    if (cursor.value.createdAt < cutoff) {
      await cursor.delete()
    }
    cursor = await cursor.continue()
  }
  await tx.done
}
