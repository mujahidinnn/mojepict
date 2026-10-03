/** 4 corners of a quad in source-image pixel coordinates, in TL, TR, BR, BL order. */
export interface Point {
  x: number;
  y: number;
}
export type Quad = [Point, Point, Point, Point];

interface Mat3 {
  a11: number;
  a12: number;
  a13: number;
  a21: number;
  a22: number;
  a23: number;
  a31: number;
  a32: number;
}

/** Projective transform mapping the unit square (0,0)-(1,0)-(1,1)-(0,1) onto `q`. */
function unitSquareToQuad(q: Quad): Mat3 {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;

  let a13 = 0;
  let a23 = 0;
  if (dx3 !== 0 || dy3 !== 0) {
    const denom = dx1 * dy2 - dx2 * dy1;
    a13 = (dx3 * dy2 - dx2 * dy3) / denom;
    a23 = (dx1 * dy3 - dx3 * dy1) / denom;
  }

  return {
    a11: p1.x - p0.x + a13 * p1.x,
    a21: p3.x - p0.x + a23 * p3.x,
    a31: p0.x,
    a12: p1.y - p0.y + a13 * p1.y,
    a22: p3.y - p0.y + a23 * p3.y,
    a32: p0.y,
    a13,
    a23,
  };
}

function apply(m: Mat3, u: number, v: number): Point {
  const w = m.a13 * u + m.a23 * v + 1;
  return { x: (m.a11 * u + m.a21 * v + m.a31) / w, y: (m.a12 * u + m.a22 * v + m.a32) / w };
}

/**
 * Straightens the quad `srcQuad` of `source` into an `outWidth` x `outHeight`
 * rectangle (nearest-neighbor sampling - good enough for scanned documents,
 * much cheaper than bilinear for a one-shot operation).
 */
export function warpToRect(source: CanvasImageSource, srcQuad: Quad, outWidth: number, outHeight: number): HTMLCanvasElement {
  const sw = Math.round("naturalWidth" in source ? source.naturalWidth : (source as HTMLCanvasElement).width);
  const sh = Math.round("naturalHeight" in source ? source.naturalHeight : (source as HTMLCanvasElement).height);

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = sw;
  srcCanvas.height = sh;
  const sctx = srcCanvas.getContext("2d")!;
  sctx.drawImage(source, 0, 0, sw, sh);
  const srcData = sctx.getImageData(0, 0, sw, sh).data;

  const m = unitSquareToQuad(srcQuad);
  const out = document.createElement("canvas");
  out.width = outWidth;
  out.height = outHeight;
  const octx = out.getContext("2d")!;
  const outImg = octx.createImageData(outWidth, outHeight);

  for (let y = 0; y < outHeight; y++) {
    const v = y / outHeight;
    for (let x = 0; x < outWidth; x++) {
      const u = x / outWidth;
      const { x: sx, y: sy } = apply(m, u, v);
      const ix = Math.round(sx);
      const iy = Math.round(sy);
      const di = (y * outWidth + x) * 4;
      if (ix >= 0 && ix < sw && iy >= 0 && iy < sh) {
        const si = (iy * sw + ix) * 4;
        outImg.data[di] = srcData[si];
        outImg.data[di + 1] = srcData[si + 1];
        outImg.data[di + 2] = srcData[si + 2];
        outImg.data[di + 3] = 255;
      } else {
        outImg.data[di + 3] = 0;
      }
    }
  }
  octx.putImageData(outImg, 0, 0);
  return out;
}

/**
 * Best-effort "find the document" guess: assumes the page is a lighter,
 * roughly axis-aligned region against a darker background, and returns its
 * bounding box. Bails to a small inset of the full image when that
 * assumption doesn't hold (low-contrast scene, paper fills the frame, etc).
 * ponytail: axis-aligned brightness threshold only - doesn't handle a
 * rotated/skewed page or a background lighter than the paper. Upgrade path
 * is real contour detection (e.g. via OpenCV.js) if this proves unreliable.
 */
export function autoDetectQuad(source: CanvasImageSource, naturalWidth: number, naturalHeight: number): Quad {
  const inset = 0.04;
  const full: Quad = [
    { x: naturalWidth * inset, y: naturalHeight * inset },
    { x: naturalWidth * (1 - inset), y: naturalHeight * inset },
    { x: naturalWidth * (1 - inset), y: naturalHeight * (1 - inset) },
    { x: naturalWidth * inset, y: naturalHeight * (1 - inset) },
  ];

  try {
    const scale = Math.min(1, 300 / Math.max(naturalWidth, naturalHeight));
    const sw = Math.max(1, Math.round(naturalWidth * scale));
    const sh = Math.max(1, Math.round(naturalHeight * scale));
    const small = document.createElement("canvas");
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext("2d")!;
    sctx.drawImage(source, 0, 0, sw, sh);
    const { data } = sctx.getImageData(0, 0, sw, sh);

    const gray = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
    }
    const sorted = Float32Array.from(gray).sort();
    const median = sorted[Math.floor(sorted.length / 2)];
    const threshold = median + 15;

    let minX = sw;
    let maxX = 0;
    let minY = sh;
    let maxY = 0;
    let count = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (gray[y * sw + x] > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          count++;
        }
      }
    }
    const area = (maxX - minX) * (maxY - minY);
    if (count < sw * sh * 0.1 || area < sw * sh * 0.15 || area > sw * sh * 0.98) return full;

    const scaleX = naturalWidth / sw;
    const scaleY = naturalHeight / sh;
    return [
      { x: minX * scaleX, y: minY * scaleY },
      { x: maxX * scaleX, y: minY * scaleY },
      { x: maxX * scaleX, y: maxY * scaleY },
      { x: minX * scaleX, y: maxY * scaleY },
    ];
  } catch {
    return full;
  }
}
