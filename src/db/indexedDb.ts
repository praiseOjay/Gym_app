/**
 * IndexedDB persistence layer for Overload AI.
 * Provides high-capacity asynchronous client-side storage, removing the 5MB localStorage limit.
 */
import type { WorkoutSession, Routine, PRRecord, UserSettings, BodyWeightEntry } from '../types/gym';

const DB_NAME = 'OverloadAIDB';
const DB_VERSION = 1;

export const STORES = {
  WORKOUTS: 'workouts',
  ROUTINES: 'routines',
  PRS: 'prs',
  BODYWEIGHT: 'bodyweight',
  KV: 'app_kv'
} as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function getDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
          db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ROUTINES)) {
          db.createObjectStore(STORES.ROUTINES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PRS)) {
          db.createObjectStore(STORES.PRS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.BODYWEIGHT)) {
          db.createObjectStore(STORES.BODYWEIGHT, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.KV)) {
          db.createObjectStore(STORES.KV, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (err) => {
        console.warn('IndexedDB failed to open, falling back to localStorage:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB initialization exception:', e);
      resolve(null);
    }
  });

  return dbPromise;
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function putManyInStore<T>(storeName: string, items: T[]): Promise<void> {
  const db = await getDB();
  if (!db || items.length === 0) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearObjectStore(storeName: string): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getKVStore<T>(key: string): Promise<T | null> {
  const db = await getDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.KV, 'readonly');
      const store = tx.objectStore(STORES.KV);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && 'value' in req.result) {
          resolve(req.result.value as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function setKVStore<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.KV, 'readwrite');
      const store = tx.objectStore(STORES.KV);
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function migrateFromLocalStorage(
  workouts: WorkoutSession[],
  routines: Routine[],
  prs: PRRecord[],
  settings: UserSettings,
  bodyWeightLogs: BodyWeightEntry[],
  activeSession: WorkoutSession | null
): Promise<void> {
  try {
    const existingWorkouts = await getAllFromStore<WorkoutSession>(STORES.WORKOUTS);
    if (existingWorkouts.length === 0 && workouts.length > 0) {
      await putManyInStore(STORES.WORKOUTS, workouts);
    }

    const existingRoutines = await getAllFromStore<Routine>(STORES.ROUTINES);
    if (existingRoutines.length === 0 && routines.length > 0) {
      await putManyInStore(STORES.ROUTINES, routines);
    }

    const existingPRs = await getAllFromStore<PRRecord>(STORES.PRS);
    if (existingPRs.length === 0 && prs.length > 0) {
      await putManyInStore(STORES.PRS, prs);
    }

    const existingBW = await getAllFromStore<BodyWeightEntry>(STORES.BODYWEIGHT);
    if (existingBW.length === 0 && bodyWeightLogs.length > 0) {
      await putManyInStore(STORES.BODYWEIGHT, bodyWeightLogs);
    }

    await setKVStore('settings', settings);
    if (activeSession) {
      await setKVStore('activeSession', activeSession);
    }
  } catch (err) {
    console.warn('IndexedDB migration notice:', err);
  }
}

export const IndexedDBService = {
  getAll: getAllFromStore,
  put: putInStore,
  putMany: putManyInStore,
  delete: deleteFromStore,
  clearStore: clearObjectStore,
  getKV: getKVStore,
  setKV: setKVStore,
  migrateFromLocalStorage
};
