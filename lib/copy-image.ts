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

/** Rasterizes an <img>-loadable source (data/blob/object URL) to a PNG blob via canvas. */
export function rasterizeToPngBlob(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable."));
        return;
      }
      ctx.drawImage(img, 0, 0);
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
  const url = URL.createObjectURL(blob);
  try {
    return await rasterizeToPngBlob(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
