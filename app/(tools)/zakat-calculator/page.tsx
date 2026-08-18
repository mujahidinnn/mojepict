"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThousandsInput } from "@/components/tools/ThousandsInput";
import { HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "fitrah" | "maal" | "income" | "gold";
type Metal = "gold" | "silver";

const ZAKAT_RATE = 0.025;
const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;

export default function ZakatCalculatorPage() {
  const { t } = useI18n();
  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return "0";
    return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  };

  const [mode, setMode] = useState<Mode>("fitrah");

  // Zakat Fitrah
  const [peopleCount, setPeopleCount] = useState("4");
  const [ricePerPerson, setRicePerPerson] = useState("2.5");
  const [ricePricePerKg, setRicePricePerKg] = useState("15000");

  // Zakat Maal
  const [totalWealth, setTotalWealth] = useState("50000000");
  const [goldPriceMaal, setGoldPriceMaal] = useState("1200000");

  // Zakat Penghasilan
  const [monthlyIncome, setMonthlyIncome] = useState("8000000");
  const [goldPriceIncome, setGoldPriceIncome] = useState("1200000");

  // Zakat Emas & Perak
  const [metal, setMetal] = useState<Metal>("gold");
  const [metalWeight, setMetalWeight] = useState("100");
  const [metalPricePerGram, setMetalPricePerGram] = useState("1200000");

  const fitrah = useMemo(() => {
    const people = Math.max(0, parseFloat(peopleCount) || 0);
    const perPerson = Math.max(0, parseFloat(ricePerPerson) || 0);
    const pricePerKg = Math.max(0, parseFloat(ricePricePerKg) || 0);
    const totalKg = people * perPerson;
    return { totalKg, totalAmount: totalKg * pricePerKg };
  }, [peopleCount, ricePerPerson, ricePricePerKg]);

  const maal = useMemo(() => {
    const wealth = Math.max(0, parseFloat(totalWealth) || 0);
    const goldPrice = Math.max(0, parseFloat(goldPriceMaal) || 0);
    const nisab = goldPrice * NISAB_GOLD_GRAMS;
    const obligatory = nisab > 0 && wealth >= nisab;
    return { nisab, obligatory, zakatAmount: obligatory ? wealth * ZAKAT_RATE : 0 };
  }, [totalWealth, goldPriceMaal]);

  const income = useMemo(() => {
    const monthly = Math.max(0, parseFloat(monthlyIncome) || 0);
    const goldPrice = Math.max(0, parseFloat(goldPriceIncome) || 0);
    const nisab = (goldPrice * NISAB_GOLD_GRAMS) / 12;
    const obligatory = nisab > 0 && monthly >= nisab;
    return { nisab, obligatory, zakatAmount: obligatory ? monthly * ZAKAT_RATE : 0 };
  }, [monthlyIncome, goldPriceIncome]);

  const gold = useMemo(() => {
    const weight = Math.max(0, parseFloat(metalWeight) || 0);
    const price = Math.max(0, parseFloat(metalPricePerGram) || 0);
    const nisabGrams = metal === "gold" ? NISAB_GOLD_GRAMS : NISAB_SILVER_GRAMS;
    const value = weight * price;
    const obligatory = weight >= nisabGrams;
    return { nisabGrams, value, obligatory, zakatAmount: obligatory ? value * ZAKAT_RATE : 0 };
  }, [metal, metalWeight, metalPricePerGram]);

  return (
    <ToolShell title={t("tool.zakat-calculator.name")} description={t("tool.zakat-calculator.description")}>
      <div className="flex flex-col gap-6 max-w-xl">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="fitrah" className="text-xs py-2">
              {t("tool.zakat-calculator.mode.fitrah")}
            </TabsTrigger>
            <TabsTrigger value="maal" className="text-xs py-2">
              {t("tool.zakat-calculator.mode.maal")}
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs py-2">
              {t("tool.zakat-calculator.mode.income")}
            </TabsTrigger>
            <TabsTrigger value="gold" className="text-xs py-2">
              {t("tool.zakat-calculator.mode.gold")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "fitrah" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.peopleCount")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.ricePerPerson")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ricePerPerson}
                  onChange={(e) => setRicePerPerson(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.ricePricePerKg")}
                </Label>
                <ThousandsInput value={ricePricePerKg} onChange={setRicePricePerKg} className="h-11" />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/10 p-4">
              <span className="text-xs text-muted-foreground">{t("tool.zakat-calculator.totalRice")}</span>
              <p className="text-lg font-bold tracking-tight">{formatNumber(fitrah.totalKg)} kg</p>
            </div>

            <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <HandCoins className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.zakat-calculator.zakatAmount")}
                </span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                  {formatNumber(fitrah.totalAmount)}
                </span>
              </div>
            </div>
          </>
        )}

        {mode === "maal" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.totalWealth")}
                </Label>
                <ThousandsInput value={totalWealth} onChange={setTotalWealth} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.goldPrice")}
                </Label>
                <ThousandsInput value={goldPriceMaal} onChange={setGoldPriceMaal} className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/10 p-4">
                <span className="text-xs text-muted-foreground">{t("tool.zakat-calculator.nisab")}</span>
                <p className="text-lg font-bold tracking-tight">{formatNumber(maal.nisab)}</p>
              </div>
              <div className="rounded-xl border bg-muted/10 p-4">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    maal.obligatory ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {maal.obligatory
                    ? t("tool.zakat-calculator.obligatoryYes")
                    : t("tool.zakat-calculator.obligatoryNo")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <HandCoins className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.zakat-calculator.zakatAmount")}
                </span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                  {formatNumber(maal.zakatAmount)}
                </span>
              </div>
            </div>
          </>
        )}

        {mode === "income" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.monthlyIncome")}
                </Label>
                <ThousandsInput value={monthlyIncome} onChange={setMonthlyIncome} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.goldPrice")}
                </Label>
                <ThousandsInput value={goldPriceIncome} onChange={setGoldPriceIncome} className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/10 p-4">
                <span className="text-xs text-muted-foreground">{t("tool.zakat-calculator.nisab")}</span>
                <p className="text-lg font-bold tracking-tight">{formatNumber(income.nisab)}</p>
              </div>
              <div className="rounded-xl border bg-muted/10 p-4">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    income.obligatory ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {income.obligatory
                    ? t("tool.zakat-calculator.obligatoryYes")
                    : t("tool.zakat-calculator.obligatoryNo")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <HandCoins className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.zakat-calculator.zakatAmount")}
                </span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                  {formatNumber(income.zakatAmount)}
                </span>
              </div>
            </div>
          </>
        )}

        {mode === "gold" && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.zakat-calculator.metalType")}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                <Button
                  type="button"
                  variant={metal === "gold" ? "default" : "outline"}
                  onClick={() => setMetal("gold")}
                >
                  {t("tool.zakat-calculator.metalGold")}
                </Button>
                <Button
                  type="button"
                  variant={metal === "silver" ? "default" : "outline"}
                  onClick={() => setMetal("silver")}
                >
                  {t("tool.zakat-calculator.metalSilver")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.weight")}
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={metalWeight}
                  onChange={(e) => setMetalWeight(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.zakat-calculator.pricePerGram")}
                </Label>
                <ThousandsInput value={metalPricePerGram} onChange={setMetalPricePerGram} className="h-11" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/10 p-4">
                <span className="text-xs text-muted-foreground">{t("tool.zakat-calculator.nisab")}</span>
                <p className="text-lg font-bold tracking-tight">{formatNumber(gold.nisabGrams)} g</p>
              </div>
              <div className="rounded-xl border bg-muted/10 p-4">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    gold.obligatory ? "text-emerald-500" : "text-muted-foreground",
                  )}
                >
                  {gold.obligatory
                    ? t("tool.zakat-calculator.obligatoryYes")
                    : t("tool.zakat-calculator.obligatoryNo")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-primary/5 border-primary/10 p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <HandCoins className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.zakat-calculator.zakatAmount")}
                </span>
                <span className="text-3xl font-bold tracking-tight text-primary">
                  {formatNumber(gold.zakatAmount)}
                </span>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">{t("tool.zakat-calculator.disclaimer")}</p>
      </div>
    </ToolShell>
  );
}
