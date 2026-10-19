"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tools/ToolCard";
import { useI18n } from "@/lib/i18n/context";
import { getPopularTools } from "@/lib/tools";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-8 py-12">
      <div className="flex flex-col items-start gap-3">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t("notFound.title")}</h1>
        <p className="text-sm text-muted-foreground max-w-prose">{t("notFound.description")}</p>
        <Button asChild className="mt-2">
          <Link prefetch={false} href="/">{t("notFound.home")}</Link>
        </Button>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold tracking-tight">{t("landing.popular")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {getPopularTools().map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
