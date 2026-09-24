"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { Landmark } from "lucide-react";

type Mode = "exclusive" | "inclusive";

export default function TaxCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };
  const [mode, setMode] = useState<Mode>("exclusive");
  const [amount, setAmount] = useState("1000000");
  const [rate, setRate] = useState("11");

  const { base, taxAmount, total } = useMemo(() => {
    const amountValue = parseFloat(amount) || 0;
    const ratePct = Math.max(0, parseFloat(rate) || 0);

    if (mode === "exclusive") {
      const tax = amountValue * (ratePct / 100);
      return { base: amountValue, taxAmount: tax, total: amountValue + tax };
    }

    const baseValue = amountValue / (1 + ratePct / 100);
    return { base: baseValue, taxAmount: amountValue - baseValue, total: amountValue };
  }, [mode, amount, rate]);

  return (
    <ToolShell title={t("tool.tax-calculator.name")} description={t("tool.tax-calculator.description")}>
      <div className="flex flex-col gap-6 max-w-xl">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
            <TabsTrigger value="exclusive" className="text-xs py-2">
              {t("tool.tax-calculator.mode.exclusive")}
            </TabsTrigger>
            <TabsTrigger value="inclusive" className="text-xs py-2">
              {t("tool.tax-calculator.mode.inclusive")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.tax-calculator.amount")}
            </Label>
            <ThousandsInput value={amount} onChange={setAmount} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.tax-calculator.rate")}
            </Label>
            <Input
              type="number"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.tax-calculator.base")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(base)}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.tax-calculator.taxAmount")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(taxAmount)}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Landmark className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t("tool.tax-calculator.total")}</span>
            <span className="text-3xl font-bold tracking-tight text-primary">{formatNumber(total)}</span>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
