"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import {
  ArrowLeftRight,
  Copy,
  Flame,
  Gauge,
  GaugeCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import { useState } from "react";

type Category = "speed" | "force" | "energy" | "power" | "pressure";

interface PhysicsUnit {
  key: string;
  label: string;
  /** How many base units one of this unit equals. */
  toBase: number;
}

/** Base units: m/s, N, J, W, Pa. */
const UNITS: Record<Category, PhysicsUnit[]> = {
  speed: [
    { key: "ms", label: "Meter per second (m/s)", toBase: 1 },
    { key: "kmh", label: "Kilometer per hour (km/h)", toBase: 1000 / 3600 },
    { key: "mph", label: "Mile per hour (mph)", toBase: 0.44704 },
    { key: "knot", label: "Knot (kn)", toBase: 0.514444 },
    { key: "cms", label: "Centimeter per second (cm/s)", toBase: 0.01 },
  ],
  force: [
    { key: "n", label: "Newton (N)", toBase: 1 },
    { key: "kn", label: "Kilonewton (kN)", toBase: 1000 },
    { key: "dyne", label: "Dyne (dyn)", toBase: 0.00001 },
    { key: "kgf", label: "Kilogram-force (kgf)", toBase: 9.80665 },
    { key: "lbf", label: "Pound-force (lbf)", toBase: 4.44822 },
  ],
  energy: [
    { key: "j", label: "Joule (J)", toBase: 1 },
    { key: "kj", label: "Kilojoule (kJ)", toBase: 1000 },
    { key: "cal", label: "Calorie (cal)", toBase: 4.184 },
    { key: "kcal", label: "Kilocalorie (kcal)", toBase: 4184 },
    { key: "kwh", label: "Kilowatt-hour (kWh)", toBase: 3_600_000 },
    { key: "ev", label: "Electronvolt (eV)", toBase: 1.602176634e-19 },
  ],
  power: [
    { key: "w", label: "Watt (W)", toBase: 1 },
    { key: "kw", label: "Kilowatt (kW)", toBase: 1000 },
    { key: "mw", label: "Megawatt (MW)", toBase: 1_000_000 },
    { key: "hp", label: "Horsepower (hp)", toBase: 745.7 },
    { key: "pk", label: "Metric Horsepower (PK)", toBase: 735.499 },
  ],
  pressure: [
    { key: "pa", label: "Pascal (Pa)", toBase: 1 },
    { key: "kpa", label: "Kilopascal (kPa)", toBase: 1000 },
    { key: "bar", label: "Bar", toBase: 100_000 },
    { key: "atm", label: "Atmosphere (atm)", toBase: 101_325 },
    { key: "mmhg", label: "mmHg (Torr)", toBase: 133.322 },
    { key: "psi", label: "PSI (lb/in²)", toBase: 6894.76 },
  ],
};

const CATEGORY_ICON: Record<Category, typeof Gauge> = {
  speed: Gauge,
  force: Zap,
  energy: Flame,
  power: Lightbulb,
  pressure: GaugeCircle,
};

const CATEGORIES: Category[] = ["speed", "force", "energy", "power", "pressure"];

function convert(value: number, category: Category, from: string, to: string): number {
  if (from === to) return value;
  const units = UNITS[category];
  const fromUnit = units.find((u) => u.key === from);
  const toUnit = units.find((u) => u.key === to);
  if (!fromUnit || !toUnit) return value;
  return (value * fromUnit.toBase) / toUnit.toBase;
}

function formatResult(value: number): string {
  if (!isFinite(value)) return "";
  return value
    .toPrecision(8)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

export default function PhysicsConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>("speed");
  const [fromUnit, setFromUnit] = useState(UNITS.speed[1].key);
  const [toUnit, setToUnit] = useState(UNITS.speed[0].key);
  const [inputVal, setInputVal] = useState("1");

  const numericInput = parseFloat(inputVal);
  const result = isNaN(numericInput)
    ? ""
    : formatResult(convert(numericInput, category, fromUnit, toUnit));

  const onCategoryChange = (c: Category) => {
    setCategory(c);
    setFromUnit(UNITS[c][1]?.key ?? UNITS[c][0].key);
    setToUnit(UNITS[c][0].key);
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: t("action.copied"), description: result });
  };

  const toUnitLabel =
    UNITS[category].find((u) => u.key === toUnit)?.label.match(/\(([^)]+)\)/)?.[1] ??
    toUnit;

  return (
    <ToolShell
      title={t("tool.physics-converter.name")}
      description={t("tool.physics-converter.description")}
    >
      <div className="flex max-w-xl flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            return (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={category === c ? "default" : "outline"}
                className="gap-1.5"
                onClick={() => onCategoryChange(c)}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(`tool.physics-converter.category.${c}` as any)}
              </Button>
            );
          })}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("common.from")}</Label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS[category].map((u) => (
                  <SelectItem key={u.key} value={u.key}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={swap} className="mb-0.5">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-2">
            <Label>{t("common.to")}</Label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS[category].map((u) => (
                  <SelectItem key={u.key} value={u.key}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("common.value")}</Label>
          <Input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="0"
          />
        </div>

        {result && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <p className="mb-0.5 text-xs text-muted-foreground">
                {t("common.result")}
              </p>
              <p className="font-mono text-2xl font-semibold">
                {result}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {toUnitLabel}
                </span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyResult}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
