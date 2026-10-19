/** Draws `img` letterboxed (aspect preserved, centered) into a size×size PNG. */
export function resizeToPngBytes(img: HTMLImageElement, size: number): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to encode PNG."));
      blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
    }, "image/png");
  });
}

/** Builds a valid .ico by embedding raw PNG frames (supported since Vista). */
export function buildIco(frames: { size: number; data: Uint8Array }[]): Uint8Array {
  const headerSize = 6 + frames.length * 16;
  const totalSize = headerSize + frames.reduce((sum, f) => sum + f.data.length, 0);
  const buf = new Uint8Array(totalSize);
  const view = new DataView(buf.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, frames.length, true);

  let offset = headerSize;
  frames.forEach((f, i) => {
    const entry = 6 + i * 16;
    buf[entry] = f.size >= 256 ? 0 : f.size;
    buf[entry + 1] = f.size >= 256 ? 0 : f.size;
    buf[entry + 2] = 0;
    buf[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, f.data.length, true);
    view.setUint32(entry + 12, offset, true);
    buf.set(f.data, offset);
    offset += f.data.length;
  });

  return buf;
}
