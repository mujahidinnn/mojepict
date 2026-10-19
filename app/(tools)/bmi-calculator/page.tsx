"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

type UnitSystem = "metric" | "imperial";

function bmiCategory(bmi: number): { key: string; color: string } {
  if (bmi < 18.5) return { key: "underweight", color: "text-warning" };
  if (bmi < 25) return { key: "normal", color: "text-success" };
  if (bmi < 30) return { key: "overweight", color: "text-warning" };
  return { key: "obese", color: "text-destructive" };
}

export default function BmiCalculatorPage() {
  const { t } = useI18n();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [heightCm, setHeightCm] = useState("170");
  const [weightKg, setWeightKg] = useState("65");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("7");
  const [weightLb, setWeightLb] = useState("143");

  // Plausible human ranges (metric): 50-272 cm, 2-650 kg. Imperial inputs are converted first.
  const { bmi, outOfRange } = useMemo(() => {
    let hCm: number;
    let wKg: number;
    if (unitSystem === "metric") {
      hCm = parseFloat(heightCm);
      wKg = parseFloat(weightKg);
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      if (ft < 0 || inch < 0 || inch >= 12) return { bmi: null, outOfRange: true };
      hCm = (ft * 12 + inch) * 2.54;
      wKg = parseFloat(weightLb) * 0.45359237;
    }
    if (!hCm || !wKg) return { bmi: null, outOfRange: false };
    if (hCm < 50 || hCm > 272 || wKg < 2 || wKg > 650) return { bmi: null, outOfRange: true };
    const h = hCm / 100;
    return { bmi: wKg / (h * h), outOfRange: false };
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const category = bmi ? bmiCategory(bmi) : null;

  return (
    <ToolShell title={t("tool.bmi-calculator.name")} description={t("tool.bmi-calculator.description")}>
      <div className="flex flex-col gap-6 max-w-xl">
        <Tabs value={unitSystem} onValueChange={(v) => setUnitSystem(v as UnitSystem)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metric">{t("tool.bmi-calculator.metric")}</TabsTrigger>
            <TabsTrigger value="imperial">{t("tool.bmi-calculator.imperial")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {unitSystem === "metric" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.bmi-calculator.height")} (cm)
              </Label>
              <Input
                type="number"
                min="0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.bmi-calculator.weight")} (kg)
              </Label>
              <Input
                type="number"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.bmi-calculator.height")} (ft)
              </Label>
              <Input
                type="number"
                min="0"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">(in)</Label>
              <Input
                type="number"
                min="0"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.bmi-calculator.weight")} (lb)
              </Label>
              <Input
                type="number"
                min="0"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        )}

        {bmi && category ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/10 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="text-4xl font-bold tracking-tight">{bmi.toFixed(1)}</span>
            <span className={cn("text-sm font-semibold", category.color)}>
              {t(`tool.bmi-calculator.category.${category.key}` as any)}
            </span>
          </div>
        ) : (
          <div className="flex min-h-[140px] items-center justify-center rounded-xl border bg-muted/10">
            <p className={cn("text-sm", outOfRange ? "text-destructive" : "text-muted-foreground")}>
              {t(outOfRange ? "tool.bmi-calculator.outOfRange" : "tool.bmi-calculator.placeholder")}
            </p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
