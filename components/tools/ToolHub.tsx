"use client";

import { ComponentType, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToolShell } from "@/components/tools/ToolShell";
import { EmbeddedProvider } from "@/components/tools/EmbeddedContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";

export interface HubMode {
  /** Legacy tool id; `tool.<id>.name/description` supply the label and hint. */
  id: string;
  /** Overrides the label when `tool.<id>.name` collides with the hub's own name. */
  labelKey?: string;
  Component: ComponentType;
}

function Hub({ hubId, modes }: { hubId: string; modes: HubMode[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = modes.find((m) => m.id === params.get("mode")) ?? modes[0];
  const label = (m: HubMode) => t((m.labelKey ?? `tool.${m.id}.name`) as any);

  return (
    <ToolShell
      title={t(`tool.${hubId}.name` as any)}
      description={t(`tool.${hubId}.description` as any)}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Select
            value={active.id}
            onValueChange={(id) => router.replace(`${pathname}?mode=${id}`, { scroll: false })}
          >
            <SelectTrigger className="w-full sm:w-72" aria-label={t("hub.mode")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modes.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {label(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {active.id !== hubId && (
            <p className="text-sm text-muted-foreground">
              {t(`tool.${active.id}.description` as any)}
            </p>
          )}
        </div>
        <EmbeddedProvider value>
          <active.Component key={active.id} />
        </EmbeddedProvider>
      </div>
    </ToolShell>
  );
}

/** One tool page that hosts several legacy tools behind a mode select (?mode=<id>). */
export function ToolHub(props: { hubId: string; modes: HubMode[] }) {
  return (
    <Suspense fallback={null}>
      <Hub {...props} />
    </Suspense>
  );
}
