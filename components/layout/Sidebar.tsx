"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS, CATEGORIES, ToolCategory, getToolBadge } from "@/lib/tools";
import { getToolIconComponent } from "@/lib/tool-icons";
import { Badge } from "@/components/ui/badge";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

function Icon({ name, className }: { name: string; className?: string }) {
  const LIcon = getToolIconComponent(name);
  return <LIcon className={cn("h-4 w-4", className)} />;
}

const CATEGORY_ORDER: ToolCategory[] = [
  "image",
  "pdf",
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
      </div>

      {/*
        Plain scrollable div, not Radix ScrollArea: ScrollArea's Viewport
        renders `display:table` internally (to measure content for the
        scrollbar thumb), which makes its children shrink-to-fit the widest
        row's content instead of respecting the sidebar's actual width.
        Table auto-layout ignores flex-shrink/min-w-0 entirely, so truncation
        silently never engages. Since this sidebar already hides its
        scrollbar visually (scrollbar-none) and has no custom thumb styling,
        a plain overflow-y-auto div gives the same look without the bug.
      */}
      <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-none">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm mb-4",
            "text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            pathname === "/" && "bg-accent font-medium text-primary",
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
                const href = `/${tool.slug}`;
                const active = pathname === href;
                const badge = getToolBadge(tool);
                return (
                  <Link
                    key={tool.id}
                    href={href}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      "text-slate-800 dark:text-muted-foreground hover:text-foreground hover:bg-accent",
                      active && "bg-accent font-medium text-primary",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon name={tool.icon} className="shrink-0" />
                      <span className="min-w-0 truncate">
                        {t(`tool.${tool.id}.name` as any)}
                      </span>
                    </span>
                    {badge && (
                      <Badge
                        variant="secondary"
                        className="h-4 shrink-0 px-1 text-[10px] leading-none"
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
      </div>
      <div className="border-t border-[hsl(var(--sidebar-border))] px-4 py-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-[11px]">
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("nav.about")}
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("nav.privacy")}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {t("layout.sidebar.footer")}
          </p>
          <a
            href="https://mujahidin.my.id"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("layout.sidebar.madeBy")} Mujahidin`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg
              width="26"
              height="16"
              viewBox="0 0 32 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 14C3.5 7 5 7 6.5 14C8 21 9.5 21 11 12C12.5 3 14 3 15.5 11C17 19 18.5 19 20 12C20.8 8.2 21.6 8 22.5 10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M25 16L30 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
