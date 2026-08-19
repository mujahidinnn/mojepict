/** Parametric SVG path generators for the wave-generator tool. */

interface Pt {
  x: number;
  y: number;
}

/** Deterministic PRNG (mulberry32) so a seed reproduces the exact same shape. */
export function createPRNG(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth open/closed curve through `points` via Catmull-Rom -> cubic Bezier. */
function catmullRomToBezierPath(points: Pt[], closed: boolean): string {
  const n = points.length;
  if (n === 0) return "";
  const get = (i: number) =>
    closed ? points[((i % n) + n) % n] : points[Math.max(0, Math.min(n - 1, i))];

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `;
  const segCount = closed ? n : n - 1;

  for (let i = 0; i < segCount; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d;
}

export interface WaveOpts {
  amplitude: number;
  frequency: number;
  phase: number;
  baseline: number;
  flip?: boolean;
}

/**
 * Path for one wavy, fillable section-divider layer spanning `0..width`,
 * closed down to the bottom edge (getwaves.com-style divider).
 */
export function generateWavePath(width: number, height: number, opts: WaveOpts): string {
  const { amplitude, frequency, phase, baseline, flip = false } = opts;

  const pointsPerPeriod = 14;
  const sampleCount = Math.max(24, Math.round(frequency * pointsPerPeriod));
  const baselineY = height * baseline;

  const points: Pt[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const x = t * width;
    const angle = 2 * Math.PI * (frequency * t + phase);
    let y = baselineY + Math.sin(angle) * amplitude;
    if (flip) y = height - y;
    points.push({ x, y });
  }

  const crestPath = catmullRomToBezierPath(points, false);
  return `${crestPath}L ${width.toFixed(2)} ${height.toFixed(2)} L 0 ${height.toFixed(2)} Z`;
}

export interface BlobOpts {
  points: number;
  irregularity: number;
  seed: number;
}

/** Closed organic "blob" path, roughly circular, for decorative backgrounds. */
export function generateBlobPath(size: number, opts: BlobOpts): string {
  const { points, irregularity, seed } = opts;
  const rand = createPRNG(seed);

  const cx = size / 2;
  const cy = size / 2;
  // Shrink the base radius so the worst-case jittered point (radius *
  // (1 + irregularity)) still fits inside the viewBox, with extra margin
  // for Catmull-Rom's tendency to slightly overshoot its control points on
  // sharp turns - otherwise the blob clips against the SVG's own edge.
  const baseRadius = (size / 2 / (1 + irregularity)) * 0.85;
  const angleStep = (2 * Math.PI) / points;

  const pts: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const angleJitter = (rand() - 0.5) * angleStep * 0.3;
    const angle = i * angleStep + angleJitter;
    const radiusJitter = 1 + (rand() * 2 - 1) * irregularity;
    const r = baseRadius * radiusJitter;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  return `${catmullRomToBezierPath(pts, true)}Z`;
}
