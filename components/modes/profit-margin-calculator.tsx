"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { TrendingUp } from "lucide-react";

type Mode = "fromPrice" | "fromMargin";

export default function ProfitMarginCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };
  const [mode, setMode] = useState<Mode>("fromPrice");
  const [cost, setCost] = useState("50000");
  const [price, setPrice] = useState("75000");
  const [targetMargin, setTargetMargin] = useState("30");

  const result = useMemo(() => {
    const costValue = parseFloat(cost) || 0;

    if (mode === "fromPrice") {
      const priceValue = parseFloat(price) || 0;
      const profit = priceValue - costValue;
      const margin = priceValue > 0 ? (profit / priceValue) * 100 : 0;
      const markup = costValue > 0 ? (profit / costValue) * 100 : 0;
      return { profit, margin, markup, suggestedPrice: priceValue };
    }

    const marginPct = Math.min(95, Math.max(0, parseFloat(targetMargin) || 0));
    const suggestedPrice = marginPct < 100 ? costValue / (1 - marginPct / 100) : costValue;
    const profit = suggestedPrice - costValue;
    const markup = costValue > 0 ? (profit / costValue) * 100 : 0;
    return { profit, margin: marginPct, markup, suggestedPrice };
  }, [mode, cost, price, targetMargin]);

  return (
    <ToolShell
      title={t("tool.profit-margin-calculator.name")}
      description={t("tool.profit-margin-calculator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
            <TabsTrigger value="fromPrice" className="text-xs py-2">
              {t("tool.profit-margin-calculator.mode.fromPrice")}
            </TabsTrigger>
            <TabsTrigger value="fromMargin" className="text-xs py-2">
              {t("tool.profit-margin-calculator.mode.fromMargin")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.profit-margin-calculator.cost")}
            </Label>
            <ThousandsInput value={cost} onChange={setCost} className="h-11" />
          </div>
          {mode === "fromPrice" ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.profit-margin-calculator.price")}
              </Label>
              <ThousandsInput value={price} onChange={setPrice} className="h-11" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.profit-margin-calculator.targetMargin")}
              </Label>
              <Input
                type="number"
                min="0"
                max="95"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
                className="h-11"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.profit-margin-calculator.profit")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(result.profit)}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.profit-margin-calculator.markup")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(result.markup)}%</p>
          </div>
        </div>

        <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <div>
              <span className="text-xs text-muted-foreground">{t("tool.profit-margin-calculator.margin")}</span>
              <p className="text-2xl font-bold tracking-tight text-primary">{formatNumber(result.margin)}%</p>
            </div>
            {mode === "fromMargin" && (
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("tool.profit-margin-calculator.suggestedPrice")}
                </span>
                <p className="text-2xl font-bold tracking-tight">{formatNumber(result.suggestedPrice)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
