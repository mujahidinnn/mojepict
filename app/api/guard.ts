import { NextRequest, NextResponse } from "next/server";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

// ponytail: in-memory, per-instance limiter; serverless/multi-instance needs a shared store (KV/Redis) to be effective.
const hits = new Map<string, { count: number; reset: number }>();

const fail = (error: string, message: string, status: number) =>
  NextResponse.json({ error, message }, { status });

function sameOrigin(req: NextRequest) {
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

function rateLimited(bucket: string, req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset <= now) {
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  return ++entry.count > MAX_REQUESTS;
}

/** Shared checks for the upload proxies; returns the parsed form + image, or an error response. */
export async function readImageUpload(
  req: NextRequest,
  bucket: string,
): Promise<{ form: FormData; file: File } | NextResponse> {
  if (!sameOrigin(req)) return fail("forbidden", "Cross-origin requests are not allowed.", 403);
  if (rateLimited(bucket, req)) return fail("rate_limited", "Too many requests, try again later.", 429);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES)
    return fail("too_large", "File is too large.", 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("bad_request", "Invalid form data.", 400);
  }
  const file = form.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/"))
    return fail("bad_request", "Missing or invalid 'image' file.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("too_large", "File is too large.", 413);
  return { form, file };
}
