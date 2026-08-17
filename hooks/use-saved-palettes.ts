export interface SavedPalette {
  id: string;
  colors: string[];
  savedAt: number;
}

const STORAGE_KEY = "mojepict:saved-palettes";
const MAX_SAVED = 20;

export function getSavedPalettes(): SavedPalette[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list: SavedPalette[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable (private mode, etc.); silently skip.
  }
}

export function savePalette(colors: string[]): SavedPalette[] {
  const next = [
    { id: crypto.randomUUID(), colors, savedAt: Date.now() },
    ...getSavedPalettes(),
  ].slice(0, MAX_SAVED);
  persist(next);
  return next;
}

export function removeSavedPalette(id: string): SavedPalette[] {
  const next = getSavedPalettes().filter((p) => p.id !== id);
  persist(next);
  return next;
}
