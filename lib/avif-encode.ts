import { initEmscriptenModule } from "@jsquash/avif/utils.js";
import { defaultOptions, type EncodeOptions } from "@jsquash/avif/meta.js";

/**
 * jSquash's default `encode()` auto-picks the multi-threaded codec whenever
 * the browser *claims* thread support, but that codec needs cross-origin
 * isolation (COOP/COEP headers) to actually use SharedArrayBuffer - which
 * this site doesn't set, and the mismatch crashes the tab instead of
 * failing gracefully. Importing the single-threaded codec directly sidesteps
 * that detection entirely.
 */
let modulePromise: ReturnType<typeof initEmscriptenModule> | null = null;

async function getModule() {
  if (!modulePromise) {
    const { default: moduleFactory } = await import("@jsquash/avif/codec/enc/avif_enc.js");
    modulePromise = initEmscriptenModule(moduleFactory);
  }
  return modulePromise;
}

export async function encodeAvif(
  data: ImageData,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  const module = await getModule();
  const opts = { ...defaultOptions, ...options };
  const output = module.encode(new Uint8Array(data.data.buffer), data.width, data.height, opts);
  if (!output) throw new Error("AVIF encoding failed.");
  return output.buffer;
}
