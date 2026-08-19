import {
  AlignLeft,
  AppWindow,
  ArrowRightLeft,
  Atom,
  BadgePercent,
  Barcode,
  Binary,
  Blend,
  BookmarkCheck,
  Brush,
  Cake,
  Calculator,
  CalendarClock,
  CalendarDays,
  Camera,
  Clock,
  Code2,
  Contrast,
  Crop,
  Cpu,
  Dices,
  Eraser,
  Factory,
  FileCode,
  FileOutput,
  FilePenLine,
  FileText,
  Fingerprint,
  Frame,
  GitCompare,
  Grid3X3,
  HandCoins,
  Hash,
  HeartPulse,
  ImageIcon,
  KeyRound,
  Landmark,
  Link,
  Link2,
  LucideIcon,
  Megaphone,
  Merge,
  Mic,
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
  Scissors,
  Smartphone,
  Split,
  Star,
  SquareCode,
  SwatchBook,
  Table2,
  Tag,
  Target,
  TrendingUp,
  Type,
  Unlock,
  Volume2,
  Workflow,
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
  Atom,
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
  Split,
  Blend,
  Contrast,
  Fingerprint,
  Regex,
  Unlock,
  AppWindow,
  Merge,
  Scissors,
  FileOutput,
  FilePenLine,
  FileText,
  Barcode,
  Star,
  Link,
  Dices,
  CalendarDays,
  Table2,
  Tag,
  Workflow,
  SquareCode,
  Factory,
  TrendingUp,
  BadgePercent,
  Landmark,
  Target,
  HandCoins,
  CalendarClock,
  Megaphone,
  Mic,
  Volume2,
};

/** Solid, saturated icon-tile background, meant to read as color at rest, not just on hover. */
export const CATEGORY_COLORS: Record<string, string> = {
  image: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/30",
  pdf: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-sm shadow-red-500/30",
  unit: "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-sm shadow-violet-500/30",
  color: "bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm shadow-pink-500/30",
  text: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30",
  math: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/30",
  dev: "bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-sm shadow-slate-500/30",
  productivity: "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-sm shadow-cyan-500/30",
};

/** Top accent border + hover glow for ToolCard, tinted per category. */
export const CATEGORY_GLOW: Record<string, string> = {
  image:
    "border-t-blue-400 hover:border-blue-300/70 hover:shadow-lg hover:shadow-blue-500/10 dark:border-t-blue-500 dark:hover:border-blue-800 dark:hover:shadow-blue-400/10",
  pdf: "border-t-red-400 hover:border-red-300/70 hover:shadow-lg hover:shadow-red-500/10 dark:border-t-red-500 dark:hover:border-red-800 dark:hover:shadow-red-400/10",
  unit: "border-t-violet-400 hover:border-violet-300/70 hover:shadow-lg hover:shadow-violet-500/10 dark:border-t-violet-500 dark:hover:border-violet-800 dark:hover:shadow-violet-400/10",
  color:
    "border-t-pink-400 hover:border-pink-300/70 hover:shadow-lg hover:shadow-pink-500/10 dark:border-t-pink-500 dark:hover:border-pink-800 dark:hover:shadow-pink-400/10",
  text: "border-t-amber-400 hover:border-amber-300/70 hover:shadow-lg hover:shadow-amber-500/10 dark:border-t-amber-500 dark:hover:border-amber-800 dark:hover:shadow-amber-400/10",
  math: "border-t-emerald-400 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-t-emerald-500 dark:hover:border-emerald-800 dark:hover:shadow-emerald-400/10",
  dev: "border-t-slate-400 hover:border-slate-300/70 hover:shadow-lg hover:shadow-slate-500/10 dark:border-t-slate-500 dark:hover:border-slate-700 dark:hover:shadow-slate-400/10",
  productivity:
    "border-t-cyan-400 hover:border-cyan-300/70 hover:shadow-lg hover:shadow-cyan-500/10 dark:border-t-cyan-500 dark:hover:border-cyan-800 dark:hover:shadow-cyan-400/10",
};

/** Soft blurred wash behind a tool page's own header, tinted per category. */
export const CATEGORY_WASH: Record<string, string> = {
  image: "bg-blue-500",
  pdf: "bg-red-500",
  unit: "bg-violet-500",
  color: "bg-pink-500",
  text: "bg-amber-500",
  math: "bg-emerald-500",
  dev: "bg-slate-500",
  productivity: "bg-cyan-500",
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
