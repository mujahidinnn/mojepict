import {
  AlignLeft,
  AppWindow,
  ArrowRightLeft,
  Binary,
  Blend,
  BookmarkCheck,
  Brush,
  Cake,
  Calculator,
  Camera,
  Clock,
  Code2,
  Contrast,
  Crop,
  Cpu,
  Eraser,
  FileCode,
  Fingerprint,
  Frame,
  GitCompare,
  Grid3X3,
  Hash,
  HeartPulse,
  ImageIcon,
  KeyRound,
  Link2,
  LucideIcon,
  PackageOpen,
  PaintbrushVertical,
  Palette,
  PenTool,
  Percent,
  Pilcrow,
  Pipette,
  QrCode,
  Receipt,
  Regex,
  Ruler,
  ScanQrCode,
  ScanSearch,
  Scaling,
  Smartphone,
  SwatchBook,
  Type,
  Unlock,
  Zap,
} from "lucide-react";

/**
 * Single source of truth for tool icon + category color, so the homepage
 * cards (ToolCard), the sidebar nav, and each tool page's own header
 * (ToolShell) can never drift out of sync with each other.
 */
export const TOOL_ICONS: Record<string, LucideIcon> = {
  ImageIcon,
  Image: ImageIcon, // alias: lib/tools.ts CATEGORIES uses "Image" for the image category icon
  Crop,
  PackageOpen,
  Ruler,
  Smartphone,
  Pipette,
  PaintbrushVertical,
  Zap,
  Scaling,
  Brush,
  ScanSearch,
  BookmarkCheck,
  Frame,
  PenTool,
  Grid3X3,
  QrCode,
  ScanQrCode,
  Cpu,
  Eraser,
  Camera,
  Type,
  Calculator,
  Code2,
  Palette,
  Binary,
  KeyRound,
  Hash,
  ArrowRightLeft,
  AlignLeft,
  SwatchBook,
  Cake,
  Clock,
  Link2,
  Percent,
  Pilcrow,
  FileCode,
  GitCompare,
  HeartPulse,
  Receipt,
  Blend,
  Contrast,
  Fingerprint,
  Regex,
  Unlock,
  AppWindow,
};

/** Solid, saturated icon-tile background, meant to read as color at rest, not just on hover. */
export const CATEGORY_COLORS: Record<string, string> = {
  image: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/30",
  unit: "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-sm shadow-violet-500/30",
  color: "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30",
  text: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30",
  math: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30",
  dev: "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-sm shadow-slate-500/30",
};

/** Top accent border + hover glow for ToolCard, tinted per category. */
export const CATEGORY_GLOW: Record<string, string> = {
  image:
    "border-t-blue-400 hover:border-blue-300/70 hover:shadow-lg hover:shadow-blue-500/10 dark:border-t-blue-500 dark:hover:border-blue-800 dark:hover:shadow-blue-400/10",
  unit: "border-t-violet-400 hover:border-violet-300/70 hover:shadow-lg hover:shadow-violet-500/10 dark:border-t-violet-500 dark:hover:border-violet-800 dark:hover:shadow-violet-400/10",
  color:
    "border-t-pink-400 hover:border-pink-300/70 hover:shadow-lg hover:shadow-pink-500/10 dark:border-t-pink-500 dark:hover:border-pink-800 dark:hover:shadow-pink-400/10",
  text: "border-t-amber-400 hover:border-amber-300/70 hover:shadow-lg hover:shadow-amber-500/10 dark:border-t-amber-500 dark:hover:border-amber-800 dark:hover:shadow-amber-400/10",
  math: "border-t-emerald-400 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-t-emerald-500 dark:hover:border-emerald-800 dark:hover:shadow-emerald-400/10",
  dev: "border-t-slate-400 hover:border-slate-300/70 hover:shadow-lg hover:shadow-slate-500/10 dark:border-t-slate-500 dark:hover:border-slate-700 dark:hover:shadow-slate-400/10",
};

/** Soft blurred wash behind a tool page's own header, tinted per category. */
export const CATEGORY_WASH: Record<string, string> = {
  image: "bg-blue-500",
  unit: "bg-violet-500",
  color: "bg-pink-500",
  text: "bg-amber-500",
  math: "bg-emerald-500",
  dev: "bg-slate-500",
};

export function getToolIconComponent(iconName: string): LucideIcon {
  return TOOL_ICONS[iconName] ?? Zap;
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.dev;
}

export function getCategoryGlow(category: string): string {
  return CATEGORY_GLOW[category] ?? CATEGORY_GLOW.dev;
}

export function getCategoryWash(category: string): string {
  return CATEGORY_WASH[category] ?? CATEGORY_WASH.dev;
}
