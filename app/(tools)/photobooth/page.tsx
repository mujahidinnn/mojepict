"use client";

import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  RefreshCcw,
  Settings2,
  Smile,
  Sparkles,
  Sun,
  Thermometer,
  Timer,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Locks the preview/capture canvas to a fixed 16:9 resolution matching the
// container's `aspect-video` box, so the video is cropped ("cover") into it
// instead of the canvas inheriting the camera's raw (often non-16:9) size.
const PREVIEW_W = 1280;
const PREVIEW_H = 720;

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

const TIMER_OPTIONS = [
  { value: 0, label: "Timer: Off" },
  { value: 3, label: "Timer: 3s" },
  { value: 5, label: "Timer: 5s" },
  { value: 10, label: "Timer: 10s" },
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

function drawScriptBanner(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const barH = h * 0.07;
  ctx.fillStyle = "rgba(30,30,20,0.85)";
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = "#f4e8d0";
  ctx.font = `italic ${barH * 0.5}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h - barH / 2);
}

function drawBoldBanner(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const barH = h * 0.06;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${barH * 0.5}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), w / 2, barH / 2);
  ctx.fillText(text.toUpperCase(), w / 2, h - barH / 2);
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

  ctx.drawImage(img, -w / 2, -h / 2, w, h);

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

  const [photos, setPhotos] = useState<string[]>([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [colorTemp, setColorTemp] = useState(0);
  const [blur, setBlur] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [filter, setFilter] = useState("none");
  const [grid, setGrid] = useState({ cols: 2, rows: 3 });
  const [radius, setRadius] = useState(0);
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [selectedFrame, setSelectedFrame] = useState("none");
  const [customEmoji, setCustomEmoji] = useState("✨🎈🎉");
  const [customMode, setCustomMode] = useState<"single" | "multiple">("multiple");
  const [neonColor, setNeonColor] = useState("#00f2ff");
  const [neonStyle, setNeonStyle] = useState<NeonStyle>("glow");
  const [stripStyle, setStripStyle] = useState<StripStyleId>("none");
  const [bannerText, setBannerText] = useState("Share The Moment");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [flash, setFlash] = useState(false);
  const prevPhotoCount = useRef(0);

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
  });

  useEffect(() => {
    refs.current = {
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
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        description: t("tool.photobooth.hint.camera"),
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
          const targetW = PREVIEW_W;
          const targetH = PREVIEW_H;
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
    setPhotos((prev) => {
      if (prev.length >= grid.cols * grid.rows) return prev;
      // JPEG instead of PNG: these are photographic frames (noise/detail
      // heavy, no transparency needed), so lossless PNG just balloons
      // memory/file size for no visible benefit at this quality.
      return [...prev, canvas.toDataURL("image/jpeg", 0.92)];
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const startTimerSequence = () => {
    if (photos.length >= grid.cols * grid.rows) return;
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
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
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
    if (photos.length >= grid.cols * grid.rows) {
      setTimerActive(false);
      setCountdown(0);
      return;
    }
    const id = setTimeout(() => setCountdown(timerSeconds), 1000);
    return () => clearTimeout(id);
  }, [photos.length, timerActive, grid.cols, grid.rows, timerSeconds]);

  const buildGridCanvas = (): Promise<HTMLCanvasElement | null> => {
    const canvas = exportRef.current;
    if (!canvas || !previewRef.current || photos.length === 0)
      return Promise.resolve(null);
    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    const isScrapbook = stripStyle === "strip-scrapbook";
    const gap = isScrapbook ? 40 : 20;
    const pad = isScrapbook ? 50 : 30;
    const cellW = previewRef.current.width;
    const cellH = previewRef.current.height;
    canvas.width = pad * 2 + grid.cols * cellW + gap * (grid.cols - 1);
    canvas.height = pad * 2 + grid.rows * cellH + gap * (grid.rows - 1);

    drawStripBackground(ctx, canvas.width, canvas.height, stripStyle, frameColor);

    return new Promise((resolve) => {
      let loadedCount = 0;
      photos.forEach((src, i) => {
        const img = new window.Image();
        img.src = src;
        img.onload = () => {
          const x = pad + (i % grid.cols) * (cellW + gap);
          const y = pad + Math.floor(i / grid.cols) * (cellH + gap);

          if (stripStyle === "strip-scrapbook") {
            const angle = POLAROID_ANGLES[i % POLAROID_ANGLES.length];
            const tape = i % 2 === 0 ? "#f4a9b8" : "#a9d4f4";
            drawPolaroidPhoto(ctx, img, x, y, cellW, cellH, angle, tape);
          } else if (stripStyle === "strip-denim") {
            const border = Math.min(cellW, cellH) * 0.035;
            ctx.fillStyle = "#fdfaf3";
            ctx.fillRect(x - border, y - border, cellW + border * 2, cellH + border * 2);
            ctx.drawImage(img, x, y, cellW, cellH);
            drawPushPin(ctx, x + cellW / 2, y - border, Math.min(cellW, cellH) * 0.06);
          } else {
            ctx.drawImage(img, x, y, cellW, cellH);
            drawCellAccent(ctx, x, y, cellW, cellH, stripStyle, i);
          }

          loadedCount++;
          if (loadedCount === photos.length) {
            renderDecoration(ctx, canvas.width, canvas.height, selectedFrame);
            if (stripStyle === "strip-checkered") {
              drawScriptBanner(ctx, canvas.width, canvas.height, "Made With Love");
            } else if (stripStyle === "strip-banner") {
              drawBoldBanner(ctx, canvas.width, canvas.height, bannerText);
            } else if (stripStyle === "strip-denim") {
              drawStitchedBorder(ctx, canvas.width, canvas.height);
            }
            resolve(canvas);
          }
        };
      });
    });
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

  const getGridBlob = async (): Promise<Blob | null> => {
    const canvas = await buildGridCanvas();
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  };

  const gridFull = photos.length >= grid.cols * grid.rows;

  return (
    <ToolShell
      title={t("tool.photobooth.name")}
      description={t("tool.photobooth.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <Tabs defaultValue="adjust" className="w-full">
              <TabsList className="w-full">
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
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (Clean)</SelectItem>
                    <SelectItem value="brightness(110%) contrast(90%) saturate(120%) blur(0.3px)">
                      Sweet Look ✨
                    </SelectItem>
                    <SelectItem value="sepia(0.4) brightness(110%) hue-rotate(-10deg)">
                      Golden Hour ☀️
                    </SelectItem>
                    <SelectItem value="sepia(0.6) contrast(0.9) brightness(1.1)">
                      Vintage 🎞️
                    </SelectItem>
                    <SelectItem value="brightness(110%) contrast(120%) hue-rotate(180deg)">
                      Cold Tone ❄️
                    </SelectItem>
                    <SelectItem value="grayscale(100%)">Classic B&W</SelectItem>
                    <SelectItem value="grayscale(100%) contrast(150%)">
                      High Contrast B&W
                    </SelectItem>
                    <SelectItem value="brightness(105%) contrast(95%) saturate(120%) sepia(0.5) hue-rotate(-10deg)">
                      Retro 70s
                    </SelectItem>
                    <SelectItem value="brightness(110%) contrast(90%) saturate(85%) sepia(0.3) blur(0.4px)">
                      Retro 80s
                    </SelectItem>
                    <SelectItem value="brightness(70%) contrast(130%) hue-rotate(210deg)">
                      Midnight 🌙
                    </SelectItem>
                    <SelectItem value="contrast(200%) brightness(80%)">
                      Dramatic
                    </SelectItem>
                    <SelectItem value="blur(0.5px) brightness(115%)">
                      Soft Glow
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-4 text-[10px] text-muted-foreground">
                  * Filters override Manual Adjustments (Brightness/Contrast/Blur)
                </p>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("tool.photobooth.label.grid")}
                  </Label>
                  <Select
                    value={`${grid.cols}x${grid.rows}`}
                    onValueChange={(v) => {
                      const [c, r] = v.split("x").map(Number);
                      setGrid({ cols: c, rows: r });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2x3">2 x 3 Grid</SelectItem>
                      <SelectItem value="2x4">2 x 4 Grid</SelectItem>
                      <SelectItem value="3x3">3 x 3 Grid</SelectItem>
                      <SelectItem value="1x4">4 Strip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    Strip style (applies to the downloaded grid)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STRIP_STYLES.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        size="sm"
                        variant={stripStyle === s.id ? "default" : "outline"}
                        onClick={() => setStripStyle(s.id)}
                        className="h-auto py-2 text-xs"
                      >
                        {s.name}
                      </Button>
                    ))}
                  </div>
                  {stripStyle === "strip-banner" && (
                    <Input
                      value={bannerText}
                      onChange={(e) => setBannerText(e.target.value)}
                      placeholder="SHARE THE MOMENT"
                      className="text-sm"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Frame color (Classic / Twibbon / Holiday Banner background) is in the Frames tab.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="frames" className="space-y-4 pt-4">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Decorative Overlay
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

            <div className="flex items-center gap-2 rounded-lg border p-2">
              <Timer className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select
                value={String(timerSeconds)}
                onValueChange={(v) => setTimerSeconds(Number(v))}
                disabled={timerActive}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ToolActionBar
              primaryLabel={
                timerActive
                  ? `Cancel (${countdown})`
                  : timerSeconds > 0
                    ? `Start Timer (${timerSeconds}s)`
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
              onPrimary={
                timerActive
                  ? cancelTimerSequence
                  : timerSeconds > 0
                    ? startTimerSequence
                    : capturePhoto
              }
              primaryDisabled={!timerActive && gridFull}
              onReset={() => {
                cancelTimerSequence();
                setPhotos([]);
              }}
              resetLabel={t("action.clearAll")}
              resetDisabled={photos.length === 0}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadGrid}
                disabled={photos.length === 0}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
              <CopyImageButton getBlob={getGridBlob} disabled={photos.length === 0} />
            </ToolActionBar>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl group">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas
              ref={previewRef}
              className="w-full h-full object-cover"
              style={{ borderRadius: `${radius}px` }}
            />

            {timerActive && countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-8xl font-bold text-white drop-shadow-lg">
                  {countdown}
                </span>
              </div>
            )}

            <div
              className={cn(
                "absolute inset-0 bg-white pointer-events-none transition-opacity duration-150",
                flash ? "opacity-80" : "opacity-0",
              )}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setMirror(!mirror)}
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  const next = facingMode === "user" ? "environment" : "user";
                  setFacingMode(next);
                  startCamera(next);
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="grid gap-4 rounded-xl shadow-lg border"
            style={{
              gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
              backgroundColor: frameColor,
              padding: "24px",
              gap: "12px",
            }}
          >
            {Array.from({ length: grid.cols * grid.rows }).map((_, i) => (
              <div
                key={i}
                className="aspect-video bg-muted/20 rounded-sm overflow-hidden relative group border border-white/10"
              >
                {photos[i] ? (
                  <>
                    <Image
                      src={photos[i]}
                      alt="Captured"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                      onClick={() =>
                        setPhotos(photos.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 border-2 border-dashed border-muted-foreground">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ToolWorkspace>
      <canvas ref={exportRef} className="hidden" />
    </ToolShell>
  );
}
