"use client";

import Link from "next/link";
import { Tool } from "@/lib/tools";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ImageIcon,
  Crop,
  PackageOpen,
  Ruler,
  Pipette,
  PaintbrushVertical,
  Zap,
  Scaling,
  Brush,
  ScanSearch,
  BookmarkCheck,
  Frame,
  QrCode,
  Camera,
  Cpu,
  ScanQrCode,
  PenTool,
  Eraser,
  Grid3X3,
  Smartphone,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ImageIcon,
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
};

const CATEGORY_COLORS: Record<string, string> = {
  image: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  unit: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  color: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  text: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  math: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  dev: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

interface ToolCardProps {
  tool: Tool;
  featured?: boolean;
}

export function ToolCard({ tool, featured }: ToolCardProps) {
  const { t } = useI18n();
  const LIcon = ICONS[tool.icon] ?? Zap;
  const iconColor = CATEGORY_COLORS[tool.category] ?? CATEGORY_COLORS.dev;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border bg-card p-5",
        "hover:border-foreground/20 hover:shadow-sm transition-all duration-150",
        featured && "ring-1 ring-foreground/5",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          iconColor,
        )}
      >
        <LIcon className="h-4.5 w-4.5" />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold leading-none">
            {t(`tool.${tool.id}.name` as any)}
          </h3>
          {tool.badge && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {t(`landing.badge.${tool.badge}` as any)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(`tool.${tool.id}.description` as any)}
        </p>
      </div>

      <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
