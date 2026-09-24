"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Label } from "@/components/ui/label";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { Target } from "lucide-react";

export default function BreakEvenCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };
  const [fixedCost, setFixedCost] = useState("5000000");
  const [variableCost, setVariableCost] = useState("15000");
  const [pricePerUnit, setPricePerUnit] = useState("25000");

  const { contributionMargin, bepUnits, bepRevenue, isValid } = useMemo(() => {
    const fixed = parseFloat(fixedCost) || 0;
    const variable = Math.max(0, parseFloat(variableCost) || 0);
    const price = Math.max(0, parseFloat(pricePerUnit) || 0);

    const margin = price - variable;
    const valid = margin > 0;
    const units = valid ? fixed / margin : 0;
    const revenue = units * price;

    return { contributionMargin: margin, bepUnits: units, bepRevenue: revenue, isValid: valid };
  }, [fixedCost, variableCost, pricePerUnit]);

  return (
    <ToolShell
      title={t("tool.break-even-calculator.name")}
      description={t("tool.break-even-calculator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.break-even-calculator.fixedCost")}
            </Label>
            <ThousandsInput value={fixedCost} onChange={setFixedCost} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.break-even-calculator.variableCost")}
            </Label>
            <ThousandsInput value={variableCost} onChange={setVariableCost} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.break-even-calculator.pricePerUnit")}
            </Label>
            <ThousandsInput value={pricePerUnit} onChange={setPricePerUnit} className="h-11" />
          </div>
        </div>

        {isValid ? (
          <>
            <div className="rounded-xl border bg-muted/10 p-4">
              <span className="text-xs text-muted-foreground">
                {t("tool.break-even-calculator.contributionMargin")}
              </span>
              <p className="text-lg font-bold tracking-tight">{formatNumber(contributionMargin)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-primary/5 border-primary/10 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("tool.break-even-calculator.bepUnits")}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {formatNumber(Math.ceil(bepUnits))}
                </p>
              </div>
              <div className="rounded-xl border bg-primary/5 border-primary/10 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {t("tool.break-even-calculator.bepRevenue")}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {formatNumber(bepRevenue)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[100px] items-center justify-center rounded-xl border bg-muted/10 p-4 text-center">
            <p className="text-sm text-muted-foreground">{t("tool.break-even-calculator.invalid")}</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
