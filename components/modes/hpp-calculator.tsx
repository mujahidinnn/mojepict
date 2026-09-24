"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { Factory } from "lucide-react";

export default function HppCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };
  const [materialCost, setMaterialCost] = useState("2000000");
  const [laborCost, setLaborCost] = useState("1000000");
  const [overheadCost, setOverheadCost] = useState("500000");
  const [units, setUnits] = useState("100");
  const [margin, setMargin] = useState("30");

  const { totalCost, costPerUnit, suggestedPrice, profitPerUnit } = useMemo(() => {
    const material = parseFloat(materialCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const overhead = parseFloat(overheadCost) || 0;
    const unitCount = Math.max(0, parseFloat(units) || 0);
    const marginPct = Math.min(95, Math.max(0, parseFloat(margin) || 0));

    const total = material + labor + overhead;
    const perUnit = unitCount > 0 ? total / unitCount : 0;
    const price = marginPct < 100 ? perUnit / (1 - marginPct / 100) : perUnit;
    const profit = price - perUnit;

    return { totalCost: total, costPerUnit: perUnit, suggestedPrice: price, profitPerUnit: profit };
  }, [materialCost, laborCost, overheadCost, units, margin]);

  return (
    <ToolShell title={t("tool.hpp-calculator.name")} description={t("tool.hpp-calculator.description")}>
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.hpp-calculator.materialCost")}
            </Label>
            <ThousandsInput
              value={materialCost}
              onChange={setMaterialCost}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.hpp-calculator.laborCost")}
            </Label>
            <ThousandsInput
              value={laborCost}
              onChange={setLaborCost}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.hpp-calculator.overheadCost")}
            </Label>
            <ThousandsInput
              value={overheadCost}
              onChange={setOverheadCost}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.hpp-calculator.units")}
            </Label>
            <ThousandsInput
              value={units}
              onChange={setUnits}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.hpp-calculator.margin")}
          </Label>
          <Input
            type="number"
            min="0"
            max="95"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="h-11 max-w-[10rem]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.hpp-calculator.totalCost")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(totalCost)}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.hpp-calculator.profitPerUnit")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(profitPerUnit)}</p>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Factory className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            <div>
              <span className="text-xs text-muted-foreground">{t("tool.hpp-calculator.costPerUnit")}</span>
              <p className="text-2xl font-bold tracking-tight">{formatNumber(costPerUnit)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("tool.hpp-calculator.suggestedPrice")}
              </span>
              <p className="text-2xl font-bold tracking-tight text-primary">
                {formatNumber(suggestedPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
