import { NextRequest, NextResponse } from "next/server";
import { parseKeyPool, withKeyRotation } from "@/lib/api-key-pool";
import { readImageUpload } from "../guard";

export const runtime = "nodejs";

const ALLOWED_FORMATS = new Set(["image/webp", "image/png", "image/jpeg"]);

// Tinify signals a bad key (401) or an exhausted monthly quota (429); worth
// trying the next key in the pool. Anything else shouldn't burn through it.
const ROTATE_ON_STATUS = new Set([401, 429]);

/**
 * Proxies compression to the Tinify (TinyPNG) API. Keys stay server-side
 * only (TINIFY_API_KEY); the client never sees them. Supports a
 * comma-separated list of keys: if one is out of quota or invalid, the next
 * one is tried automatically.
 */
export async function POST(req: NextRequest) {
  const keys = parseKeyPool(process.env.TINIFY_API_KEY);
  if (keys.length === 0) {
    console.error("[compress] TINIFY_API_KEY is not set");
    return NextResponse.json(
      { error: "not_configured", message: "This feature is not available right now." },
      { status: 503 },
    );
  }

  const upload = await readImageUpload(req, "compress");
  if (upload instanceof NextResponse) return upload;
  const { form: incoming, file } = upload;
  const format = incoming.get("format");
  const convertTo =
    typeof format === "string" && ALLOWED_FORMATS.has(format) ? format : null;

  const imageBytes = await file.arrayBuffer();
  const authFor = (key: string) =>
    "Basic " + Buffer.from(`api:${key}`).toString("base64");

  let usedKey = "";
  let shrinkRes: Response;
  try {
    shrinkRes = await withKeyRotation(
      keys,
      (key) => {
        usedKey = key;
        return fetch("https://api.tinify.com/shrink", {
          method: "POST",
          headers: { Authorization: authFor(key) },
          body: imageBytes,
        });
      },
      (res) => ROTATE_ON_STATUS.has(res.status),
    );
  } catch (err) {
    console.error("[compress] upstream unreachable", err);
    return NextResponse.json(
      { error: "upstream_unreachable", message: "Compression service is unreachable." },
      { status: 502 },
    );
  }

  if (!shrinkRes.ok) {
    const body = await shrinkRes.json().catch(() => null);
    console.error("[compress] upstream error", shrinkRes.status, body?.message);
    const message = "Compression failed.";
    const status =
      shrinkRes.status === 429
        ? 429 // all keys' quota exhausted
        : shrinkRes.status === 401
          ? 503 // all keys bad/revoked
          : 502;
    return NextResponse.json({ error: "upstream_error", message }, { status });
  }

  const shrinkJson = await shrinkRes.json();
  const outputUrl: string | undefined = shrinkJson?.output?.url;
  if (!outputUrl || !URL.canParse(outputUrl) || new URL(outputUrl).hostname !== "api.tinify.com") {
    console.error("[compress] unexpected output url", outputUrl);
    return NextResponse.json(
      { error: "upstream_error", message: "Compression failed." },
      { status: 502 },
    );
  }

  const auth = authFor(usedKey);
  const downloadRes = await fetch(outputUrl, {
    method: convertTo ? "POST" : "GET",
    headers: {
      Authorization: auth,
      ...(convertTo ? { "Content-Type": "application/json" } : {}),
    },
    body: convertTo ? JSON.stringify({ convert: { type: convertTo } }) : undefined,
  });

  if (!downloadRes.ok) {
    return NextResponse.json(
      { error: "upstream_error", message: "Failed to download compressed image." },
      { status: 502 },
    );
  }

  const outBytes = await downloadRes.arrayBuffer();
  const contentType = downloadRes.headers.get("content-type") ?? file.type;

  return new NextResponse(outBytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-Original-Size": String(shrinkJson.input?.size ?? file.size),
      "X-Compressed-Size": String(shrinkJson.output?.size ?? outBytes.byteLength),
    },
  });
}
