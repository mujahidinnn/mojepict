"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { recordRecentTool } from "@/hooks/use-recent-tools";
import { TOOLS, getToolBadge } from "@/lib/tools";
import { getCategoryColor, getCategoryWash, getToolIconComponent } from "@/lib/tool-icons";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface ToolShellProps {
  title: string;
  description: string;
  /** Overrides the auto-computed "new"/"beta" badge; most pages don't need this. */
  badge?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ToolShell({
  title,
  description,
  badge,
  children,
  actions,
}: ToolShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    const slug = pathname?.replace(/^\//, "");
    if (slug) recordRecentTool(slug);
  }, [pathname]);

  const tool = TOOLS.find((t) => t.slug === pathname?.replace(/^\//, ""));
  const LIcon = tool && getToolIconComponent(tool.icon);
  const iconColor = tool && getCategoryColor(tool.category);
  const wash = tool && getCategoryWash(tool.category);
  const autoBadge = tool && getToolBadge(tool);
  const badgeLabel = badge ?? (autoBadge ? t(`landing.badge.${autoBadge}` as any) : undefined);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative -mx-1 -mt-1 overflow-hidden rounded-2xl px-1 pt-1">
        {wash && (
          <div
            className={cn(
              "absolute -left-10 -top-16 -z-10 h-48 w-48 rounded-full opacity-[0.12] blur-3xl dark:opacity-20",
              wash,
            )}
          />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {LIcon && (
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10",
                  iconColor,
                )}
              >
                <LIcon className="h-5 w-5" />
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                {badgeLabel && (
                  <Badge variant="secondary" className="text-xs">
                    {badgeLabel}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-prose">
                {description}
              </p>
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>

      <Separator />

      <div>{children}</div>
    </div>
  );
}
