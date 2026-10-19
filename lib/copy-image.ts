/**
 * Clipboard image write is broadly supported only for image/png, so every
 * caller normalizes to PNG before handing a blob to copyImageToClipboard,
 * even if the tool's own download format is jpeg/webp/svg/etc.
 */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Clipboard image write is not supported in this browser.");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type || "image/png"]: blob }),
  ]);
}

/**
 * Reads an SVG's intended pixel size from its root width/height attributes,
 * falling back to the viewBox. Without this, <img> decodes a size-less SVG at 300×150.
 */
export function svgSize(svg: string): { width: number; height: number } | undefined {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!tag) return undefined;
  const attr = (name: string) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, "i"));
  const w = attr("width");
  const h = attr("height");
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  const vb = tag.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (vb) return { width: Number(vb[1]), height: Number(vb[2]) };
  return undefined;
}

/**
 * Rasterizes an <img>-loadable source (data/blob/object URL) to a PNG blob via canvas.
 * Pass `size` for SVG sources so the output isn't the 300×150 default.
 */
export function rasterizeToPngBlob(
  src: string,
  size?: { width: number; height: number },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(size?.width ?? img.naturalWidth);
      canvas.height = Math.round(size?.height ?? img.naturalHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable."));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to rasterize image."));
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load image source."));
    img.src = src;
  });
}

/** Converts any image blob (jpeg/webp/svg/...) to PNG via canvas. */
export async function toPngBlob(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const size = blob.type.startsWith("image/svg") ? svgSize(await blob.text()) : undefined;
  const url = URL.createObjectURL(blob);
  try {
    return await rasterizeToPngBlob(url, size);
  } finally {
    URL.revokeObjectURL(url);
  }
}
