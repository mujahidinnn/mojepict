"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { hexToRgb, isValidHex } from "@/lib/color";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hex1: string, hex2: string) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ResultRow({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-2.5">
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold",
          pass ? "text-emerald-500" : "text-destructive",
        )}
      >
        {pass ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        {pass ? "Pass" : "Fail"}
      </span>
    </div>
  );
}

export default function ContrastCheckerPage() {
  const { t } = useI18n();
  const [foreground, setForeground] = useState("#1e1b4b");
  const [background, setBackground] = useState("#f8fafc");

  const valid = isValidHex(foreground) && isValidHex(background);
  const ratio = useMemo(
    () => (valid ? contrastRatio(foreground, background) : null),
    [foreground, background, valid],
  );

  return (
    <ToolShell
      title={t("tool.contrast-checker.name")}
      description={t("tool.contrast-checker.description")}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.contrast-checker.foreground")}
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHex(foreground) ? foreground : "#000000"}
                onChange={(e) => setForeground(e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                spellCheck={false}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.contrast-checker.background")}
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isValidHex(background) ? background : "#ffffff"}
                onChange={(e) => setBackground(e.target.value)}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                spellCheck={false}
                className="font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border p-6"
          style={{
            backgroundColor: isValidHex(background) ? background : "#ffffff",
            color: isValidHex(foreground) ? foreground : "#000000",
          }}
        >
          <p className="text-2xl font-bold">{t("tool.contrast-checker.sampleLarge")}</p>
          <p className="text-sm">{t("tool.contrast-checker.sampleNormal")}</p>
        </div>

        {ratio ? (
          <>
            <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/10 p-6">
              <span className="text-4xl font-bold tracking-tight">{ratio.toFixed(2)}:1</span>
              <span className="text-xs text-muted-foreground">
                {t("tool.contrast-checker.ratio")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ResultRow label="AA - Normal text (4.5:1)" pass={ratio >= 4.5} />
              <ResultRow label="AA - Large text (3:1)" pass={ratio >= 3} />
              <ResultRow label="AAA - Normal text (7:1)" pass={ratio >= 7} />
              <ResultRow label="AAA - Large text (4.5:1)" pass={ratio >= 4.5} />
            </div>
          </>
        ) : (
          <p className="text-sm text-destructive text-center">
            {t("tool.contrast-checker.invalid")}
          </p>
        )}
      </div>
    </ToolShell>
  );
}
