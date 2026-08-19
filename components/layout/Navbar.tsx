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
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import Image from "next/image";

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

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-1 sm:gap-3 border-b bg-background/80 backdrop-blur-sm px-2 sm:px-4">
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Browse and search all available tools
            </SheetDescription>
          </VisuallyHidden>
          <Sidebar />
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex min-w-0 items-center gap-1.5 lg:hidden">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-foreground">
          <Image
            src="/mj.png"
            alt="M"
            width={30}
            height={30}
            className="object-contain"
          />
        </div>
        <span className="truncate text-sm font-semibold capitalize">
          {pathname !== "/"
            ? pathname.split("/").pop()?.replace(/-/g, " ")
            : t("site.name")}
        </span>
      </Link>

      {pathname !== "/" && (
        <nav className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("site.name")}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium capitalize">
            {pathname.split("/").pop()?.replace(/-/g, " ")}
          </span>
        </nav>
      )}

      <div className="flex-1" />
      <Button
        asChild
        variant="outline"
        className="h-7 w-7 p-0 sm:w-auto sm:gap-1.5 sm:px-2.5 text-xs text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900 hover:bg-pink-50 dark:hover:bg-pink-950 hover:text-pink-700 dark:hover:text-pink-300"
      >
        <a
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
        className="h-7 w-7 p-0 sm:w-auto sm:gap-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={openPalette}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("nav.search")}</span>
        <SearchHint />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
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
          className="h-7 w-7"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
