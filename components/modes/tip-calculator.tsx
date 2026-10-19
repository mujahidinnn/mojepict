"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { cn } from "@/lib/utils";

const TIP_PRESETS = [10, 15, 20, 25];
const MAX_TIP_PERCENT = 100;

function formatMoney(n: number) {
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

export default function TipCalculatorPage() {
  const { t } = useI18n();
  const [bill, setBill] = useState("100");
  const [tipPercent, setTipPercent] = useState(15);
  const [customTip, setCustomTip] = useState("");
  const [people, setPeople] = useState(1);

  const effectiveTip = Math.min(
    MAX_TIP_PERCENT,
    Math.max(0, customTip.trim() ? parseFloat(customTip) || 0 : tipPercent),
  );
  const tipTooHigh = (parseFloat(customTip) || 0) > MAX_TIP_PERCENT;

  const { tipAmount, total, perPerson } = useMemo(() => {
    const billValue = Math.max(0, parseFloat(bill) || 0);
    const tipAmt = billValue * (effectiveTip / 100);
    const totalValue = billValue + tipAmt;
    const count = Math.max(1, people);
    return { tipAmount: tipAmt, total: totalValue, perPerson: totalValue / count };
  }, [bill, effectiveTip, people]);

  return (
    <ToolShell title={t("tool.tip-calculator.name")} description={t("tool.tip-calculator.description")}>
      <div className="max-w-screen-lg flex flex-col gap-8">
        <FormGroup label={t("tool.tip-calculator.bill")}>
          <Input
            type="number"
            min="0"
            value={bill}
            onChange={(e) => {
              if (!e.target.value.includes("-")) setBill(e.target.value);
            }}
            className="h-12 text-lg font-semibold"
          />
        </FormGroup>

        <FormGroup label={t("tool.tip-calculator.tip")}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-4 gap-2">
              {TIP_PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={!customTip.trim() && tipPercent === p ? "default" : "outline"}
                  onClick={() => {
                    setTipPercent(p);
                    setCustomTip("");
                  }}
                >
                  {p}%
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min="0"
              max={MAX_TIP_PERCENT}
              placeholder={t("tool.tip-calculator.customTip")}
              value={customTip}
              onChange={(e) => {
                if (!e.target.value.includes("-")) setCustomTip(e.target.value);
              }}
            />
            {tipTooHigh && (
              <p className="text-xs text-warning">{t("tool.tip-calculator.tipTooHigh")}</p>
            )}
          </div>
        </FormGroup>

        <FormGroup label={t("tool.tip-calculator.people")}>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setPeople((p) => Math.max(1, p - 1))}
              aria-label={t("tool.tip-calculator.decreasePeople")}
            >
              -
            </Button>
            <span className="w-10 text-center text-lg font-semibold tabular-nums">{people}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setPeople((p) => Math.min(50, p + 1))}
              aria-label={t("tool.tip-calculator.increasePeople")}
            >
              +
            </Button>
          </div>
        </FormGroup>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/10 p-6">
            <span className="text-xs text-muted-foreground">{t("tool.tip-calculator.tipAmount")}</span>
            <p className="text-xl font-bold tracking-tight">{formatMoney(tipAmount)}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-6">
            <span className="text-xs text-muted-foreground">{t("tool.tip-calculator.total")}</span>
            <p className="text-xl font-bold tracking-tight">{formatMoney(total)}</p>
          </div>
          <div
            className={cn(
              "col-span-2 rounded-xl border bg-primary/5 border-primary/10 p-6 text-center",
            )}
          >
            <span className="text-xs text-muted-foreground">
              {t("tool.tip-calculator.perPerson")}
            </span>
            <p className="text-3xl font-bold tracking-tight text-primary">
              {formatMoney(perPerson)}
            </p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
