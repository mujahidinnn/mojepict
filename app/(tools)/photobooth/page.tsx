"use client";

import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Combobox } from "@/components/ui/combobox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  Camera,
  Contrast as ContrastIcon,
  Download,
  Eye,
  FlipHorizontal,
  Fullscreen,
  Grid3X3,
  Palette,
  Pin,
  PinOff,
  RefreshCcw,
  RotateCcw,
  Settings2,
  Share2,
  Smile,
  Sparkles,
  Sun,
  Thermometer,
  Timer,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Capture resolution per cell aspect. The preview canvas is locked to the
// active layout's cell size and the video is cropped ("cover") into it, so
// what you see is exactly what lands in each strip cell.
const CELL_SIZE = {
  "16:9": [1280, 720],
  "4:3": [960, 720],
  "1:1": [800, 800],
  "3:4": [720, 960],
} as const;

type CellAspect = keyof typeof CELL_SIZE;

const starPath = Array.from({ length: 10 }, (_, k) => {
  const a = ((-90 + k * 36) * Math.PI) / 180;
  const r = k % 2 ? 21 : 50;
  return `${k ? "L" : "M"}${(50 + r * Math.cos(a)).toFixed(1)} ${(53 + r * Math.sin(a)).toFixed(1)}`;
}).join("") + "Z";

/** Photo-cell masks as SVG paths in a 0..100 box; shared by the canvas clip, layout icons and camera overlay. */
const SHAPES = {
  circle: "M50 0A50 50 0 1 1 49.99 0Z",
  triangle: "M50 0L100 100H0Z",
  triangleDown: "M0 0H100L50 100Z",
  diamond: "M50 0L100 50L50 100L0 50Z",
  parallelogram: "M25 0H100L75 100H0Z",
  heart: "M50 96C22 76 0 56 0 31C0 13 13 2 28 2C39 2 46 9 50 18C54 9 61 2 72 2C87 2 100 13 100 31C100 56 78 76 50 96Z",
  hexagon: "M25 3H75L100 50L75 97H25L0 50Z",
  star: starPath,
  arch: "M0 100V50A50 50 0 0 1 100 50V100Z",
} as const;

type ShapeId = keyof typeof SHAPES;

/**
 * `zigzag` staggers every other column down by half a cell; `hero` adds one
 * full-width cell on top of the cols×rows grid (so it holds one extra shot).
 * `shape` masks each cell (an array cycles per shot); `overlap` slides
 * columns into each other so interlocking shapes (triangles) tile tightly.
 */
const LAYOUTS: {
  id: string;
  name: string;
  cols: number;
  rows: number;
  aspect: CellAspect;
  kind?: "zigzag" | "hero";
  shape?: ShapeId | ShapeId[];
  overlap?: number;
}[] = [
  { id: "strip4", name: "Classic Strip", cols: 1, rows: 4, aspect: "4:3" },
  { id: "strip3", name: "Mini Strip", cols: 1, rows: 3, aspect: "4:3" },
  { id: "portrait3", name: "Portrait Strip", cols: 1, rows: 3, aspect: "3:4" },
  { id: "duo-v", name: "1 × 2", cols: 1, rows: 2, aspect: "4:3" },
  { id: "duo-h", name: "2 × 1", cols: 2, rows: 1, aspect: "3:4" },
  { id: "trio-h", name: "3 × 1", cols: 3, rows: 1, aspect: "3:4" },
  { id: "single", name: "Single", cols: 1, rows: 1, aspect: "3:4" },
  { id: "zigzag4", name: "Zigzag 4", cols: 2, rows: 2, aspect: "3:4", kind: "zigzag" },
  { id: "zigzag6", name: "Zigzag 6", cols: 2, rows: 3, aspect: "1:1", kind: "zigzag" },
  { id: "zigzag9", name: "Zigzag 9", cols: 3, rows: 3, aspect: "1:1", kind: "zigzag" },
  { id: "hero4", name: "Hero + 3", cols: 3, rows: 1, aspect: "4:3", kind: "hero" },
  { id: "grid2x2", name: "2 × 2", cols: 2, rows: 2, aspect: "1:1" },
  { id: "grid3x2", name: "3 × 2", cols: 3, rows: 2, aspect: "1:1" },
  { id: "grid2x3", name: "2 × 3", cols: 2, rows: 3, aspect: "16:9" },
  { id: "grid2x4", name: "2 × 4", cols: 2, rows: 4, aspect: "16:9" },
  { id: "grid3x3", name: "3 × 3", cols: 3, rows: 3, aspect: "1:1" },
  { id: "circle4", name: "Bulat 2 × 2", cols: 2, rows: 2, aspect: "1:1", shape: "circle" },
  { id: "circle3", name: "Bulat Strip", cols: 1, rows: 3, aspect: "1:1", shape: "circle" },
  { id: "heart4", name: "Love 2 × 2", cols: 2, rows: 2, aspect: "1:1", shape: "heart" },
  { id: "heart3", name: "Love Strip", cols: 1, rows: 3, aspect: "1:1", shape: "heart" },
  { id: "tri3", name: "Segitiga", cols: 3, rows: 1, aspect: "4:3", shape: "triangle" },
  { id: "trid3", name: "Segitiga Terbalik", cols: 3, rows: 1, aspect: "4:3", shape: "triangleDown" },
  { id: "trimix", name: "Segitiga Mozaik", cols: 4, rows: 2, aspect: "4:3", shape: ["triangle", "triangleDown"], overlap: 0.5 },
  { id: "diamond4", name: "Belah Ketupat", cols: 2, rows: 2, aspect: "1:1", shape: "diamond" },
  { id: "diamond5", name: "Ketupat Zigzag", cols: 3, rows: 2, aspect: "1:1", shape: "diamond", kind: "zigzag", overlap: 0.5 },
  { id: "para3", name: "Jajar Genjang", cols: 3, rows: 1, aspect: "3:4", shape: "parallelogram", overlap: 0.25 },
  { id: "hex6", name: "Hexagon", cols: 3, rows: 2, aspect: "1:1", shape: "hexagon", kind: "zigzag" },
  { id: "star4", name: "Bintang", cols: 2, rows: 2, aspect: "1:1", shape: "star" },
  { id: "arch3", name: "Arch", cols: 3, rows: 1, aspect: "3:4", shape: "arch" },
  {
    id: "random9",
    name: "Random",
    cols: 3,
    rows: 3,
    aspect: "1:1",
    shape: ["heart", "circle", "star", "hexagon", "diamond", "arch", "triangle", "circle", "heart"],
  },
];

const shapeAt = (layout: (typeof LAYOUTS)[number], i: number): ShapeId | undefined =>
  Array.isArray(layout.shape) ? layout.shape[i % layout.shape.length] : layout.shape;

/** Clip/fill path for one cell: the layout's shape, or a rounded rect. */
function cellPath(shape: ShapeId | undefined, x: number, y: number, w: number, h: number, r: number) {
  const p = new Path2D();
  if (shape) p.addPath(new Path2D(SHAPES[shape]), new DOMMatrix([w / 100, 0, 0, h / 100, x, y]));
  else if (typeof p.roundRect === "function") p.roundRect(x, y, w, h, r);
  else p.rect(x, y, w, h);
  return p;
}

const FONT_OPTIONS = [
  { id: "script", name: "Script", css: (px: number) => `italic ${px}px Georgia, serif`, upper: false },
  { id: "bold", name: "Bold", css: (px: number) => `800 ${px}px system-ui, sans-serif`, upper: true },
  { id: "type", name: "Typewriter", css: (px: number) => `${px}px "Courier New", monospace`, upper: false },
  { id: "classic", name: "Classic", css: (px: number) => `${px}px Georgia, serif`, upper: true },
] as const;

type FontId = (typeof FONT_OPTIONS)[number]["id"];

/** Draws `img` into the rect, center-cropped to fill it (CSS object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

let audioCtx: AudioContext | null = null;
/** Short synthesized blip for countdown ticks / shutter; silently no-ops where WebAudio is blocked. */
function beep(freq: number, dur: number) {
  try {
    audioCtx ??= new AudioContext();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur);
  } catch {
    // audio is a nicety, never block capture on it
  }
}

/** e.g. "2026-08-18_14-32-05", safe to use in a downloaded filename. */
function filenameTimestamp(): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

const FRAME_COLOR_PRESETS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#f9a8d4",
  "#a5d8ff",
  "#fde68a",
  "#c4b5fd",
  "#fdba74",
];

const NEON_COLOR_PRESETS = [
  "#00f2ff",
  "#ff00ff",
  "#39ff14",
  "#ff073a",
  "#ffea00",
  "#bc13fe",
  "#ff6ec7",
  "#04d9ff",
];

const NEON_STYLES = [
  { id: "glow", name: "Glow" },
  { id: "double", name: "Double" },
  { id: "corners", name: "Corners" },
  { id: "dashed", name: "Dashed" },
] as const;

type NeonStyle = (typeof NEON_STYLES)[number]["id"];

const FILTER_OPTIONS = [
  { value: "none", label: "Default (Clean)" },
  { value: "brightness(110%) contrast(90%) saturate(120%) blur(0.3px)", label: "Sweet Look ✨" },
  { value: "sepia(0.4) brightness(110%) hue-rotate(-10deg)", label: "Golden Hour ☀️" },
  { value: "sepia(0.6) contrast(0.9) brightness(1.1)", label: "Vintage 🎞️" },
  { value: "brightness(110%) contrast(120%) hue-rotate(180deg)", label: "Cold Tone ❄️" },
  { value: "grayscale(100%)", label: "Classic B&W" },
  { value: "grayscale(100%) contrast(150%)", label: "High Contrast B&W" },
  { value: "brightness(105%) contrast(95%) saturate(120%) sepia(0.5) hue-rotate(-10deg)", label: "Retro 70s" },
  { value: "brightness(110%) contrast(90%) saturate(85%) sepia(0.3) blur(0.4px)", label: "Retro 80s" },
  { value: "brightness(70%) contrast(130%) hue-rotate(210deg)", label: "Midnight 🌙" },
  { value: "contrast(200%) brightness(80%)", label: "Dramatic" },
  { value: "blur(0.5px) brightness(115%)", label: "Soft Glow" },
];

const TIMER_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
  { value: 10, label: "10s" },
];

const DECORATIVE_FRAMES = [
  { id: "none", name: "Classic", icon: "🔳" },
  { id: "custom", name: "Custom", icon: "🎨" },
  // -- pattern / graphic frames --
  { id: "polaroid", name: "Polaroid", icon: "🖼️" },
  { id: "filmstrip", name: "Filmstrip", icon: "🎞️" },
  { id: "scalloped", name: "Scalloped", icon: "〰️" },
  { id: "washi", name: "Washi Tape", icon: "🎀" },
  { id: "twibbon", name: "Twibbon", icon: "🎗️" },
  { id: "neon", name: "Neon", icon: "🌈" },
  { id: "dots", name: "Dots", icon: "⚪" },
  { id: "retro", name: "Retro TV", icon: "📺" },
  { id: "cyber", name: "Cyber", icon: "👾" },
  { id: "checker", name: "Racing", icon: "🏁" },
  { id: "bubble", name: "Bubbles", icon: "🫧" },
  // -- emoji frames --
  { id: "stars", name: "Starry", icon: "⭐" },
  { id: "hearts", name: "Hearts", icon: "💖" },
  { id: "fruits", name: "Fruits", icon: "🍓" },
  { id: "animals", name: "Animals", icon: "🐶" },
  { id: "food", name: "Food", icon: "🍕" },
  { id: "nature", name: "Nature", icon: "🌸" },
  { id: "space", name: "Space", icon: "🚀" },
  { id: "tech", name: "Tech", icon: "🎮" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "travel", name: "Travel", icon: "✈️" },
  { id: "party", name: "Party", icon: "🎉" },
  { id: "music", name: "Music", icon: "🎵" },
  { id: "ocean", name: "Ocean", icon: "🐳" },
  { id: "plants", name: "Plants", icon: "🌵" },
  { id: "gifts", name: "Gifts", icon: "🎁" },
];

/** Emoji scattered per frame, grouped by theme. People/emotion faces and flags are intentionally excluded. */
const EMOJI_FRAME_SETS: Record<string, string[]> = {
  stars: ["⭐", "🌟", "✨", "💫", "🌠", "✴️", "💥", "⚡"],
  hearts: ["💖", "💕", "💗", "💓", "💞", "💘", "💝", "❣️", "💟", "🩷", "🩵", "🩶"],
  fruits: ["🍓", "🍉", "🍍", "🍒", "🍋", "🍇", "🍑", "🥝", "🍎", "🍊", "🍌", "🥭"],
  animals: [
    "🐶", "🐱", "🐰", "🦊", "🐼", "🐨", "🐯", "🦁", "🐸", "🐙",
    "🦋", "🐝", "🐢", "🦄", "🐬", "🦉", "🐧", "🐹", "🦔",
  ],
  food: ["🍕", "🍔", "🍟", "🌮", "🍩", "🍦", "🍰", "🧋", "🍿", "🍫", "🍭", "🍪", "🥐", "🧁"],
  nature: [
    "🌸", "🌻", "🌈", "🌙", "☀️", "🌊", "🍃", "🌵", "🍄", "🌿",
    "🌺", "🌷", "🌹", "🍁", "❄️", "⛅",
  ],
  space: ["🚀", "🛸", "🪐", "🌌", "☄️", "🌍", "🔭", "🌑", "🌕", "✨", "🛰️", "👽"],
  tech: ["💎", "🎮", "🎧", "📷", "💡", "🔮", "🎲", "🕹️", "📀", "🧸", "🔋", "⌚", "🖥️", "📱"],
  sports: [
    "⚽", "🏀", "🎳", "🎯", "🎨", "🎸", "🎺", "🥁", "🏆", "🏓",
    "🎿", "🏈", "⚾", "🎱", "🥊", "🏸", "🏹",
  ],
  travel: [
    "✈️", "🚗", "🚲", "⛵", "🏖️", "🗺️", "🎡", "🚁", "🛴", "⛺",
    "🚂", "🛶", "🧳", "🚤", "🎢",
  ],
  party: ["🎉", "🎊", "🎈", "🎆", "🎇", "🍾", "🪩", "✨", "🎀", "🎗️", "🎁"],
  music: ["🎵", "🎶", "🎤", "🎧", "🎹", "🎷", "🎺", "🥁", "🪘", "🎻", "🪕"],
  ocean: ["🐳", "🐬", "🐠", "🦀", "🐚", "🌊", "⚓", "🦈", "🐡", "🦑", "🐙", "🛟"],
  plants: ["🌵", "🌲", "🌴", "🍀", "🌾", "🌱", "🍁", "🍂", "🌳", "🌰", "🍄"],
  gifts: ["🎁", "🎀", "🪄", "🔮", "💌", "📌", "🎗️", "🏅", "🥇", "🎖️"],
};

/**
 * Walks clockwise around the inside edge of a `margin`-thick border band
 * (top -> right -> bottom -> left), starting at the top-left corner. Used to
 * place decorations that hug the frame edge instead of scattering over the
 * whole photo - real photobooth/sticker frames keep the center clear.
 */
function pointOnBorder(t: number, w: number, h: number, margin: number) {
  const top = w;
  const right = h - margin;
  const bottom = w;
  const total = top + right + bottom + (h - margin);
  let d = (((t % 1) + 1) % 1) * total;

  if (d < top) return { x: d, y: margin / 2 };
  d -= top;
  if (d < right) return { x: w - margin / 2, y: margin + d };
  d -= right;
  if (d < bottom) return { x: w - d, y: h - margin / 2 };
  d -= bottom;
  return { x: margin / 2, y: h - margin - d };
}

/** Splits text into individual emoji/grapheme clusters (handles multi-codepoint emoji). */
function splitEmoji(text: string): string[] {
  const SegmenterCtor = (
    Intl as unknown as {
      Segmenter?: new (
        locale?: string,
        options?: { granularity?: string },
      ) => { segment(input: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (SegmenterCtor) {
    const segmenter = new SegmenterCtor(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment).filter((s) => s.trim());
  }
  return Array.from(text).filter((s) => s.trim());
}

/**
 * Draws emoji decorations confined to the outer border band of the canvas:
 * one accent per corner plus a few smaller ones scattered along the edges,
 * leaving the entire center - where the subject actually is - untouched.
 * "single" mode drops a single sticker-style accent in the bottom-right corner.
 */
function renderEmojiFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  emojis: string[],
  mode: "single" | "multiple",
) {
  if (!emojis.length) return;
  const short = Math.min(w, h);
  const margin = short * 0.13;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (mode === "single") {
    ctx.font = `${short / 7}px serif`;
    ctx.fillText(emojis[0], w - margin * 0.85, h - margin * 0.85);
    return;
  }

  const corners: [number, number][] = [
    [margin * 0.75, margin * 0.75],
    [w - margin * 0.75, margin * 0.75],
    [w - margin * 0.75, h - margin * 0.75],
    [margin * 0.75, h - margin * 0.75],
  ];
  ctx.font = `${short / 9}px serif`;
  corners.forEach(([x, y], i) => ctx.fillText(emojis[i % emojis.length], x, y));

  ctx.font = `${short / 13}px serif`;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const { x, y } = pointOnBorder((i + 0.5) / count, w, h, margin);
    const jitter = Math.sin(i * 12.9898) * (margin * 0.18);
    ctx.fillText(emojis[(i + 2) % emojis.length], x, y + jitter);
  }
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.stroke();
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
}

/**
 * Whole-strip background/banner/per-cell styles, modeled after real photo
 * strip templates (fremio.id-style scrapbook frames): a patterned background
 * behind the grid, an optional text banner, and a small accent repeated on
 * every individual photo cell. Unlike DECORATIVE_FRAMES (a per-photo border
 * overlay), these only apply to the final downloaded grid image, since they
 * only make sense once the whole strip layout exists.
 */
const STRIP_STYLES = [
  { id: "none", name: "Plain" },
  { id: "strip-checkered", name: "Checkered Romance" },
  { id: "strip-stripes", name: "Golden Stripes" },
  { id: "strip-scalloped", name: "Scalloped Sweetness" },
  { id: "strip-banner", name: "Holiday Banner" },
  { id: "strip-scrapbook", name: "Scrapbook Vintage" },
  { id: "strip-denim", name: "Denim Days" },
] as const;

type StripStyleId = (typeof STRIP_STYLES)[number]["id"];

function drawStripBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: StripStyleId,
  frameColor: string,
) {
  switch (style) {
    case "strip-checkered": {
      const c1 = "#5c5c3d";
      const c2 = "#f4cdd8";
      const size = Math.min(w, h) * 0.09;
      let row = 0;
      for (let y = 0; y < h; y += size, row++) {
        let col = 0;
        for (let x = 0; x < w; x += size, col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? c1 : c2;
          ctx.fillRect(x, y, size, size);
        }
      }
      break;
    }
    case "strip-stripes": {
      const c1 = "#fdf6ec";
      const c2 = "#f6c453";
      const stripeW = w * 0.045;
      let i = 0;
      for (let x = 0; x < w; x += stripeW, i++) {
        ctx.fillStyle = i % 2 === 0 ? c1 : c2;
        ctx.fillRect(x, 0, stripeW, h);
      }
      break;
    }
    case "strip-scalloped":
      ctx.fillStyle = "#f7b8c4";
      ctx.fillRect(0, 0, w, h);
      break;
    case "strip-scrapbook": {
      ctx.fillStyle = "#d8c4a0";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,90,50,0.08)";
      ctx.lineWidth = 1;
      const lineGap = Math.min(w, h) * 0.02;
      for (let y = 0; y < h; y += lineGap) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(y) * 4);
        ctx.lineTo(w, y + Math.cos(y * 0.7) * 4);
        ctx.stroke();
      }
      const kraftVignette = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.3,
        w / 2, h / 2, Math.min(w, h) * 0.75,
      );
      kraftVignette.addColorStop(0, "rgba(0,0,0,0)");
      kraftVignette.addColorStop(1, "rgba(60,40,20,0.25)");
      ctx.fillStyle = kraftVignette;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "strip-denim": {
      ctx.fillStyle = "#3b5b7a";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      const weaveGap = Math.min(w, h) * 0.014;
      for (let d = -h; d < w; d += weaveGap) {
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(d + h, h);
        ctx.stroke();
      }
      const denimVignette = ctx.createRadialGradient(
        w / 2, h / 2, Math.min(w, h) * 0.3,
        w / 2, h / 2, Math.min(w, h) * 0.75,
      );
      denimVignette.addColorStop(0, "rgba(0,0,0,0)");
      denimVignette.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = denimVignette;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    default:
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, w, h);
  }
}

function drawCellAccent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  style: StripStyleId,
  index: number,
) {
  const short = Math.min(w, h);
  if (style === "strip-stripes") {
    ctx.strokeStyle = "#f6c453";
    ctx.lineWidth = short * 0.02;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#f28aa8";
    ctx.font = `${short * 0.13}px serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("💗", x + short * 0.02, y + short * 0.02);
  } else if (style === "strip-scalloped") {
    const r = short * 0.025;
    const spacing = r * 1.9;
    ctx.fillStyle = "#fffdf7";
    for (let sx = x + spacing / 2; sx < x + w; sx += spacing) {
      ctx.beginPath();
      ctx.arc(sx, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, y + h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let sy = y + spacing / 2; sy < y + h; sy += spacing) {
      ctx.beginPath();
      ctx.arc(x, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (index % 2 === 0) {
      ctx.fillStyle = "#e0607e";
      ctx.font = `${short * 0.13}px serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("💗", x + short * 0.03, y + short * 0.03);
    }
  }
}

type Layout = (typeof LAYOUTS)[number];

/** Canvas size and cell rects of a strip; shared by the renderer and the clickable cell overlay. */
function stripGeometry(layout: Layout, style: StripStyleId, hasFooter: boolean, themed = false) {
  const [cellW, cellH] = CELL_SIZE[layout.aspect];
  const roomy = themed || style === "strip-scrapbook";
  const gap = roomy ? 56 : 28;
  const pad = themed ? Math.round(Math.min(cellW, cellH) * 0.13) : roomy ? 64 : 40;
  const stepX = cellW * (1 - (layout.overlap ?? 0)) + gap;
  const innerW = (layout.cols - 1) * stepX + cellW;
  const footer = hasFooter ? Math.round(Math.max(Math.min(cellW, cellH) * 0.42, innerW * 0.14)) : 0;
  const heroH = layout.kind === "hero" ? Math.round(innerW * 0.75) + gap : 0;
  const stagger = layout.kind === "zigzag" && layout.cols > 1 ? (cellH + gap) / 2 : 0;
  const cells: { x: number; y: number; w: number; h: number }[] = Array.from({ length: layout.cols * layout.rows }, (_, i) => {
    const col = i % layout.cols;
    return {
      x: pad + col * stepX,
      y: pad + heroH + Math.floor(i / layout.cols) * (cellH + gap) + (col % 2) * stagger,
      w: cellW,
      h: cellH,
    };
  });
  if (heroH) cells.unshift({ x: pad, y: pad, w: innerW, h: heroH - gap });
  const gridH = heroH + layout.rows * cellH + gap * (layout.rows - 1) + stagger;
  const width = pad * 2 + innerW;
  const height = pad * 2 + gridH + footer;
  return { width, height, cellW, cellH, cells, footerTop: pad + gridH, footer, pad };
}

/** Footer band look per strip style: optional solid band behind the text, and the text color. */
const FOOTER_LOOK: Record<StripStyleId, { band?: string; ink?: string }> = {
  none: {},
  "strip-checkered": { band: "rgba(30,30,20,0.88)", ink: "#f4e8d0" },
  "strip-stripes": { band: "#fdf6ec", ink: "#b7791f" },
  "strip-scalloped": { ink: "#9d174d" },
  "strip-banner": { band: "rgba(0,0,0,0.78)", ink: "#ffffff" },
  "strip-scrapbook": { ink: "#4a3520" },
  "strip-denim": { ink: "#fdfaf3" },
};

type FooterLook = { band?: string; ink?: string; card?: boolean };

/**
 * Illustrated strip themes. Art is AI-generated (scripts/gen-frames.mjs +
 * gen-frames-post.py) into public/photobooth/themes/: a pattern tile plus two
 * die-cut stickers per theme.
 */
const THEME_CATEGORIES = ["All", "Holidays", "Moments", "Romantic", "Cute", "Sport", "Cool", "Hero & Anime", "Work & Tech", "Nature", "Food"] as const;
type ThemeCategory = (typeof THEME_CATEGORIES)[number];

const STRIP_THEMES: { id: string; name: string; cat: ThemeCategory; band: string; ink: string }[] = [
  { id: "ramadan", name: "Ramadhan", cat: "Holidays", band: "rgba(6,78,59,0.9)", ink: "#fde68a" },
  { id: "lebaran", name: "Lebaran", cat: "Holidays", band: "rgba(255,251,235,0.94)", ink: "#047857" },
  { id: "imlek", name: "Imlek", cat: "Holidays", band: "rgba(127,29,29,0.9)", ink: "#fcd34d" },
  { id: "merdeka", name: "Merdeka", cat: "Holidays", band: "rgba(255,255,255,0.94)", ink: "#b91c1c" },
  { id: "batik", name: "Batik", cat: "Holidays", band: "rgba(255,247,237,0.94)", ink: "#713f12" },
  { id: "christmas", name: "Christmas", cat: "Holidays", band: "rgba(20,60,40,0.9)", ink: "#fef3c7" },
  { id: "halloween", name: "Halloween", cat: "Holidays", band: "rgba(255,237,213,0.92)", ink: "#431407" },
  { id: "newyear", name: "New Year", cat: "Holidays", band: "rgba(15,23,42,0.88)", ink: "#fcd34d" },
  { id: "birthday", name: "Birthday", cat: "Moments", band: "rgba(255,255,255,0.92)", ink: "#db2777" },
  { id: "graduation", name: "Graduation", cat: "Moments", band: "rgba(23,37,84,0.9)", ink: "#fcd34d" },
  { id: "wedding", name: "Wedding", cat: "Moments", band: "rgba(255,255,255,0.92)", ink: "#9f1239" },
  { id: "love", name: "Love Letter", cat: "Romantic", band: "rgba(255,255,255,0.9)", ink: "#be123c" },
  { id: "rose", name: "Red Rose", cat: "Romantic", band: "rgba(10,10,10,0.88)", ink: "#fecdd3" },
  { id: "sakura", name: "Sakura", cat: "Romantic", band: "rgba(255,250,240,0.92)", ink: "#be185d" },
  { id: "kpop", name: "K-Pop", cat: "Romantic", band: "rgba(255,255,255,0.9)", ink: "#a21caf" },
  { id: "strawberry", name: "Strawberry", cat: "Cute", band: "rgba(255,247,245,0.94)", ink: "#b91c1c" },
  { id: "daisy", name: "Daisy", cat: "Cute", band: "rgba(255,255,255,0.9)", ink: "#a16207" },
  { id: "cafe", name: "Café", cat: "Food", band: "rgba(255,248,235,0.94)", ink: "#78350f" },
  { id: "kitty", name: "Kitty", cat: "Cute", band: "rgba(255,255,255,0.92)", ink: "#c2410c" },
  { id: "dino", name: "Dino", cat: "Cute", band: "rgba(255,255,255,0.9)", ink: "#3f6212" },
  { id: "ocean", name: "Ocean", cat: "Cute", band: "rgba(255,255,255,0.9)", ink: "#0e7490" },
  { id: "tropical", name: "Tropical", cat: "Cute", band: "rgba(19,78,74,0.9)", ink: "#fef9c3" },
  { id: "groovy", name: "Groovy 70s", cat: "Cute", band: "rgba(255,247,237,0.94)", ink: "#9a3412" },
  { id: "cyber", name: "Cyber Neon", cat: "Cool", band: "rgba(0,0,0,0.86)", ink: "#22d3ee" },
  { id: "street", name: "Street", cat: "Cool", band: "rgba(23,23,23,0.9)", ink: "#facc15" },
  { id: "graffiti", name: "Graffiti Wall", cat: "Cool", band: "rgba(10,10,10,0.88)", ink: "#f472b6" },
  { id: "pixel", name: "Pixel Game", cat: "Cool", band: "rgba(46,16,101,0.9)", ink: "#a3e635" },
  { id: "galaxy", name: "Galaxy", cat: "Cool", band: "rgba(30,10,60,0.88)", ink: "#e9d5ff" },
  { id: "racing", name: "Racing", cat: "Cool", band: "rgba(17,17,17,0.9)", ink: "#fb923c" },
  { id: "starry", name: "Starry Night", cat: "Cool", band: "rgba(15,23,42,0.86)", ink: "#fde68a" },
  { id: "y2k", name: "Y2K", cat: "Cool", band: "rgba(255,255,255,0.88)", ink: "#7e22ce" },
  { id: "football", name: "Football", cat: "Sport", band: "rgba(255,255,255,0.92)", ink: "#166534" },
  { id: "basketball", name: "Basketball", cat: "Sport", band: "rgba(23,23,23,0.9)", ink: "#fb923c" },
  { id: "skate", name: "Skate", cat: "Sport", band: "rgba(23,23,23,0.9)", ink: "#f87171" },
  { id: "esports", name: "Esports", cat: "Cool", band: "rgba(10,10,10,0.9)", ink: "#4ade80" },
  { id: "comic", name: "Comic Pop", cat: "Cool", band: "rgba(255,255,255,0.94)", ink: "#dc2626" },
  { id: "rock", name: "Rock", cat: "Cool", band: "rgba(10,10,10,0.9)", ink: "#facc15" },
  { id: "hiphop", name: "Hip-Hop", cat: "Cool", band: "rgba(10,10,10,0.88)", ink: "#fbbf24" },
  { id: "adventure", name: "Adventure", cat: "Cool", band: "rgba(255,251,235,0.94)", ink: "#14532d" },
  { id: "garage", name: "Garage", cat: "Cool", band: "rgba(28,25,23,0.9)", ink: "#fde68a" },
  { id: "japan", name: "Japan Wave", cat: "Cool", band: "rgba(255,251,240,0.94)", ink: "#1e3a8a" },
  { id: "circuit", name: "Circuit", cat: "Cool", band: "rgba(8,20,48,0.9)", ink: "#67e8f9" },
  { id: "mono", name: "Monochrome", cat: "Cool", band: "rgba(255,255,255,0.95)", ink: "#0a0a0a" },
  { id: "sosmed", name: "Social Media", cat: "Cool", band: "rgba(255,255,255,0.94)", ink: "#c026d3" },
  { id: "creator", name: "Content Creator", cat: "Cool", band: "rgba(255,255,255,0.92)", ink: "#be185d" },
  { id: "koran", name: "Koran", cat: "Cool", band: "rgba(250,245,230,0.95)", ink: "#1c1917" },
  { id: "nihongo", name: "Japanese Letters", cat: "Cool", band: "rgba(255,251,240,0.94)", ink: "#b91c1c" },
  { id: "alphabet", name: "Alphabet", cat: "Cute", band: "rgba(255,255,255,0.94)", ink: "#2563eb" },
  { id: "webcity", name: "Web City", cat: "Hero & Anime", band: "rgba(30,58,138,0.9)", ink: "#ffffff" },
  { id: "nightcity", name: "Night City", cat: "Hero & Anime", band: "rgba(10,10,10,0.9)", ink: "#fde047" },
  { id: "ninja", name: "Ninja", cat: "Hero & Anime", band: "rgba(23,23,23,0.9)", ink: "#fb923c" },
  { id: "pirate", name: "Pirate Adventure", cat: "Hero & Anime", band: "rgba(255,251,235,0.94)", ink: "#b91c1c" },
  { id: "slayer", name: "Blade Hunter", cat: "Hero & Anime", band: "rgba(5,46,22,0.9)", ink: "#e9d5ff" },
  { id: "cursed", name: "Cursed Energy", cat: "Hero & Anime", band: "rgba(20,8,40,0.9)", ink: "#a5b4fc" },
  { id: "bengkel", name: "Bengkel", cat: "Work & Tech", band: "rgba(23,23,23,0.9)", ink: "#facc15" },
  { id: "math", name: "Matematika", cat: "Work & Tech", band: "rgba(20,50,35,0.9)", ink: "#fef9c3" },
  { id: "physics", name: "Fisika", cat: "Work & Tech", band: "rgba(12,25,60,0.9)", ink: "#7dd3fc" },
  { id: "it", name: "IT Life", cat: "Work & Tech", band: "rgba(255,255,255,0.92)", ink: "#1d4ed8" },
  { id: "coding", name: "Coding", cat: "Work & Tech", band: "rgba(15,23,42,0.9)", ink: "#4ade80" },
  { id: "k3", name: "K3 Safety", cat: "Work & Tech", band: "rgba(23,23,23,0.9)", ink: "#fde047" },
  { id: "bucin", name: "Bucin", cat: "Romantic", band: "rgba(255,255,255,0.92)", ink: "#db2777" },
  { id: "gunung", name: "Anak Gunung", cat: "Nature", band: "rgba(255,255,255,0.92)", ink: "#1e3a8a" },
  { id: "nature", name: "Nature", cat: "Nature", band: "rgba(255,255,255,0.9)", ink: "#166534" },
  { id: "fruits", name: "Fruits", cat: "Food", band: "rgba(255,255,255,0.92)", ink: "#c2410c" },
  { id: "kopi", name: "Coffee Shop", cat: "Food", band: "rgba(255,248,235,0.94)", ink: "#5b3a1e" },
  { id: "kekinian", name: "Makanan Kekinian", cat: "Food", band: "rgba(255,255,255,0.94)", ink: "#c2410c" },
  { id: "animals", name: "Animals", cat: "Nature", band: "rgba(255,255,255,0.92)", ink: "#0369a1" },
];

const themeAsset = (id: string, part: "tile" | "sticker1" | "sticker2") =>
  `/photobooth/themes/${id}-${part}.webp`;

/**
 * Fills the canvas with the tile mirrored 2x2 (flipped copies meet edge to
 * edge), so the repeat is seamless even if the generated tile isn't.
 */
function drawMirroredTile(ctx: CanvasRenderingContext2D, tile: HTMLImageElement, w: number, h: number, size: number) {
  const block = document.createElement("canvas");
  block.width = block.height = Math.round(size * 2);
  const b = block.getContext("2d");
  if (!b) return;
  // Each copy is flipped around the block's far edge, landing in its own quadrant.
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
    b.save();
    b.translate(sx < 0 ? size * 2 : 0, sy < 0 ? size * 2 : 0);
    b.scale(sx, sy);
    b.drawImage(tile, 0, 0, size, size);
    b.restore();
  });
  const pattern = ctx.createPattern(block, "repeat");
  if (!pattern) return;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
}

function drawSticker(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, size: number, angleDeg: number) {
  const scale = size / Math.max(img.width, img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = size * 0.06;
  ctx.shadowOffsetY = size * 0.02;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function isLightColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  geo: ReturnType<typeof stripGeometry>,
  look: FooterLook,
  frameColor: string,
  caption: string,
  date: string,
  fontId: FontId,
) {
  if (!geo.footer) return;
  let top = geo.footerTop + geo.pad * 0.4;
  let bandH = geo.height - top;
  if (look.card && look.band) {
    // Floating rounded label card instead of a full-bleed band.
    top = geo.footerTop + geo.pad * 0.6;
    bandH = geo.height - top - geo.pad * 0.6;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = geo.pad * 0.5;
    ctx.fillStyle = look.band;
    fillRoundRect(ctx, geo.pad, top, geo.width - geo.pad * 2, bandH, bandH * 0.18);
    ctx.restore();
  } else if (look.band) {
    ctx.fillStyle = look.band;
    ctx.fillRect(0, top, geo.width, bandH);
  }
  const font = FONT_OPTIONS.find((f) => f.id === fontId) ?? FONT_OPTIONS[0];
  ctx.fillStyle = look.ink ?? (isLightColor(frameColor) ? "#1c1917" : "#fafaf9");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cx = geo.width / 2;
  const text = font.upper ? caption.toUpperCase() : caption;
  const maxW = geo.width - geo.pad * 2;
  if (text && date) {
    ctx.font = font.css(geo.footer * 0.3);
    ctx.fillText(text, cx, top + bandH * 0.42, maxW);
    ctx.font = font.css(geo.footer * 0.17);
    ctx.globalAlpha = 0.75;
    ctx.fillText(date, cx, top + bandH * 0.72, maxW);
    ctx.globalAlpha = 1;
  } else {
    ctx.font = font.css(geo.footer * (text ? 0.32 : 0.2));
    ctx.fillText(text || date, cx, top + bandH / 2, maxW);
  }
}

const POLAROID_ANGLES = [-4, 3, -3, 4, -2, 2];

/** Draws one photo as a slightly tilted, drop-shadowed polaroid with a washi-tape strip. */
function drawPolaroidPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
  angleDeg: number,
  tapeColor: string,
) {
  const scale = 0.9;
  const w = cellW * scale;
  const h = cellH * scale;
  const border = Math.min(w, h) * 0.06;
  const bottomExtra = Math.min(w, h) * 0.16;
  const cx = cellX + cellW / 2;
  const cy = cellY + cellH / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = w * 0.06;
  ctx.shadowOffsetY = w * 0.02;
  ctx.fillStyle = "#fdfaf3";
  ctx.fillRect(-w / 2 - border, -h / 2 - border, w + border * 2, h + border * 2 + bottomExtra);
  ctx.restore();

  drawCover(ctx, img, -w / 2, -h / 2, w, h);

  ctx.globalAlpha = 0.85;
  ctx.fillStyle = tapeColor;
  ctx.fillRect(-w * 0.22, -h / 2 - border - w * 0.06, w * 0.44, w * 0.12);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawPushPin(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.arc(x + size * 0.06, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e74c3c";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStitchedBorder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const short = Math.min(w, h);
  const inset = short * 0.025;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = short * 0.004;
  ctx.setLineDash([short * 0.012, short * 0.01]);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.setLineDash([]);
}

const EMOJI_CATEGORIES = Object.keys(EMOJI_FRAME_SETS);

/** Phone-keyboard-style emoji picker: category tabs + a tap-to-insert grid. */
function EmojiPickerButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="shrink-0">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="mb-2 flex flex-wrap gap-1 border-b pb-2">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
          {EMOJI_FRAME_SETS[category].map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              onClick={() => onPick(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function PhotoBoothPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestIdRef = useRef(0);
  const thumbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSnapshotAtRef = useRef(0);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [colorTemp, setColorTemp] = useState(0);
  const [blur, setBlur] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [camPinned, setCamPinned] = useState(true);
  const [filter, setFilter] = useState("none");
  const [layoutId, setLayoutId] = useState("strip4");
  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];
  const slots = layout.cols * layout.rows + (layout.kind === "hero" ? 1 : 0);
  const [cellW, cellH] = CELL_SIZE[layout.aspect];
  const [radius, setRadius] = useState(0);
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [selectedFrame, setSelectedFrame] = useState("none");
  const [customEmoji, setCustomEmoji] = useState("✨🎈🎉");
  const [customMode, setCustomMode] = useState<"single" | "multiple">("multiple");
  const [neonColor, setNeonColor] = useState("#00f2ff");
  const [neonStyle, setNeonStyle] = useState<NeonStyle>("glow");
  const [stripStyle, setStripStyle] = useState<StripStyleId>("none");
  const [themeId, setThemeId] = useState<string | null>(null);
  const [missingThemes, setMissingThemes] = useState<string[]>([]);
  const [themeCat, setThemeCat] = useState<ThemeCategory>("All");
  const [caption, setCaption] = useState("Share The Moment");
  const [showDate, setShowDate] = useState(true);
  const [fontId, setFontId] = useState<FontId>("script");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [timerSeconds, setTimerSeconds] = useState(3);
  const [timerActive, setTimerActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const [canShare, setCanShare] = useState(false);
  const prevPhotoCount = useRef(0);
  const stripRef = useRef<HTMLCanvasElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const imgCacheRef = useRef(new Map<string, HTMLImageElement>());
  const renderIdRef = useRef(0);
  const primaryActionRef = useRef<() => void>(() => {});

  const refs = useRef({
    brightness,
    contrast,
    vignette,
    colorTemp,
    blur,
    mirror,
    filter,
    radius,
    frameColor,
    selectedFrame,
    customEmoji,
    customMode,
    neonColor,
    neonStyle,
    cellW,
    cellH,
  });

  useEffect(() => {
    refs.current = {
      cellW,
      cellH,
      brightness,
      contrast,
      vignette,
      colorTemp,
      blur,
      mirror,
      filter,
      radius,
      frameColor,
      selectedFrame,
      customEmoji,
      customMode,
      neonColor,
      neonStyle,
    };
  }, [
    brightness,
    contrast,
    vignette,
    colorTemp,
    blur,
    mirror,
    filter,
    radius,
    frameColor,
    selectedFrame,
    customEmoji,
    customMode,
    neonColor,
    neonStyle,
    cellW,
    cellH,
  ]);

  const renderDecoration = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frameId: string,
  ) => {
    if (frameId === "none") return;
    ctx.save();
    const short = Math.min(w, h);

    if (frameId === "custom") {
      const list = splitEmoji(refs.current.customEmoji);
      renderEmojiFrame(ctx, w, h, list.length ? list : ["✨"], refs.current.customMode);
      ctx.restore();
      return;
    }

    const emojiSet = EMOJI_FRAME_SETS[frameId];
    if (emojiSet) {
      renderEmojiFrame(ctx, w, h, emojiSet, "multiple");
      ctx.restore();
      return;
    }

    switch (frameId) {
      case "neon": {
        const color = refs.current.neonColor;
        const style = refs.current.neonStyle;
        ctx.shadowBlur = short * 0.03;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;

        if (style === "glow") {
          ctx.lineWidth = short * 0.02;
          const inset = ctx.lineWidth / 2;
          ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
        } else if (style === "double") {
          ctx.lineWidth = short * 0.008;
          const inset1 = short * 0.02;
          const inset2 = short * 0.05;
          ctx.strokeRect(inset1, inset1, w - inset1 * 2, h - inset1 * 2);
          ctx.strokeRect(inset2, inset2, w - inset2 * 2, h - inset2 * 2);
        } else if (style === "corners") {
          ctx.lineWidth = short * 0.018;
          const len = short * 0.16;
          const m = short * 0.045;
          const brackets: [number, number, number, number][] = [
            [m, m, 1, 1],
            [w - m, m, -1, 1],
            [w - m, h - m, -1, -1],
            [m, h - m, 1, -1],
          ];
          brackets.forEach(([x, y, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(x, y + dy * len);
            ctx.lineTo(x, y);
            ctx.lineTo(x + dx * len, y);
            ctx.stroke();
          });
        } else if (style === "dashed") {
          ctx.lineWidth = short * 0.014;
          ctx.setLineDash([short * 0.035, short * 0.02]);
          ctx.lineDashOffset = -((Date.now() / 40) % (short * 0.055));
          const inset = ctx.lineWidth / 2;
          ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
          ctx.setLineDash([]);
        }
        break;
      }
      case "dots": {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        const margin = short * 0.1;
        for (let i = 0; i < 24; i++) {
          const { x, y } = pointOnBorder((i + 0.5) / 24, w, h, margin);
          ctx.beginPath();
          ctx.arc(x, y, short * 0.012, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "bubble": {
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        const margin = short * 0.11;
        for (let i = 0; i < 14; i++) {
          const { x, y } = pointOnBorder((i + 0.5) / 14, w, h, margin);
          const jitter = Math.sin(i * 5.37) * (margin * 0.2);
          ctx.beginPath();
          ctx.arc(x, y + jitter, short * 0.025, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case "retro": {
        const bezel = short * 0.045;
        ctx.fillStyle = "#171717";
        ctx.fillRect(0, 0, w, bezel);
        ctx.fillRect(0, h - bezel, w, bezel);
        ctx.fillRect(0, 0, bezel, h);
        ctx.fillRect(w - bezel, 0, bezel, h);

        ctx.fillStyle = "rgba(0,0,0,0.07)";
        for (let y = bezel; y < h - bezel; y += 6) {
          ctx.fillRect(bezel, y, w - bezel * 2, 2);
        }

        const g = ctx.createRadialGradient(
          w / 2, h / 2, short * 0.2,
          w / 2, h / 2, short * 0.62,
        );
        g.addColorStop(0, "rgba(40,20,0,0)");
        g.addColorStop(1, "rgba(40,20,0,0.18)");
        ctx.fillStyle = g;
        ctx.fillRect(bezel, bezel, w - bezel * 2, h - bezel * 2);
        break;
      }
      case "cyber": {
        const len = short * 0.17;
        const m = short * 0.045;
        const brackets: [number, number, number, number][] = [
          [m, m, 1, 1],
          [w - m, m, -1, 1],
          [w - m, h - m, -1, -1],
          [m, h - m, 1, -1],
        ];
        ctx.lineWidth = short * 0.01;
        [
          { color: "#00f2ff", offset: -short * 0.006 },
          { color: "#ff00ff", offset: short * 0.006 },
        ].forEach(({ color, offset }) => {
          ctx.strokeStyle = color;
          brackets.forEach(([x, y, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(x + offset, y + dy * len);
            ctx.lineTo(x + offset, y);
            ctx.lineTo(x + dx * len + offset, y);
            ctx.stroke();
          });
        });
        break;
      }
      case "checker": {
        const s = short * 0.045;
        let col = 0;
        for (let x = 0; x < w; x += s, col++) {
          ctx.fillStyle = col % 2 === 0 ? "#111111" : "#f5f5f5";
          ctx.fillRect(x, 0, s, s);
          ctx.fillRect(x, h - s, s, s);
        }
        break;
      }
      case "polaroid": {
        const border = short * 0.045;
        const bottomExtra = short * 0.16;
        ctx.fillStyle = "#fafaf5";
        ctx.fillRect(0, 0, w, border);
        ctx.fillRect(0, 0, border, h);
        ctx.fillRect(w - border, 0, border, h);
        ctx.fillRect(0, h - bottomExtra, w, bottomExtra);
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 1;
        ctx.strokeRect(border, border, w - border * 2, h - border - bottomExtra);
        break;
      }
      case "filmstrip": {
        const barH = short * 0.09;
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, w, barH);
        ctx.fillRect(0, h - barH, w, barH);

        ctx.fillStyle = "#fafafa";
        const holeSize = barH * 0.42;
        const gap = holeSize * 1.7;
        for (let x = gap / 2; x < w; x += gap) {
          fillRoundRect(ctx, x - holeSize / 2, barH / 2 - holeSize / 2, holeSize, holeSize, 2);
          fillRoundRect(ctx, x - holeSize / 2, h - barH / 2 - holeSize / 2, holeSize, holeSize, 2);
        }
        break;
      }
      case "scalloped": {
        const margin = short * 0.05;
        const r = short * 0.02;
        const spacing = r * 1.9;
        ctx.fillStyle = "#fffdf7";
        for (let x = spacing / 2; x < w; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, margin / 2, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, h - margin / 2, r, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let y = spacing / 2; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(margin / 2, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(w - margin / 2, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "washi": {
        const drawTape = (cx: number, cy: number, angle: number, color: string) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = color;
          ctx.fillRect(-short * 0.09, -short * 0.03, short * 0.18, short * 0.06);
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          ctx.lineWidth = short * 0.006;
          for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * short * 0.025, -short * 0.03);
            ctx.lineTo(i * short * 0.025, short * 0.03);
            ctx.stroke();
          }
          ctx.restore();
        };
        drawTape(w * 0.14, h * 0.1, -0.35, "#f4a5ae");
        drawTape(w * 0.86, h * 0.9, -0.35, "#a5d8ff");
        break;
      }
      case "twibbon": {
        const color = refs.current.frameColor;
        const thickness = short * 0.05;
        const inset = thickness / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        strokeRoundRect(ctx, inset, inset, w - inset * 2, h - inset * 2, short * 0.05);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(w / 2, thickness, short * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `${short * 0.045}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", w / 2, thickness);
        break;
      }
    }
    ctx.restore();
  };

  const startCamera = async (mode: "user" | "environment") => {
    // Concurrency guard: if startCamera is called again (e.g. rapid
    // flip-camera taps, or a mount-effect double-invoke) before this call's
    // getUserMedia() resolves, only the most recent call may win. Stale
    // calls stop whatever stream they acquired instead of assigning it, so
    // no MediaStream handle is ever leaked/orphaned.
    const requestId = ++cameraRequestIdRef.current;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (requestId !== cameraRequestIdRef.current) {
        // A newer startCamera() call started in the meantime; this stream
        // lost the race, so stop it immediately instead of leaking it.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      // No other in-flight call can have written streamRef.current here:
      // it was cleared at the top of this call, and any call that resolved
      // in the meantime with an older requestId would have hit the guard
      // above instead of reaching this assignment.
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      if (requestId !== cameraRequestIdRef.current) return;
      // Only an explicit permission refusal is actually "access denied" -
      // NotReadableError (camera busy/in use by another app), AbortError,
      // OverconstrainedError, and NotFoundError are different failure modes
      // and must not be mislabeled as a permission problem.
      const name = err instanceof DOMException ? err.name : undefined;
      const isPermissionDenied = name === "NotAllowedError" || name === "PermissionDeniedError";
      toast({
        variant: "destructive",
        description: isPermissionDenied
          ? t("tool.photobooth.hint.camera")
          : t("tool.photobooth.hint.cameraUnavailable"),
      });
    }
  };

  const drawLoop = () => {
    // The whole body is guarded: a single bad frame (e.g. the camera briefly
    // reporting a 0x0 size while it's still focusing/exposing) must never be
    // allowed to throw here, since an uncaught error would skip the
    // requestAnimationFrame call below and permanently freeze the preview.
    try {
      const video = videoRef.current;
      const canvas = previewRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        // alpha: false steers some browsers (notably Linux Chrome) away from
        // a hardware video-decode compositing path that can render webcam
        // frames with a green color-space tint when drawn into a canvas.
        const ctx = canvas.getContext("2d", { alpha: false });
        if (ctx) {
          // Canvas is always locked to the container's 16:9 box, and the video
          // frame is cropped ("cover") into that exact rect. This keeps canvas
          // pixels identical to what CSS actually shows, so border decorations
          // drawn near the canvas edge never get sliced off by object-cover
          // cropping a mismatched source aspect ratio.
          const targetW = refs.current.cellW;
          const targetH = refs.current.cellH;
          if (canvas.width !== targetW) canvas.width = targetW;
          if (canvas.height !== targetH) canvas.height = targetH;

          const vw = video.videoWidth;
          const vh = video.videoHeight;
          const targetAspect = targetW / targetH;
          const videoAspect = vw / vh;
          let sx = 0, sy = 0, sw = vw, sh = vh;
          if (videoAspect > targetAspect) {
            sw = vh * targetAspect;
            sx = (vw - sw) / 2;
          } else {
            sh = vw / targetAspect;
            sy = (vh - sh) / 2;
          }

          ctx.save();
          if (refs.current.mirror) {
            ctx.translate(targetW, 0);
            ctx.scale(-1, 1);
          }

          ctx.filter =
            refs.current.filter !== "none"
              ? refs.current.filter
              : `brightness(${refs.current.brightness}%) contrast(${refs.current.contrast}%) blur(${refs.current.blur}px)`;

          if (sw > 0 && sh > 0) {
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetW, targetH);
          }
          ctx.restore();

          if (refs.current.colorTemp !== 0) {
            ctx.fillStyle =
              refs.current.colorTemp > 0
                ? `rgba(255, 180, 0, ${Math.abs(refs.current.colorTemp) / 500})`
                : `rgba(0, 140, 255, ${Math.abs(refs.current.colorTemp) / 500})`;
            ctx.fillRect(0, 0, targetW, targetH);
          }

          if (refs.current.vignette > 0) {
            const g = ctx.createRadialGradient(
              targetW / 2,
              targetH / 2,
              targetH * 0.3,
              targetW / 2,
              targetH / 2,
              targetH * 0.7,
            );
            g.addColorStop(0, "transparent");
            g.addColorStop(1, `rgba(0,0,0,${refs.current.vignette / 100})`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, targetW, targetH);
          }

          renderDecoration(ctx, targetW, targetH, refs.current.selectedFrame);

          // Throttled downscaled snapshot for the Slider's touch-drag
          // magnifier bubble (see components/ui/slider.tsx) - the main loop
          // already redraws at ~60fps for the live camera feed, so this only
          // refreshes a small thumbnail a few times a second instead of
          // calling toDataURL on every frame.
          const now = performance.now();
          if (now - lastSnapshotAtRef.current > 150) {
            lastSnapshotAtRef.current = now;
            if (!thumbCanvasRef.current) thumbCanvasRef.current = document.createElement("canvas");
            const thumb = thumbCanvasRef.current;
            const thumbScale = 96 / Math.max(targetW, targetH);
            thumb.width = Math.max(1, Math.round(targetW * thumbScale));
            thumb.height = Math.max(1, Math.round(targetH * thumbScale));
            const tctx = thumb.getContext("2d");
            if (tctx) {
              tctx.clearRect(0, 0, thumb.width, thumb.height);
              tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
              setSnapshotUrl(thumb.toDataURL());
            }
          }
        }
      }
    } catch {
      // Skip this frame; the loop below keeps running so the preview
      // recovers on the next tick instead of freezing forever.
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  };

  useEffect(() => {
    startCamera(facingMode);
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturePhoto = () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    // JPEG instead of PNG: these are photographic frames (noise/detail
    // heavy, no transparency needed), so lossless PNG just balloons
    // memory/file size for no visible benefit at this quality.
    const shot = canvas.toDataURL("image/jpeg", 0.92);
    if (retakeIndex !== null) {
      setPhotos((prev) => prev.map((p, i) => (i === retakeIndex ? shot : p)));
      setRetakeIndex(null);
      // A retake is one shot; the photo count doesn't change, so the
      // sequence effect below never fires - stop the timer here instead.
      setTimerActive(false);
    } else {
      setPhotos((prev) => (prev.length >= slots ? prev : [...prev, shot]));
    }
    if (soundOn) beep(1400, 0.2);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const startTimerSequence = () => {
    if (photos.length >= slots && retakeIndex === null) return;
    setTimerActive(true);
    setCountdown(timerSeconds);
  };

  const cancelTimerSequence = () => {
    setTimerActive(false);
    setCountdown(0);
  };

  // Ticks the on-screen countdown down to zero, once per second.
  useEffect(() => {
    if (!timerActive || countdown <= 0) return;
    if (soundOn) beep(countdown === 1 ? 990 : 660, 0.1);
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, countdown]);

  // Fires the capture the instant the countdown reaches zero.
  useEffect(() => {
    if (!timerActive || countdown !== 0) return;
    capturePhoto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, countdown]);

  // After each shot in an active sequence, queue the next countdown or stop once the grid is full.
  useEffect(() => {
    if (photos.length === prevPhotoCount.current) return;
    prevPhotoCount.current = photos.length;
    if (!timerActive) return;
    if (photos.length >= slots) {
      setTimerActive(false);
      setCountdown(0);
      return;
    }
    const id = setTimeout(() => setCountdown(timerSeconds), 1200);
    return () => clearTimeout(id);
  }, [photos.length, timerActive, slots, timerSeconds]);

  // Switching to a smaller layout drops the shots that no longer fit.
  useEffect(() => {
    setPhotos((prev) => (prev.length > slots ? prev.slice(0, slots) : prev));
    setRetakeIndex(null);
  }, [slots]);

  useEffect(() => {
    try {
      setCanShare(
        typeof navigator.canShare === "function" &&
          navigator.canShare({ files: [new File([""], "x.jpg", { type: "image/jpeg" })] }),
      );
    } catch {
      setCanShare(false);
    }
  }, []);

  const loadImage = (src: string) => {
    const cached = imgCacheRef.current.get(src);
    if (cached?.complete) return Promise.resolve(cached);
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = cached ?? new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      if (!cached) {
        img.src = src;
        imgCacheRef.current.set(src, img);
      }
    });
  };

  const dateText = showDate
    ? new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "";
  const geometry = stripGeometry(layout, stripStyle, Boolean(caption.trim() || dateText), Boolean(themeId));

  /** Composites the whole strip into `canvas`. `placeholders` draws numbered empty slots (live preview only). */
  const renderStrip = async (canvas: HTMLCanvasElement, placeholders: boolean) => {
    const renderId = placeholders ? ++renderIdRef.current : 0;
    const shots = photos.slice(0, slots);
    const imgs = await Promise.all(shots.map(loadImage));
    const theme = STRIP_THEMES.find((th) => th.id === themeId);
    const [tile, sticker1, sticker2] = theme
      ? await Promise.all(
          (["tile", "sticker1", "sticker2"] as const).map((part) =>
            loadImage(themeAsset(theme.id, part)).catch(() => null),
          ),
        )
      : [null, null, null];
    // A newer render started while images decoded; let it win.
    if (placeholders && renderId !== renderIdRef.current) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const geo = geometry;
    canvas.width = geo.width;
    canvas.height = geo.height;

    if (theme) {
      ctx.fillStyle = theme.band;
      ctx.fillRect(0, 0, geo.width, geo.height);
      if (tile) drawMirroredTile(ctx, tile, geo.width, geo.height, Math.min(geo.cellW, geo.cellH) * 0.75);
    } else {
      drawStripBackground(ctx, geo.width, geo.height, stripStyle, frameColor);
    }
    const cornerR = radius * (geo.cellW / 640);

    geo.cells.forEach(({ x, y, w, h }, i) => {
      const img = imgs[i];
      const shape = shapeAt(layout, i);
      if (!img) {
        if (!placeholders) return;
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fill(cellPath(shape, x, y, w, h, cornerR));
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.font = `600 ${Math.min(w, h) * 0.22}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1).padStart(2, "0"), x + w / 2, y + h / 2);
        ctx.restore();
        return;
      }
      if (theme) {
        const border = Math.min(w, h) * 0.035;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.22)";
        ctx.shadowBlur = border * 1.5;
        ctx.shadowOffsetY = border * 0.4;
        ctx.fillStyle = "#ffffff";
        ctx.fill(cellPath(shape, x - border, y - border, w + border * 2, h + border * 2, cornerR + border));
        ctx.restore();
      } else if (stripStyle === "strip-scrapbook" && !shape) {
        const angle = POLAROID_ANGLES[i % POLAROID_ANGLES.length];
        drawPolaroidPhoto(ctx, img, x, y, w, h, angle, i % 2 === 0 ? "#f4a9b8" : "#a9d4f4");
        return;
      }
      if (stripStyle === "strip-denim") {
        const border = Math.min(w, h) * 0.035;
        ctx.fillStyle = "#fdfaf3";
        ctx.fill(cellPath(shape, x - border, y - border, w + border * 2, h + border * 2, 0));
      }
      ctx.save();
      ctx.clip(cellPath(shape, x, y, w, h, cornerR));
      drawCover(ctx, img, x, y, w, h);
      ctx.restore();
      if (theme || shape) {
        // themed/shaped cells stay clean; rect accents would poke outside the shape
      } else if (stripStyle === "strip-denim") {
        drawPushPin(ctx, x + w / 2, y - Math.min(w, h) * 0.035, Math.min(w, h) * 0.06);
      } else {
        drawCellAccent(ctx, x, y, w, h, stripStyle, i);
      }
    });

    renderDecoration(ctx, geo.width, geo.height, selectedFrame);
    if (stripStyle === "strip-denim" && !theme) drawStitchedBorder(ctx, geo.width, geo.height);
    if (theme) {
      const size = Math.min(geo.cellW, geo.cellH) * 0.55;
      if (sticker1) drawSticker(ctx, sticker1, geo.pad + size * 0.2, geo.pad + size * 0.15, size, -12);
      if (sticker2) drawSticker(ctx, sticker2, geo.width - geo.pad - size * 0.2, geo.footerTop - size * 0.15, size, 10);
    }
    drawFooter(
      ctx,
      geo,
      theme ? { band: theme.band, ink: theme.ink, card: true } : FOOTER_LOOK[stripStyle],
      frameColor,
      caption.trim(),
      dateText,
      fontId,
    );
    for (const key of imgCacheRef.current.keys()) {
      if (key.startsWith("data:") && !photos.includes(key)) imgCacheRef.current.delete(key);
    }
    return canvas;
  };

  // Live WYSIWYG strip: re-composite whenever anything that shows up in the
  // downloaded image changes.
  useEffect(() => {
    if (stripRef.current) renderStrip(stripRef.current, true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, layoutId, stripStyle, themeId, frameColor, caption, showDate, fontId, radius, selectedFrame, customEmoji, customMode, neonColor, neonStyle]);

  const buildGridCanvas = async () => {
    if (!exportRef.current || photos.length === 0) return null;
    return renderStrip(exportRef.current, false);
  };

  const downloadGrid = async () => {
    const canvas = await buildGridCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg", 0.92);
    link.download = `photobooth-mojepict-${filenameTimestamp()}.jpg`;
    link.click();
    toast({
      title: t("common.success"),
      description: t("toast.success.downloaded"),
    });
  };

  const getGridBlob = async (type = "image/png"): Promise<Blob | null> => {
    const canvas = await buildGridCanvas();
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
  };

  const shareGrid = async () => {
    const blob = await getGridBlob("image/jpeg");
    if (!blob) return;
    try {
      await navigator.share({
        files: [new File([blob], `photobooth-mojepict-${filenameTimestamp()}.jpg`, { type: "image/jpeg" })],
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  /** Imports picked images as shots, cover-cropped to the cell and run through the active filter. */
  const importPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const shots: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new window.Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = url;
        });
        const c = document.createElement("canvas");
        c.width = cellW;
        c.height = cellH;
        const ctx = c.getContext("2d");
        if (!ctx) continue;
        ctx.filter =
          filter !== "none" ? filter : `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;
        drawCover(ctx, img, 0, 0, cellW, cellH);
        ctx.filter = "none";
        renderDecoration(ctx, cellW, cellH, selectedFrame);
        shots.push(c.toDataURL("image/jpeg", 0.92));
      } catch {
        // skip undecodable file
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    if (!shots.length) return;
    if (retakeIndex !== null) {
      setPhotos((prev) => prev.map((p, i) => (i === retakeIndex ? shots[0] : p)));
      setRetakeIndex(null);
    } else {
      setPhotos((prev) => [...prev, ...shots].slice(0, slots));
    }
  };

  const gridFull = photos.length >= slots && retakeIndex === null;
  const cameraShape = shapeAt(layout, retakeIndex ?? Math.min(photos.length, slots - 1));

  const primaryAction = timerActive
    ? cancelTimerSequence
    : timerSeconds > 0
      ? startTimerSequence
      : capturePhoto;
  primaryActionRef.current = gridFull && !timerActive ? () => {} : primaryAction;

  // Space bar = shutter, like a real booth button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, button, [role=combobox], [contenteditable=true]")) return;
      e.preventDefault();
      primaryActionRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loupePreview = snapshotUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={snapshotUrl} alt="" className="h-full w-full object-cover" />
  ) : null;

  return (
    <ToolShell
      title={t("tool.photobooth.name")}
      description={t("tool.photobooth.description")}
      fullWidth
    >
      {/* Mobile: flatten the panes so the camera sticks on top while scrolling controls, and the strip drops to the end. */}
      <ToolWorkspace
        className="max-lg:[&>div:first-child]:contents"
        sidebar={
          <>
            <Tabs defaultValue="adjust" className="w-full">
              <TabsList className="z-10 w-full ring-4 ring-background lg:sticky lg:top-0">
                <TabsTrigger value="adjust" className="flex-1 gap-1 text-[11px]">
                  <Settings2 className="h-3 w-3" /> Adjust
                </TabsTrigger>
                <TabsTrigger value="filter" className="flex-1 gap-1 text-[11px]">
                  <Palette className="h-3 w-3" /> Filter
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex-1 gap-1 text-[11px]">
                  <Grid3X3 className="h-3 w-3" /> Layout
                </TabsTrigger>
                <TabsTrigger value="frames" className="flex-1 gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3" /> Frames
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Sun className="h-3 w-3" /> Brightness ({brightness}%)
                  </Label>
                  <Slider
                    value={[brightness]}
                    min={50}
                    max={150}
                    onValueChange={(v) => setBrightness(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <ContrastIcon className="h-3 w-3" /> Contrast ({contrast}%)
                  </Label>
                  <Slider
                    value={[contrast]}
                    min={50}
                    max={150}
                    onValueChange={(v) => setContrast(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Thermometer className="h-3 w-3" /> Temp (Warm/Cold)
                  </Label>
                  <Slider
                    value={[colorTemp]}
                    min={-100}
                    max={100}
                    onValueChange={(v) => setColorTemp(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Vignette ({vignette}%)
                  </Label>
                  <Slider
                    value={[vignette]}
                    min={0}
                    max={100}
                    onValueChange={(v) => setVignette(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Blur ({blur}px)
                  </Label>
                  <Slider
                    value={[blur]}
                    min={0}
                    max={10}
                    step={0.1}
                    onValueChange={(v) => setBlur(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Fullscreen className="h-3 w-3" />{" "}
                    {t("tool.photobooth.label.radius")} ({radius}
                    px)
                  </Label>
                  <Slider
                    value={[radius]}
                    min={0}
                    max={50}
                    onValueChange={(v) => setRadius(v[0])}
                  />
                </div>
              </TabsContent>

              <TabsContent value="filter" className="pt-4">
                <Combobox value={filter} onValueChange={setFilter} options={FILTER_OPTIONS} />
                <p className="mt-4 text-[10px] text-muted-foreground">
                  * Filters override Manual Adjustments (Brightness/Contrast/Blur)
                </p>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("tool.photobooth.label.grid")}
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {LAYOUTS.map((l) => {
                      const g = stripGeometry(l, "none", false);
                      const scale = Math.min(40 / (g.width - g.pad * 2), 40 / (g.height - g.pad * 2));
                      return (
                        <button
                          key={l.id}
                          type="button"
                          disabled={timerActive}
                          onClick={() => setLayoutId(l.id)}
                          className={cn(
                            "flex h-20 flex-col items-center justify-between rounded-lg border p-1.5 transition-colors disabled:opacity-50",
                            layoutId === l.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <div className="flex flex-1 items-center">
                            <svg
                              width={(g.width - g.pad * 2) * scale}
                              height={(g.height - g.pad * 2) * scale}
                              className="overflow-visible fill-current opacity-50"
                              aria-hidden
                            >
                              {g.cells.map((c, i) => {
                                const shape = shapeAt(l, i);
                                const x = (c.x - g.pad) * scale + 1;
                                const y = (c.y - g.pad) * scale + 1;
                                const w = c.w * scale - 2;
                                const h = c.h * scale - 2;
                                return shape ? (
                                  <path key={i} d={SHAPES[shape]} transform={`translate(${x} ${y}) scale(${w / 100} ${h / 100})`} />
                                ) : (
                                  <rect key={i} x={x} y={y} width={w} height={h} rx={1} />
                                );
                              })}
                            </svg>
                          </div>
                          <span className="w-full truncate text-center text-[9px] font-medium">
                            {l.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Caption
                  </Label>
                  <Input
                    value={caption}
                    maxLength={40}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Share The Moment"
                    className="text-sm"
                  />
                  <div className="grid grid-cols-4 gap-1">
                    {FONT_OPTIONS.map((f) => (
                      <Button
                        key={f.id}
                        type="button"
                        size="sm"
                        variant={fontId === f.id ? "default" : "outline"}
                        onClick={() => setFontId(f.id)}
                        className="h-8 px-1 text-[10px]"
                        style={{ font: f.css(11) }}
                      >
                        {f.upper ? f.name.toUpperCase() : f.name}
                      </Button>
                    ))}
                  </div>
                  <label className="flex items-center justify-between text-xs">
                    Show date
                    <Switch checked={showDate} onCheckedChange={setShowDate} />
                  </label>
                </div>

              </TabsContent>

              <TabsContent value="frames" className="space-y-4 pt-4">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Strip themes
                </Label>
                <div className="flex flex-wrap gap-1">
                  {THEME_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setThemeCat(c)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors",
                        themeCat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STRIP_THEMES.filter(
                    (th) => !missingThemes.includes(th.id) && (themeCat === "All" || th.cat === themeCat),
                  ).map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setThemeId(themeId === th.id ? null : th.id)}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition",
                        themeId === th.id ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={themeAsset(th.id, "tile")}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        // Art not generated yet / failed to load: hide the theme instead of showing a blank card.
                        onError={() => setMissingThemes((m) => [...m, th.id])}
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={themeAsset(th.id, "sticker1")}
                        alt=""
                        loading="lazy"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                        className="absolute left-1/2 top-[42%] w-3/5 -translate-x-1/2 -translate-y-1/2 -rotate-6 drop-shadow transition-transform group-hover:scale-110"
                      />
                      <span
                        className="absolute inset-x-1 bottom-1 truncate rounded px-1 py-0.5 text-center text-[10px] font-semibold"
                        style={{ background: th.band, color: th.ink }}
                      >
                        {th.name}
                      </span>
                    </button>
                  ))}
                </div>

                <Label className="block pt-2 text-[10px] uppercase font-bold text-muted-foreground">
                  Classic styles
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {STRIP_STYLES.map((st) => (
                    <Button
                      key={st.id}
                      type="button"
                      size="sm"
                      variant={!themeId && stripStyle === st.id ? "default" : "outline"}
                      onClick={() => {
                        setThemeId(null);
                        setStripStyle(st.id);
                      }}
                      className="h-auto py-2 text-xs"
                    >
                      {st.name}
                    </Button>
                  ))}
                </div>

                <Label className="block border-t pt-4 text-[10px] uppercase font-bold text-muted-foreground">
                  Photo overlay
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {DECORATIVE_FRAMES.map((f) => (
                    <Button
                      key={f.id}
                      variant={selectedFrame === f.id ? "default" : "outline"}
                      className="h-14 flex flex-col items-center justify-center gap-1 p-1"
                      onClick={() => setSelectedFrame(f.id)}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-[9px] truncate w-full text-center">
                        {f.name}
                      </span>
                    </Button>
                  ))}
                </div>

                {(selectedFrame === "none" || selectedFrame === "twibbon") && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                      {t("tool.photobooth.label.frame")}
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {FRAME_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={c}
                          onClick={() => setFrameColor(c)}
                          className={cn(
                            "h-7 w-7 shrink-0 rounded-full border cursor-pointer transition-transform",
                            frameColor.toLowerCase() === c && "ring-2 ring-primary ring-offset-2 scale-105",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <label
                        className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border"
                        style={{
                          background:
                            "conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)",
                        }}
                      >
                        <input
                          type="color"
                          aria-label="Custom frame color"
                          value={/^#[0-9a-fA-F]{6}$/.test(frameColor) ? frameColor : "#ffffff"}
                          onChange={(e) => setFrameColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>
                    <Input
                      value={frameColor}
                      onChange={(e) => setFrameColor(e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {selectedFrame === "neon" && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Neon color
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {NEON_COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={c}
                          onClick={() => setNeonColor(c)}
                          className={cn(
                            "h-7 w-7 shrink-0 rounded-full border cursor-pointer transition-transform",
                            neonColor.toLowerCase() === c && "ring-2 ring-primary ring-offset-2 scale-105",
                          )}
                          style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
                        />
                      ))}
                      <label
                        className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border"
                        style={{
                          background:
                            "conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)",
                        }}
                      >
                        <input
                          type="color"
                          aria-label="Custom neon color"
                          value={/^#[0-9a-fA-F]{6}$/.test(neonColor) ? neonColor : "#00f2ff"}
                          onChange={(e) => setNeonColor(e.target.value)}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                    </div>

                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Neon style
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {NEON_STYLES.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          size="sm"
                          variant={neonStyle === s.id ? "default" : "outline"}
                          onClick={() => setNeonStyle(s.id)}
                        >
                          {s.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFrame === "custom" && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Your emoji
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          placeholder="✨🎈🎉"
                          className="text-lg"
                        />
                        <EmojiPickerButton
                          onPick={(emoji) => setCustomEmoji((prev) => prev + emoji)}
                        />
                        {customEmoji && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setCustomEmoji("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Tap the smiley to pick emoji, or paste/type your own.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                        Placement
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={customMode === "single" ? "default" : "outline"}
                          onClick={() => setCustomMode("single")}
                        >
                          Single
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={customMode === "multiple" ? "default" : "outline"}
                          onClick={() => setCustomMode("multiple")}
                        >
                          Multiple
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div role="radiogroup" aria-label="Timer" className="grid flex-1 grid-cols-4 gap-1 rounded-md bg-muted p-1">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={timerSeconds === opt.value}
                    disabled={timerActive}
                    onClick={() => setTimerSeconds(opt.value)}
                    className={cn(
                      "h-7 rounded text-xs font-medium transition-colors disabled:opacity-50",
                      timerSeconds === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <ToolActionBar
              primaryLabel={
                timerActive
                  ? `Cancel (${countdown})`
                  : retakeIndex !== null
                    ? `Retake shot ${retakeIndex + 1}`
                    : timerSeconds > 0
                      ? photos.length === 0
                        ? `Start session (${slots} shots)`
                        : `Continue (${photos.length}/${slots})`
                      : t("action.capture")
              }
              primaryIcon={
                timerActive ? (
                  <X className="h-4 w-4" />
                ) : timerSeconds > 0 ? (
                  <Timer className="h-4 w-4" />
                ) : (
                  <Camera className="h-4 w-4" />
                )
              }
              onPrimary={primaryAction}
              primaryDisabled={!timerActive && gridFull}
              onReset={() => {
                cancelTimerSequence();
                setRetakeIndex(null);
                setPhotos([]);
              }}
              resetLabel={t("action.clearAll")}
              resetDisabled={photos.length === 0}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => uploadRef.current?.click()}
                disabled={timerActive || gridFull}
              >
                <Upload className="h-4 w-4" /> Upload photos
              </Button>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  importPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadGrid}
                disabled={photos.length === 0}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
              {canShare && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={shareGrid}
                  disabled={photos.length === 0}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              )}
              <CopyImageButton getBlob={() => getGridBlob()} disabled={photos.length === 0} />
              <p className="hidden text-center lg:block text-[10px] text-muted-foreground">
                Press <kbd className="rounded border px-1 font-mono">Space</kbd> to shoot
              </p>
            </ToolActionBar>
          </>
        }
      >
        <div className="grid items-start gap-6 max-lg:contents xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div
            className={cn(
              "space-y-3 [--cam-h:40svh] lg:[--cam-h:70vh]",
              camPinned &&
                "max-lg:sticky max-lg:-top-6 max-lg:z-20 max-lg:-mx-4 max-lg:bg-background max-lg:px-4 max-lg:pb-3 max-lg:pt-3 max-lg:shadow-sm sm:max-lg:-mx-6 sm:max-lg:px-6",
            )}
          >
            <div
              className="relative mx-auto overflow-hidden rounded-xl bg-black shadow-2xl"
              style={{
                aspectRatio: `${cellW} / ${cellH}`,
                width: `min(100%, calc(var(--cam-h) * ${cellW / cellH}))`,
                borderRadius: `${radius}px`,
              }}
            >
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={previewRef} className="h-full w-full object-cover" />
              {cameraShape && (
                // Dims everything outside the next cell's shape so the framing is obvious before the shot.
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                  <path d={`M0 0H100V100H0Z${SHAPES[cameraShape]}`} fillRule="evenodd" fill="rgba(0,0,0,0.55)" />
                </svg>
              )}

              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">
                  {retakeIndex !== null
                    ? `Retake ${String(retakeIndex + 1).padStart(2, "0")}`
                    : `Shot ${Math.min(photos.length + (gridFull ? 0 : 1), slots)} / ${slots}`}
                </span>
                {timerActive && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                  </span>
                )}
              </div>

              {timerActive && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span
                    key={countdown}
                    className="text-[9rem] font-black leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] animate-in zoom-in-50 fade-in duration-500"
                  >
                    {countdown}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-white transition-opacity duration-150",
                  flash ? "opacity-90" : "opacity-0",
                )}
              />

              <div className="absolute right-3 top-3 flex gap-2">
                {retakeIndex !== null && !timerActive && (
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setRetakeIndex(null)} aria-label="Cancel retake">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 lg:hidden"
                  onClick={() => setCamPinned(!camPinned)}
                  aria-label={camPinned ? "Unpin camera" : "Pin camera"}
                  aria-pressed={camPinned}
                >
                  {camPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setSoundOn(!soundOn)} aria-label="Toggle sound">
                  {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setMirror(!mirror)} aria-label="Mirror">
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  aria-label="Switch camera"
                  onClick={() => {
                    const next = facingMode === "user" ? "environment" : "user";
                    setFacingMode(next);
                    startCamera(next);
                  }}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>

              <button
                type="button"
                aria-label="Shutter"
                disabled={!timerActive && gridFull}
                onClick={primaryAction}
                className={cn(
                  "absolute bottom-4 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white/90 bg-white/20 backdrop-blur transition active:scale-90 disabled:opacity-40",
                  timerActive && "border-red-500",
                )}
              >
                <span className={cn("rounded-full bg-white transition-all", timerActive ? "h-6 w-6 rounded-md bg-red-500" : "h-11 w-11")} />
              </button>
            </div>

            <div className="flex justify-center gap-1.5">
              {Array.from({ length: slots }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i < photos.length ? "w-6 bg-primary" : "w-3 bg-muted",
                    i === retakeIndex && "bg-amber-500",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto w-fit max-w-full max-lg:order-last">
            <div className="relative inline-block rounded-md shadow-xl ring-1 ring-black/5">
              <canvas
                ref={stripRef}
                className="block h-auto max-h-[78vh] w-auto max-w-full rounded-md"
              />
              {geometry.cells.map((c, i) =>
                photos[i] ? (
                  <div
                    key={i}
                    className={cn(
                      "group absolute flex items-center justify-center gap-2",
                      retakeIndex === i && "ring-4 ring-amber-400",
                    )}
                    style={{
                      left: `${(c.x / geometry.width) * 100}%`,
                      top: `${(c.y / geometry.height) * 100}%`,
                      width: `${(c.w / geometry.width) * 100}%`,
                      height: `${(c.h / geometry.height) * 100}%`,
                    }}
                  >
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 opacity-100 shadow transition sm:opacity-0 sm:group-hover:opacity-100"
                      disabled={timerActive}
                      onClick={() => setRetakeIndex(i)}
                      aria-label={`Retake shot ${i + 1}`}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 opacity-100 shadow transition sm:opacity-0 sm:group-hover:opacity-100"
                      disabled={timerActive}
                      onClick={() => {
                        setRetakeIndex(null);
                        setPhotos(photos.filter((_, idx) => idx !== i));
                      }}
                      aria-label={`Delete shot ${i + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </ToolWorkspace>
      <canvas ref={exportRef} className="hidden" />
    </ToolShell>
  );
}
