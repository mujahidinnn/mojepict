import { NextRequest, NextResponse } from "next/server";
import { parseKeyPool, withKeyRotation } from "@/lib/api-key-pool";
import { readImageUpload } from "../guard";

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
    console.error("[remove-bg] REMOVE_BG_API_KEY is not set");
    return NextResponse.json(
      { error: "not_configured", message: "This feature is not available right now." },
      { status: 503 },
    );
  }

  const upload = await readImageUpload(req, "remove-bg");
  if (upload instanceof NextResponse) return upload;
  const { file } = upload;

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
  } catch (err) {
    console.error("[remove-bg] upstream unreachable", err);
    return NextResponse.json(
      { error: "upstream_unreachable", message: "Background removal service is unreachable." },
      { status: 502 },
    );
  }

  if (!upstreamRes.ok) {
    const body = await upstreamRes.json().catch(() => null);
    console.error("[remove-bg] upstream error", upstreamRes.status, body?.errors?.[0]?.title);
    const message = "Background removal failed.";
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
