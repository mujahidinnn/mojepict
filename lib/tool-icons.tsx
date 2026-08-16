import {
  AlignLeft,
  ArrowRightLeft,
  Binary,
  BookmarkCheck,
  Brush,
  Calculator,
  Camera,
  Code2,
  Crop,
  Cpu,
  Eraser,
  Frame,
  Grid3X3,
  Hash,
  ImageIcon,
  KeyRound,
  LucideIcon,
  PackageOpen,
  PaintbrushVertical,
  Palette,
  PenTool,
  Pipette,
  QrCode,
  Ruler,
  ScanQrCode,
  ScanSearch,
  Scaling,
  Smartphone,
  SwatchBook,
  Type,
  Zap,
} from "lucide-react";

/**
 * Single source of truth for tool icon + category color, so the homepage
 * cards (ToolCard), the sidebar nav, and each tool page's own header
 * (ToolShell) can never drift out of sync with each other.
 */
export const TOOL_ICONS: Record<string, LucideIcon> = {
  ImageIcon,
  Image: ImageIcon, // alias — lib/tools.ts CATEGORIES uses "Image" for the image category icon
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
};

export const CATEGORY_COLORS: Record<string, string> = {
  image: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  unit: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  color: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  text: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  math: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  dev: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

export function getToolIconComponent(iconName: string): LucideIcon {
  return TOOL_ICONS[iconName] ?? Zap;
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.dev;
}
