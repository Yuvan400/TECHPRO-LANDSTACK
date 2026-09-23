// IndexedDB helper for LandStack offline caching and queueing
const DB_NAME = 'LandStack_Offline_DB';
const DB_VERSION = 1;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Object store for cached parcels
      if (!db.objectStoreNames.contains('parcels')) {
        db.createObjectStore('parcels', { keyPath: 'ulpin' });
      }
      // Object store for offline action queue (e.g. applications, field verifications)
      if (!db.objectStoreNames.contains('offline_queue')) {
        const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      // Object store for user cache
      if (!db.objectStoreNames.contains('user_cache')) {
        db.createObjectStore('user_cache', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const cacheParcels = async (parcels) => {
  try {
    const db = await openDB();
    const tx = db.transaction('parcels', 'readwrite');
    const store = tx.objectStore('parcels');
    parcels.forEach(p => store.put(p));
    return new Promise((res) => {
      tx.oncomplete = () => res(true);
    });
  } catch (err) {
    console.warn('Failed to cache parcels in IndexedDB:', err);
    return false;
  }
};

export const getCachedParcels = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('parcels', 'readonly');
    const store = tx.objectStore('parcels');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const getCachedParcelByUlpin = async (ulpin) => {
  try {
    const db = await openDB();
    const tx = db.transaction('parcels', 'readonly');
    const store = tx.objectStore('parcels');
    const request = store.get(ulpin);
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const enqueueOfflineAction = async (actionType, payload) => {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    const item = {
      type: actionType,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    };
    store.add(item);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    console.warn('Failed to enqueue offline action:', err);
    return false;
  }
};

export const getQueuedActions = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const removeQueuedAction = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch {
    return false;
  }
};

export const clearQueue = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    tx.objectStore('offline_queue').clear();
    return new Promise((res) => {
      tx.oncomplete = () => res(true);
    });
  } catch {
    return false;
  }
};
