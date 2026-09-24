"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Copy, Fingerprint, Wand2 } from "lucide-react";

const MIN_COUNT = 1;
const MAX_COUNT = 100;

export default function UuidGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);

  const format = (id: string) => {
    const value = hyphens ? id : id.replace(/-/g, "");
    return uppercase ? value.toUpperCase() : value;
  };

  const handleGenerate = () => {
    const next = Array.from({ length: count }, () => crypto.randomUUID());
    setUuids(next);
  };

  const copyOne = (id: string) => {
    navigator.clipboard.writeText(format(id));
    toast({ description: t("toast.success.copied") });
  };

  const copyAll = () => {
    if (!uuids.length) return;
    navigator.clipboard.writeText(uuids.map(format).join("\n"));
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.uuid-generator.name")}
      description={t("tool.uuid-generator.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.uuid-generator.count")} ({MIN_COUNT}-{MAX_COUNT})
              </Label>
              <Input
                type="number"
                min={MIN_COUNT}
                max={MAX_COUNT}
                value={count}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw)
                    ? Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.trunc(raw)))
                    : MIN_COUNT;
                  setCount(clamped);
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="uuid-uppercase" className="text-sm font-normal">
                {t("tool.uuid-generator.uppercase")}
              </Label>
              <Switch id="uuid-uppercase" checked={uppercase} onCheckedChange={setUppercase} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="uuid-hyphens" className="text-sm font-normal">
                {t("tool.uuid-generator.hyphens")}
              </Label>
              <Switch id="uuid-hyphens" checked={hyphens} onCheckedChange={setHyphens} />
            </div>

            <ToolActionBar
              primaryLabel={t("tool.uuid-generator.generate")}
              primaryIcon={<Wand2 className="h-4 w-4" />}
              onPrimary={handleGenerate}
            >
              <button
                type="button"
                onClick={copyAll}
                disabled={!uuids.length}
                className="flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Copy className="h-4 w-4" /> {t("tool.uuid-generator.copyAll")}
              </button>
            </ToolActionBar>
          </>
        }
      >
        {uuids.length ? (
          <div className="flex flex-col divide-y rounded-xl border bg-muted/10 overflow-hidden">
            {uuids.map((id, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-mono text-sm truncate">{format(id)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copyOne(id)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[500px] items-center justify-center rounded-xl border bg-muted/10">
            <ToolEmptyState
              icon={<Fingerprint className="h-6 w-6" />}
              title={t("tool.uuid-generator.placeholder")}
            />
          </div>
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
