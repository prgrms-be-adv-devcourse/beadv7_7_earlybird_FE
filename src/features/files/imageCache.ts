const DB_NAME = "earlybird_image_cache";
const STORE_NAME = "images";
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalImage(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(dataUrl, key);
  } catch {
    try {
      localStorage.setItem(`img_cache_${key}`, dataUrl);
    } catch {
      // Ignore quota exceeded
    }
  }
}

export async function getLocalImage(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as string);
        } else {
          resolve(localStorage.getItem(`img_cache_${key}`));
        }
      };
      request.onerror = () => resolve(localStorage.getItem(`img_cache_${key}`));
    });
  } catch {
    return localStorage.getItem(`img_cache_${key}`);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
