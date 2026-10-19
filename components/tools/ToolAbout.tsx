"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { TOOLS } from "@/lib/tools";
import { HUB_MODES } from "@/lib/hubs";

/**
 * Static copy below every tool page, rendered in the root layout (outside the
 * pages' useSearchParams Suspense boundaries) so it is part of the SSR HTML.
 */
export function ToolAbout() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tool = TOOLS.find((x) => `/${x.slug}` === pathname);
  if (!tool) return null;

  const name = t(`tool.${tool.id}.name` as any);
  const modes = (HUB_MODES[tool.id] ?? []).filter((m) => m !== tool.id);

  return (
    <section className="mt-12 flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground">
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {t("toolInfo.howTo")} {name}
      </h2>
      <p className="max-w-prose">{t(`tool.${tool.id}.description` as any)}</p>
      {modes.length > 0 && (
        <>
          <h3 className="font-medium text-foreground">{t("toolInfo.modes")}</h3>
          <ul className="flex flex-col gap-2">
            {modes.map((m) => (
              <li key={m}>
                <Link prefetch={false} href={`/${tool.slug}?mode=${m}`} className="font-medium text-foreground hover:underline">
                  {t(`tool.${m}.name` as any)}
                </Link>
                {" — "}
                {t(`tool.${m}.description` as any)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
