const STORAGE_KEY = "mojepict:recent-tools";
const MAX_RECENT = 3;

/** Records a tool visit (by slug) in localStorage, most-recent first. */
export function recordRecentTool(slug: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getRecentTools();
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, MAX_RECENT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, etc.); silently skip.
  }
}

export function getRecentTools(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
