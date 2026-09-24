"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "of" | "isWhatPercent" | "change";

function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "-";
  return n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

export default function PercentageCalculatorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("of");
  const [x, setX] = useState("10");
  const [y, setY] = useState("200");

  const numX = parseFloat(x);
  const numY = parseFloat(y);

  const result = useMemo(() => {
    if (isNaN(numX) || isNaN(numY)) return null;
    if (mode === "of") return (numX / 100) * numY;
    if (mode === "isWhatPercent") return numY === 0 ? null : (numX / numY) * 100;
    if (mode === "change") return numX === 0 ? null : ((numY - numX) / numX) * 100;
    return null;
  }, [mode, numX, numY]);

  const isIncrease = mode === "change" && result !== null && result >= 0;

  const copyResult = () => {
    if (result === null) return;
    navigator.clipboard.writeText(formatNumber(result));
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.percentage-calculator.name")}
      description={t("tool.percentage-calculator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
            <TabsTrigger value="of" className="text-xs py-2">
              {t("tool.percentage-calculator.mode.of")}
            </TabsTrigger>
            <TabsTrigger value="isWhatPercent" className="text-xs py-2">
              {t("tool.percentage-calculator.mode.isWhatPercent")}
            </TabsTrigger>
            <TabsTrigger value="change" className="text-xs py-2">
              {t("tool.percentage-calculator.mode.change")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">X</Label>
            <Input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value)}
              className="text-lg font-semibold h-12"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Y</Label>
            <Input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value)}
              className="text-lg font-semibold h-12"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/10 p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
                mode === "change"
                  ? isIncrease
                    ? "bg-emerald-500"
                    : "bg-destructive"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600",
              )}
            >
              {mode === "change" ? (
                isIncrease ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )
              ) : (
                <Percent className="h-5 w-5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {t("tool.percentage-calculator.result")}
                {mode === "change" && result !== null && (
                  <>
                    {" · "}
                    {isIncrease
                      ? t("tool.percentage-calculator.increase")
                      : t("tool.percentage-calculator.decrease")}
                  </>
                )}
              </span>
              <span className="text-2xl font-bold tracking-tight">
                {result === null ? "-" : `${formatNumber(result)}${mode !== "of" ? "%" : ""}`}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyResult}
            disabled={result === null}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
