"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS, CATEGORIES, ToolCategory, getToolBadge } from "@/lib/tools";
import { getToolIconComponent } from "@/lib/tool-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

function Icon({ name, className }: { name: string; className?: string }) {
  const LIcon = getToolIconComponent(name);
  return <LIcon className={cn("h-4 w-4", className)} />;
}

const CATEGORY_ORDER: ToolCategory[] = [
  "image",
  "unit",
  "color",
  "text",
  "math",
  "dev",
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r",
        "bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]",
        "w-[var(--sidebar-width)] shrink-0",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground shrink-0">
          <Image
            src="/mojepict-logo.png"
            alt="M"
            width={40}
            height={40}
            className="object-contain rounded-md"
          />
        </div>
        <span className="font-semibold text-sm tracking-tight">
          {t("site.name")}
        </span>

        <small className="ml-auto text-muted-foreground shrink-0">v2.0</small>
      </div>

      <ScrollArea className="flex-1 px-3 py-3 scrollbar-none">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm mb-4",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            pathname === "/" && "text-foreground bg-accent font-medium",
          )}
        >
          <ImageIcon className="h-4 w-4" aria-label="All Tools" role="img" />
          {t("nav.allTools")}
        </Link>

        {CATEGORY_ORDER.map((cat) => {
          const tools = TOOLS.filter((t) => t.category === cat);
          if (!tools.length) return null;
          const catMeta = CATEGORIES[cat];

          return (
            <div key={cat} className="mb-4">
              <div className="flex items-center gap-1.5 px-2 mb-1">
                <Icon
                  name={catMeta.icon}
                  className="h-3 w-3 text-muted-foreground"
                />
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {t(catMeta.labelKey as any)}
                </span>
              </div>

              {tools.map((tool) => {
                const href = tool.slug;
                const active = pathname === href;
                const badge = getToolBadge(tool);
                return (
                  <Link
                    key={tool.id}
                    href={href}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm",
                      "text-slate-800 dark:text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                      active && "text-foreground bg-accent font-medium",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon name={tool.icon} />
                      {t(`tool.${tool.id}.name` as any)}
                    </span>
                    {badge && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px] leading-none"
                      >
                        {t(`landing.badge.${badge}` as any)}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </ScrollArea>
      <div className="border-t border-[hsl(var(--sidebar-border))] px-4 py-3">
        <p className="text-[11px] text-muted-foreground">
          {t("layout.sidebar.footer")}
        </p>
      </div>
    </aside>
  );
}
