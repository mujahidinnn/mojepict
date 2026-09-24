"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { BadgePercent } from "lucide-react";

export default function DiscountCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };
  const [originalPrice, setOriginalPrice] = useState("100000");
  const [discount1, setDiscount1] = useState("20");
  const [discount2, setDiscount2] = useState("");

  const { finalPrice, youSave, effectiveDiscount } = useMemo(() => {
    const price = parseFloat(originalPrice) || 0;
    const d1 = Math.min(100, Math.max(0, parseFloat(discount1) || 0));
    const d2 = Math.min(100, Math.max(0, parseFloat(discount2) || 0));

    const afterFirst = price * (1 - d1 / 100);
    const afterSecond = afterFirst * (1 - d2 / 100);
    const saved = price - afterSecond;
    const effective = price > 0 ? (saved / price) * 100 : 0;

    return { finalPrice: afterSecond, youSave: saved, effectiveDiscount: effective };
  }, [originalPrice, discount1, discount2]);

  return (
    <ToolShell
      title={t("tool.discount-calculator.name")}
      description={t("tool.discount-calculator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("tool.discount-calculator.originalPrice")}
          </Label>
          <ThousandsInput
            value={originalPrice}
            onChange={setOriginalPrice}
            className="h-12 text-lg font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.discount-calculator.discount1")}
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discount1}
              onChange={(e) => setDiscount1(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.discount-calculator.discount2")}
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discount2}
              onChange={(e) => setDiscount2(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">{t("tool.discount-calculator.youSave")}</span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(youSave)}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <span className="text-xs text-muted-foreground">
              {t("tool.discount-calculator.effectiveDiscount")}
            </span>
            <p className="text-lg font-bold tracking-tight">{formatNumber(effectiveDiscount)}%</p>
          </div>
        </div>

        <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <BadgePercent className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">{t("tool.discount-calculator.finalPrice")}</span>
            <span className="text-3xl font-bold tracking-tight text-primary">
              {formatNumber(finalPrice)}
            </span>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
