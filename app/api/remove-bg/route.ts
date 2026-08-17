import { NextRequest, NextResponse } from "next/server";
import { parseKeyPool, withKeyRotation } from "@/lib/api-key-pool";

export const runtime = "nodejs";

// remove.bg signals a bad/exhausted key with one of these; worth trying the
// next key in the pool. Anything else (e.g. a malformed image) shouldn't burn
// through the whole pool.
const ROTATE_ON_STATUS = new Set([402, 403, 429]);

/**
 * Proxies background removal to the remove.bg API. Keys stay server-side
 * only (REMOVE_BG_API_KEY); the client never sees them. Supports a
 * comma-separated list of keys: if one is out of credits or invalid, the
 * next one is tried automatically.
 */
export async function POST(req: NextRequest) {
  const keys = parseKeyPool(process.env.REMOVE_BG_API_KEY);
  if (keys.length === 0) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: "REMOVE_BG_API_KEY is not set on the server.",
      },
      { status: 503 },
    );
  }

  const incoming = await req.formData();
  const file = incoming.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "bad_request", message: "Missing 'image' file in form data." },
      { status: 400 },
    );
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await withKeyRotation(
      keys,
      (key) => {
        const upstreamForm = new FormData();
        upstreamForm.append("image_file", file, file.name);
        upstreamForm.append("size", "auto");
        return fetch("https://api.remove.bg/v1.0/removebg", {
          method: "POST",
          headers: { "X-Api-Key": key },
          body: upstreamForm,
        });
      },
      (res) => ROTATE_ON_STATUS.has(res.status),
    );
  } catch {
    return NextResponse.json(
      { error: "upstream_unreachable", message: "Could not reach remove.bg." },
      { status: 502 },
    );
  }

  if (!upstreamRes.ok) {
    const body = await upstreamRes.json().catch(() => null);
    const message =
      body?.errors?.[0]?.title ?? "Background removal failed upstream.";
    const status =
      upstreamRes.status === 429
        ? 429
        : upstreamRes.status === 402
          ? 402 // all keys' credits exhausted
          : upstreamRes.status === 403
            ? 503 // all keys bad/revoked
            : 502;
    return NextResponse.json({ error: "upstream_error", message }, { status });
  }

  const bytes = await upstreamRes.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
