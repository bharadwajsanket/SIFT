/**
 * SIFT Local-First Search History Store
 * 
 * Provides shared, privacy-focused search history storage using IndexedDB.
 * Features:
 * - 100% browser-local; zero cloud telemetry or network persistence.
 * - Deduplicated searches (repeated searches update timestamp to current time).
 * - Multi-tab synchronization via BroadcastChannel and window CustomEvent.
 * - Automatic migration from legacy localStorage 'sift-recent-searches'.
 * - Fallback driver for environments where IndexedDB is unavailable.
 * - Calculator query filtering (calculator expressions are not recorded as web searches).
 */

import { useState, useEffect, useCallback } from 'react';
import { isCalculatorQuery } from './calculator.ts';

export interface SearchHistoryEntry {
  id: string; // Unique normalized identifier (lowercase trimmed query)
  query: string; // The display query text as typed
  category: string; // Search category, e.g. 'all', 'images', 'code', etc.
  timestamp: number; // Unix epoch millisecond timestamp
}

export type HistorySortOption = 'newest' | 'oldest' | 'alpha';
export type HistorySortOrder = HistorySortOption;

const DB_NAME = 'sift_search_history_v1';
const STORE_NAME = 'history';
const DB_VERSION = 1;
const MIGRATION_KEY = 'sift-history-migrated-v1';
const LEGACY_STORAGE_KEY = 'sift-recent-searches';
const HISTORY_EVENT = 'sift-history-updated';
const BROADCAST_CHANNEL = 'sift_history_channel';

// In-memory cache & fallback when IndexedDB is unavailable
const memoryStore: Map<string, SearchHistoryEntry> = new Map();
let isIndexedDBAvailable: boolean | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Initialize cross-tab BroadcastChannel if available in browser
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'history-updated') {
        window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

/**
 * Check whether IndexedDB is available and functioning in the current context.
 */
function checkIndexedDBSupport(): boolean {
  if (isIndexedDBAvailable !== null) return isIndexedDBAvailable;
  if (typeof window === 'undefined') {
    isIndexedDBAvailable = false;
    return false;
  }
  try {
    if (!window.indexedDB) {
      isIndexedDBAvailable = false;
      return false;
    }
    isIndexedDBAvailable = true;
    return true;
  } catch {
    isIndexedDBAvailable = false;
    return false;
  }
}

/**
 * Open or initialize the IndexedDB instance.
 */
export function openHistoryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!checkIndexedDBSupport()) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('query', 'query', { unique: false });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        try {
          await migrateLegacyLocalStorage(db);
        } catch {
          // Non-blocking migration error
        }
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Migrate legacy localStorage 'sift-recent-searches' entries if present and not already migrated.
 */
async function migrateLegacyLocalStorage(db?: IDBDatabase): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const isMigrated = localStorage.getItem(MIGRATION_KEY) === 'true';
    if (isMigrated) return;

    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const legacyList = JSON.parse(stored);
    if (!Array.isArray(legacyList) || legacyList.length === 0) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    // Process from oldest to newest so earlier array items have latest timestamps
    const now = Date.now();
    const reversed = [...legacyList].reverse();
    const entries: SearchHistoryEntry[] = [];

    for (let i = 0; i < reversed.length; i++) {
      const raw = reversed[i];
      if (typeof raw === 'string' && raw.trim().length > 0) {
        const trimmed = raw.trim();
        const id = trimmed.toLowerCase();
        entries.push({
          id,
          query: trimmed,
          category: 'all',
          timestamp: now - (reversed.length - i) * 60000,
        });
      }
    }

    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const entry of entries) {
        store.put(entry);
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      // Store in memory
      for (const entry of entries) {
        memoryStore.set(entry.id, entry);
      }
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (err) {
    console.warn('SIFT search history migration notice:', err);
  }
}

/**
 * Notify all subscribers in this window and across browser tabs of history mutations.
 */
function notifyHistoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
    try {
      broadcastChannel?.postMessage({ type: 'history-updated' });
    } catch {}
  }
}

/**
 * Record a submitted web search.
 * 
 * Repeated Search Behavior:
 * If the user has searched this query previously (case-insensitive match),
 * the entry is deduplicated and refreshed: its timestamp updates to Date.now(),
 * category updates to the current category, and it moves to the top of the history.
 * 
 * Calculator queries are never recorded as web searches.
 */
export async function recordSearch(
  query: string, 
  category = 'all'
): Promise<SearchHistoryEntry | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Pure calculator queries must never be recorded into search history
  if (isCalculatorQuery(trimmed)) {
    return null;
  }

  const id = trimmed.toLowerCase();
  const entry: SearchHistoryEntry = {
    id,
    query: trimmed,
    category: category || 'all',
    timestamp: Date.now(),
  };

  try {
    if (checkIndexedDBSupport()) {
      const db = await openHistoryDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      memoryStore.set(id, entry);
    }
  } catch (err) {
    console.warn('IndexedDB write fallback to memory:', err);
    memoryStore.set(id, entry);
  }

  // Synchronize localStorage legacy mirror for backward compatibility
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      const list: string[] = stored ? JSON.parse(stored) : [];
      const updated = [trimmed, ...list.filter((q) => q.toLowerCase() !== id)].slice(0, 10);
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {}

  notifyHistoryUpdated();
  return entry;
}

/**
 * Retrieve search history entries with filtering, sorting, and pagination options.
 */
export async function getSearchHistory(options?: {
  sort?: HistorySortOption;
  filter?: string;
  limit?: number;
}): Promise<SearchHistoryEntry[]> {
  const { sort = 'newest', filter = '', limit } = options || {};
  let entries: SearchHistoryEntry[] = [];

  try {
    if (checkIndexedDBSupport()) {
      const db = await openHistoryDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      entries = await new Promise<SearchHistoryEntry[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } else {
      entries = Array.from(memoryStore.values());
    }
  } catch (err) {
    console.warn('IndexedDB read fallback to memory/localStorage:', err);
    entries = Array.from(memoryStore.values());
    if (entries.length === 0 && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) {
          const list: string[] = JSON.parse(stored);
          const now = Date.now();
          entries = list.map((q, idx) => ({
            id: q.toLowerCase().trim(),
            query: q.trim(),
            category: 'all',
            timestamp: now - idx * 1000,
          }));
        }
      } catch {}
    }
  }

  // Filter if search query is provided
  const filterTrimmed = filter.trim().toLowerCase();
  if (filterTrimmed) {
    entries = entries.filter((e) => e.query.toLowerCase().includes(filterTrimmed));
  }

  // Sort
  if (sort === 'newest') {
    entries.sort((a, b) => b.timestamp - a.timestamp);
  } else if (sort === 'oldest') {
    entries.sort((a, b) => a.timestamp - b.timestamp);
  } else if (sort === 'alpha') {
    entries.sort((a, b) => a.query.localeCompare(b.query, undefined, { sensitivity: 'base' }));
  }

  // Limit
  if (typeof limit === 'number' && limit > 0) {
    entries = entries.slice(0, limit);
  }

  return entries;
}

/**
 * Delete an individual entry by its normalized identifier.
 */
export async function deleteSearchEntry(id: string): Promise<void> {
  const normalizedId = id.trim().toLowerCase();

  try {
    if (checkIndexedDBSupport()) {
      const db = await openHistoryDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(normalizedId);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (err) {
    console.warn('IndexedDB delete error, continuing with fallback:', err);
  }

  memoryStore.delete(normalizedId);

  // Update legacy mirror
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const list: string[] = JSON.parse(stored);
        const updated = list.filter((q) => q.toLowerCase() !== normalizedId);
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
      }
    }
  } catch {}

  notifyHistoryUpdated();
}

/**
 * Clear all search history entries completely.
 */
export async function clearSearchHistory(): Promise<void> {
  try {
    if (checkIndexedDBSupport()) {
      const db = await openHistoryDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (err) {
    console.warn('IndexedDB clear error, continuing with fallback:', err);
  }

  memoryStore.clear();

  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {}

  notifyHistoryUpdated();
}

/**
 * React Hook for consuming and managing Search History.
 */
export function useSearchHistory(options?: {
  sort?: HistorySortOption;
  filter?: string;
  limit?: number;
}) {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sort = options?.sort || 'newest';
  const filter = options?.filter || '';
  const limit = options?.limit;

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSearchHistory({ sort, filter, limit });
      setEntries(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load search history');
    } finally {
      setLoading(false);
    }
  }, [sort, filter, limit]);

  useEffect(() => {
    loadEntries();

    const handleUpdate = () => {
      loadEntries();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(HISTORY_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener(HISTORY_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, [loadEntries]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteSearchEntry(id);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete search entry');
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await clearSearchHistory();
    } catch (err: any) {
      setError(err?.message || 'Failed to clear search history');
    }
  }, []);

  return {
    history: entries,
    entries,
    isLoading: loading,
    loading,
    error,
    remove,
    deleteEntry: remove,
    clear,
    clearAll: clear,
    refresh: loadEntries,
  };
}
