"use client";

import { ToolCard } from "@/components/tools/ToolCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { CATEGORIES, CATEGORY_ORDER, TOOLS } from "@/lib/tools";
import { Search, Zap } from "lucide-react";

export default function HomePage() {
  const { t } = useI18n();
  const featured = TOOLS.filter((tool) => tool.featured);

  const openPalette = () =>
    window.dispatchEvent(new CustomEvent("mojepict:open-palette"));

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-30" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 backdrop-blur-sm px-3 py-1 mb-5">
            <Zap className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">
              100% browser-based · No uploads
            </span>
          </div>
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
            className="mt-6 gap-2 h-10 px-4 text-sm text-muted-foreground hover:text-foreground rounded-lg"
          >
            <Search className="h-4 w-4" />
            {t("nav.search")}
            <span className="flex items-center gap-0.5 ml-2">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                ⌘
              </kbd>
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                K
              </kbd>
            </span>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 sm:gap-6">
        {[
          { value: `${TOOLS.length}`, label: "Tools available" },
          { value: "0", label: "Data sent to servers" },
          { value: "Free", label: "Always and forever" },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </section>

      <Separator />

      {featured.length > 0 && (
        <section>
          <h2 className="text-base font-semibold tracking-tight">
            {t("landing.featured")}
          </h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-semibold tracking-tight">
          {t("landing.allTools")}
        </h2>
        <div className="mt-4 flex flex-col gap-8">
          {CATEGORY_ORDER.map((cat) => {
            const tools = TOOLS.filter((tool) => tool.category === cat);
            if (!tools.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t(CATEGORIES[cat].labelKey as any)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
