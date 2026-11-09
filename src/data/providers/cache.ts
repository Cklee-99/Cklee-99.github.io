/* Resilient client-side cache for normalized provider datasets. Keyed by
   provider, symbol, and inclusive date range so an exact browser-visible
   re-request never re-fetches. IndexedDB is preferred where the global
   `indexedDB` is present; most browsers do not expose that global, so a
   localStorage fallback keeps caching working cross-browser. Any storage
   failure degrades to a no-op and never crashes the app or blocks a fresh
   fetch. */

import type { DataRequest, MarketDataset } from '../market'

const DATABASE_NAME = 'quantfolio-lab-market-data'
const STORE_NAME = 'datasets'
const LS_PREFIX = 'qfl.cache.'

interface CacheRecord {
  key: string
  dataset: MarketDataset
}

export function cacheKey(request: DataRequest, providerId: string): string {
  return `${providerId}|${request.symbol.trim().toUpperCase()}|${request.startDate}|${request.endDate}`
}

function localStorageRead(key: string): MarketDataset | null {
  try {
    const text = localStorage.getItem(`${LS_PREFIX}${key}`)
    if (!text) return null
    const record: CacheRecord = JSON.parse(text)
    if (!record || record.key !== key || !record.dataset) return null
    return record.dataset
  } catch {
    return null
  }
}

function localStorageWrite(key: string, dataset: MarketDataset): void {
  try {
    const record: CacheRecord = { key, dataset }
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(record))
  } catch {
    // Storage may be full, unavailable, or reject the payload. Ignore.
  }
}

/** IndexedDB open that resolves null on absence or any failure. */
function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DATABASE_NAME)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME)
      }
      request.onsuccess = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close()
          resolve(null)
        } else {
          resolve(db)
        }
      }
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function indexRead(key: string): Promise<MarketDataset | null> {
  const db = openDatabase()
  return db.then((database) => {
    if (!database) return Promise.resolve(null)
    try {
      return new Promise<MarketDataset | null>((resolve) => {
        try {
          const tx = database.transaction(STORE_NAME)
          const result = tx.objectStore(STORE_NAME).get(key) as IDBRequest<CacheRecord>
          result.onsuccess = () => {
            const record = result.result
            database.close()
            resolve(record && record.key === key ? record.dataset : null)
          }
          result.onerror = () => {
            database.close()
            resolve(null)
          }
        } catch {
          database.close()
          resolve(null)
        }
      })
    } catch {
      database.close()
      return Promise.resolve(null)
    }
  })
}

function indexWrite(key: string, dataset: MarketDataset): Promise<void> {
  const db = openDatabase()
  return db.then((database) => {
    if (!database) return Promise.resolve()
    try {
      return new Promise<void>((resolve) => {
        try {
          const tx = database.transaction(STORE_NAME)
          const result = tx.objectStore(STORE_NAME).add({ key, dataset }, key)
          result.onsuccess = () => {
            database.close()
            resolve()
          }
          result.onerror = () => {
            database.close()
            resolve()
          }
        } catch {
          database.close()
          resolve()
        }
      })
    } catch {
      database.close()
      return Promise.resolve()
    }
  })
}

/** Returns a cached dataset for the exact key, else null. */
export function loadDatasetCache(request: DataRequest, providerId: string): Promise<MarketDataset | null> {
  const key = cacheKey(request, providerId)
  const local = localStorageRead(key)
  if (local) return Promise.resolve(local)
  return indexRead(key)
}

/** Stores a normalized dataset under the request key when storage is usable. */
export function saveDatasetCache(request: DataRequest, providerId: string, dataset: MarketDataset): Promise<void> {
  const key = cacheKey(request, providerId)
  localStorageWrite(key, dataset)
  const index = indexWrite(key, dataset)
  return index.then(() => undefined)
}
