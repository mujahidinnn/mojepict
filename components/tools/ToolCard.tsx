"use client";

import Link from "next/link";
import { Tool, getToolBadge } from "@/lib/tools";
import { getCategoryColor, getToolIconComponent } from "@/lib/tool-icons";
import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  tool: Tool;
  featured?: boolean;
}

export function ToolCard({ tool, featured }: ToolCardProps) {
  const { t } = useI18n();
  const LIcon = getToolIconComponent(tool.icon);
  const iconColor = getCategoryColor(tool.category);
  const badge = getToolBadge(tool);

  return (
    <Link
      href={tool.slug}
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
          {badge && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {t(`landing.badge.${badge}` as any)}
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
