"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useI18n } from "@/lib/i18n/context";
import { Globe, Heart, Menu, Moon, Search, Sun, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { MojepictLogo } from "@/components/icons/MojepictLogo";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { HUB_MODES } from "@/lib/hubs";

const SearchHint = () => (
  <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
      ⌘
    </kbd>
    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
      K
    </kbd>
  </span>
);

/** " · <mode>" suffix for hub pages; reads ?mode, so it renders client-side only (inside Suspense). */
function ModeLabel({ hubId }: { hubId: string }) {
  const { t } = useI18n();
  const modes = HUB_MODES[hubId];
  const requested = useSearchParams().get("mode");
  if (!modes) return null;
  const mode = modes.find((m) => m === requested) ?? modes[0];
  return (
    <span className="text-muted-foreground font-normal">
      {" · "}
      {t((mode === hubId ? `hub.mode.${mode}` : `tool.${mode}.name`) as any)}
    </span>
  );
}

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setSheetOpen(false), [pathname]);

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent("mojepict:open-palette"));
  };

  const slug = pathname.slice(1);
  const currentTool = TOOLS.find((tool) => tool.slug === slug);
  // Never derive text from the raw URL: the prerendered 404 is served for any
  // path, so a slug-based label would mismatch on hydration (React #418).
  const pageLabel = currentTool
    ? t(`tool.${currentTool.id}.name` as any)
    : slug === "about"
      ? t("nav.about")
      : slug === "privacy"
        ? t("nav.privacy")
        : null;
  const modeLabel = currentTool && HUB_MODES[currentTool.id] && (
    <Suspense fallback={null}>
      <ModeLabel hubId={currentTool.id} />
    </Suspense>
  );

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-1 sm:gap-3 border-b bg-background/80 backdrop-blur-sm px-2 sm:px-4">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10"
            aria-label={t("nav.menu")}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[var(--sidebar-width)] p-0"
          // Hub sub-mode links keep the pathname, so close on any link tap.
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setSheetOpen(false);
          }}
        >
          <VisuallyHidden>
            <SheetTitle>{t("nav.navigation")}</SheetTitle>
            <SheetDescription>{t("nav.navigationHint")}</SheetDescription>
          </VisuallyHidden>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <Link prefetch={false} href="/" className="flex min-w-0 items-center gap-1.5 lg:hidden">
        <MojepictLogo size={20} className="shrink-0" />
        <span className="truncate text-sm font-semibold">
          {pageLabel ?? t("site.name")}
          {modeLabel}
        </span>
      </Link>

      {pageLabel && (
        <nav
          aria-label={t("nav.breadcrumb")}
          className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground min-w-0"
        >
          <Link prefetch={false} href="/" className="hover:text-foreground transition-colors">
            {t("site.name")}
          </Link>
          {currentTool && (
            <>
              <span>/</span>
              <span className="capitalize">
                {t(CATEGORIES[currentTool.category].labelKey as any)}
              </span>
            </>
          )}
          <span>/</span>
          <span className="truncate text-foreground font-medium">
            {pageLabel}
            {modeLabel}
          </span>
        </nav>
      )}

      <div className="flex-1" />
      <Button
        asChild
        variant="outline"
        className="h-10 w-10 p-0 sm:h-7 sm:w-auto sm:gap-1.5 sm:px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:text-primary"
      >
        <a
          aria-label={t("nav.support")}
          href="https://trakteer.id/mujahidinnn/tip"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span className="hidden sm:inline">{t("nav.support")}</span>
        </a>
      </Button>
      <Button
        variant="outline"
        className="h-10 w-10 p-0 sm:h-7 sm:w-auto sm:gap-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={openPalette}
        aria-label={t("nav.search")}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("nav.search")}</span>
        <SearchHint />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-7 sm:w-7"
            aria-label={t("nav.language")}
          >
            <Globe className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => setLocale("en")}
            className={locale === "en" ? "font-medium" : ""}
          >
            🇺🇸 English
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLocale("id")}
            className={locale === "id" ? "font-medium" : ""}
          >
            🇮🇩 Indonesia
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-7 sm:w-7"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={t("nav.toggleTheme")}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </header>
  );
}
