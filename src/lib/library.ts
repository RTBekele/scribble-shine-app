"use client";

/**
 * Tiny IndexedDB-backed library for stories and drawings.
 * Replaces the old localStorage approach which silently failed for
 * stories containing multiple base64 illustrations (>5MB quota).
 *
 * Falls back to localStorage if IndexedDB is unavailable (rare).
 */

export type StoryItem = {
  id: string;
  type: "story";
  savedAt: string;
  childName?: string;
  story: {
    title: string;
    language?: string;
    pages: { page: number; text: string; illustrationPrompt?: string }[];
  };
  images: Record<string, string>; // page number → data URL
};

export type DrawingItem = {
  id: string;
  type: "drawing";
  savedAt: string;
  title?: string;
  dataUrl: string;
};

export type LibraryItem = StoryItem | DrawingItem;

const DB_NAME = "scribble-shine";
const STORE = "library";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("savedAt", "savedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function hasIDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

/** Migrate any old localStorage items into IndexedDB once. */
async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("scribble:library");
  if (!raw) return;
  try {
    const items: LibraryItem[] = JSON.parse(raw);
    for (const it of items) {
      try {
        await saveItem(it);
      } catch {
        /* ignore individual failures */
      }
    }
    localStorage.removeItem("scribble:library");
  } catch {
    /* invalid old data — drop it */
    localStorage.removeItem("scribble:library");
  }
}

export async function saveItem(item: LibraryItem): Promise<void> {
  if (!hasIDB()) {
    // fallback: try localStorage; will throw on quota — caller can decide
    const raw = localStorage.getItem("scribble:library") || "[]";
    const prev: LibraryItem[] = JSON.parse(raw);
    prev.unshift(item);
    localStorage.setItem("scribble:library", JSON.stringify(prev.slice(0, 50)));
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}

export async function listItems(): Promise<LibraryItem[]> {
  await migrateFromLocalStorage();
  if (!hasIDB()) {
    const raw = localStorage.getItem("scribble:library") || "[]";
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  const db = await openDb();
  const items: LibraryItem[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as LibraryItem[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  // newest first
  return items.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function deleteItem(id: string): Promise<void> {
  if (!hasIDB()) {
    const raw = localStorage.getItem("scribble:library") || "[]";
    const prev: LibraryItem[] = JSON.parse(raw);
    localStorage.setItem(
      "scribble:library",
      JSON.stringify(prev.filter((i) => i.id !== id))
    );
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
