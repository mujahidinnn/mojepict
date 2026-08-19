"use client";

import { useEffect, useState } from "react";
import { ToolCard } from "@/components/tools/ToolCard";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { TOOLS, getPopularTools } from "@/lib/tools";
import { getRecentTools } from "@/hooks/use-recent-tools";
import { Layers, Search, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage() {
  const { t } = useI18n();
  const featured = TOOLS.filter((tool) => tool.featured);
  const popular = getPopularTools();

  const [recent, setRecent] = useState<typeof TOOLS>([]);
  useEffect(() => {
    const slugs = getRecentTools();
    setRecent(
      slugs
        .map((slug) => TOOLS.find((tool) => tool.slug === slug))
        .filter((tool): tool is (typeof TOOLS)[number] => Boolean(tool)),
    );
  }, []);

  const openPalette = () =>
    window.dispatchEvent(new CustomEvent("mojepict:open-palette"));

  return (
    <div className="flex flex-col gap-12 pb-16">
      <div>
        {/*
          `fixed`, not `absolute`: this backdrop should stay put behind the
          content as the page scrolls, instead of scrolling away with it and
          leaving plain `bg-background` below the fold. `top-12` clears the
          navbar (h-12) and `lg:left-[var(--sidebar-width)]` clears the
          sidebar — both are plain (non-positioned) elements, so without that
          offset this `fixed` layer would paint over them: positioned
          elements always paint above static ones, regardless of z-index or
          DOM order.
        */}
        <div className="fixed inset-x-0 top-12 bottom-0 lg:left-[var(--sidebar-width)] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-30" />
        </div>

        <section className="relative isolate overflow-x-hidden lg:overflow-visible px-4 sm:px-6 lg:px-8 pt-14 grid grid-cols-1 lg:grid-cols-[1fr_280px] items-center gap-8">
          {/*
            Mobile-only backdrop: same illustration, but faded and pushed
            behind the copy so it reads as texture, not a competing focal
            point. `isolate` above gives this section its own stacking
            context, so `-z-10` here stays scoped behind the (unpositioned,
            so normally-above-absolute) text column instead of escaping to
            the page root and landing under the fixed hero-glow layer.
            `pointer-events-none` keeps it from stealing taps.
          */}
          <div
            aria-hidden
            className="absolute right-0 -top-16 h-56 w-56 -z-10 opacity-[0.12] dark:opacity-[0.18] grayscale pointer-events-none lg:hidden"
          >
            <HeroIllustration />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-xl">
              {t("landing.hero.title")}{" "}
              <span className="text-muted-foreground font-normal">
                {t("landing.hero.titleAccent")}
              </span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-md">
              {t("landing.hero.subtitle")}
            </p>
            <Button
              onClick={openPalette}
              variant="outline"
              className="mt-6 w-full sm:w-auto justify-start sm:justify-center gap-2 h-10 px-4 text-sm text-muted-foreground hover:text-foreground rounded-lg"
            >
              <Search className="h-4 w-4" />
              {t("nav.search")}
              <span className="flex items-center gap-0.5 ml-auto sm:ml-2">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  ⌘
                </kbd>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                  K
                </kbd>
              </span>
            </Button>
          </div>
          <div className="hidden lg:block h-56">
            <HeroIllustration />
          </div>
        </section>

        <section className="relative px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              value: `${TOOLS.length}`,
              label: "Tools available",
              icon: Layers,
              tile: "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/30",
            },
            {
              value: "No Sign-up",
              label: "Just open a tool and start",
              icon: ShieldCheck,
              tile: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30",
            },
            {
              value: "Free",
              label: "Always and forever",
              icon: Sparkles,
              tile: "bg-gradient-to-br from-pink-500 to-rose-600 shadow-pink-500/30",
            },
          ].map(({ value, label, icon: StatIcon, tile }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border bg-card/80 backdrop-blur-sm p-4"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
                  tile,
                )}
              >
                <StatIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-lg font-bold tracking-tight truncate">
                  {value}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>

      {recent.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            {t("landing.recent")}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recent.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-pink-500 to-rose-600" />
            {t("landing.popular")}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popular.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            {t("landing.featured")}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} featured />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
