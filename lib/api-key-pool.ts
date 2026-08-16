/** Parses a comma-separated env var into a list of trimmed, non-empty keys. */
export function parseKeyPool(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

/**
 * Tries `attempt(key)` against each key in the pool, in order. Stops and
 * returns as soon as a key succeeds (`res.ok`) or fails for a reason that
 * isn't key-related (`shouldRotate` returns false — e.g. a malformed image
 * should fail fast, not burn through the whole pool). If every key is
 * exhausted/invalid, returns the last response.
 */
export async function withKeyRotation(
  keys: string[],
  attempt: (key: string) => Promise<Response>,
  shouldRotate: (res: Response) => boolean,
): Promise<Response> {
  let lastRes: Response | null = null;
  for (const key of keys) {
    const res = await attempt(key);
    if (res.ok || !shouldRotate(res)) return res;
    lastRes = res;
  }
  return lastRes as Response;
}
