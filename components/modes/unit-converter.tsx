"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Box,
  Copy,
  Droplets,
  Ruler,
  Square,
  Thermometer,
  Weight,
} from "lucide-react";
import { useState } from "react";

type LadderCategory = "length" | "area" | "liquidVolume" | "solidVolume" | "mass";
type Category = LadderCategory | "temperature";
type Locale = "en" | "id";
type TFunc = (key: any) => string;

/** Multiplier between two adjacent steps of the classic school "tangga satuan" ladder. */
const LADDER_STEP: Record<LadderCategory, number> = {
  length: 10,
  area: 100,
  liquidVolume: 10,
  solidVolume: 1000,
  mass: 10,
};

/** Largest → smallest, matching the order the ladder is drawn on a school whiteboard. */
const LADDER_SYMBOLS: Record<LadderCategory, string[]> = {
  length: ["km", "hm", "dam", "m", "dm", "cm", "mm"],
  area: ["km2", "hm2", "dam2", "m2", "dm2", "cm2", "mm2"],
  liquidVolume: ["kl", "hl", "dal", "l", "dl", "cl", "ml"],
  solidVolume: ["km3", "hm3", "dam3", "m3", "dm3", "cm3", "mm3"],
  mass: ["kg", "hg", "dag", "g", "dg", "cg", "mg"],
};

const EXTRA_UNITS: Record<
  LadderCategory,
  { key: string; label: string; toBase: number }[]
> = {
  length: [
    { key: "mile", label: "Mile (mi)", toBase: 1609.344 },
    { key: "yard", label: "Yard (yd)", toBase: 0.9144 },
    { key: "foot", label: "Foot (ft)", toBase: 0.3048 },
    { key: "inch", label: "Inch (in)", toBase: 0.0254 },
  ],
  area: [{ key: "acre", label: "Acre", toBase: 4046.86 }],
  liquidVolume: [
    { key: "gallon", label: "Gallon (US)", toBase: 3.78541 },
    { key: "quart", label: "Quart (US)", toBase: 0.946353 },
    { key: "pint", label: "Pint (US)", toBase: 0.473176 },
    { key: "cup", label: "Cup (US)", toBase: 0.24 },
  ],
  solidVolume: [],
  mass: [
    { key: "pound", label: "Pound (lb)", toBase: 453.592 },
    { key: "ounce", label: "Ounce (oz)", toBase: 28.3495 },
    { key: "ton", label: "Metric Ton (t)", toBase: 1_000_000 },
  ],
};

const PREFIX_NAMES: Record<Locale, string[]> = {
  en: ["Kilo", "Hecto", "Deca", "", "Deci", "Centi", "Milli"],
  id: ["Kilo", "Hekto", "Deka", "", "Desi", "Senti", "Mili"],
};

/** Indonesian school shorthand: dam² is an "are", hm² is a "hektar". */
const AREA_ALIASES: Record<number, Record<Locale, string>> = {
  1: { en: "Hectare", id: "Hektar" },
  2: { en: "Are", id: "Are" },
};

function displaySymbol(sym: string) {
  return sym.replace(/2$/, "²").replace(/3$/, "³");
}

function unitFullName(category: LadderCategory, idx: number, locale: Locale) {
  const prefix = PREFIX_NAMES[locale][idx];
  const p = prefix.toLowerCase();
  let base: string;
  switch (category) {
    case "length":
      base = `${p}meter`;
      break;
    case "mass":
      base = `${p}gram`;
      break;
    case "liquidVolume":
      base = `${p}liter`;
      break;
    case "area":
      base = locale === "en" ? `Square ${p}meter` : `${p}meter persegi`;
      break;
    case "solidVolume":
      base = locale === "en" ? `Cubic ${p}meter` : `${p}meter kubik`;
      break;
  }
  const name = base.charAt(0).toUpperCase() + base.slice(1);
  const alias = category === "area" ? AREA_ALIASES[idx]?.[locale] : undefined;
  return alias ? `${name} (${alias})` : name;
}

const CATEGORY_ICON: Record<Category, typeof Ruler> = {
  length: Ruler,
  area: Square,
  liquidVolume: Droplets,
  solidVolume: Box,
  mass: Weight,
  temperature: Thermometer,
};

const LADDER_CATEGORIES: LadderCategory[] = [
  "length",
  "area",
  "liquidVolume",
  "solidVolume",
  "mass",
];
const ALL_CATEGORIES: Category[] = [...LADDER_CATEGORIES, "temperature"];

function defaultUnits(category: LadderCategory): [string, string] {
  const symbols = LADDER_SYMBOLS[category];
  return [symbols[0], symbols[3]];
}

function toBase(value: number, category: LadderCategory, unit: string): number {
  const idx = LADDER_SYMBOLS[category].indexOf(unit);
  if (idx !== -1) return value * Math.pow(LADDER_STEP[category], 3 - idx);
  const extra = EXTRA_UNITS[category].find((e) => e.key === unit);
  return extra ? value * extra.toBase : value;
}

function fromBase(value: number, category: LadderCategory, unit: string): number {
  const idx = LADDER_SYMBOLS[category].indexOf(unit);
  if (idx !== -1) return value * Math.pow(LADDER_STEP[category], idx - 3);
  const extra = EXTRA_UNITS[category].find((e) => e.key === unit);
  return extra ? value / extra.toBase : value;
}

function ladderConvert(
  value: number,
  category: LadderCategory,
  from: string,
  to: string,
): number {
  if (from === to) return value;
  return fromBase(toBase(value, category, from), category, to);
}

type TempUnit = "celsius" | "fahrenheit" | "kelvin" | "reaumur";

const TEMP_LABEL: Record<TempUnit, string> = {
  celsius: "Celsius (°C)",
  fahrenheit: "Fahrenheit (°F)",
  kelvin: "Kelvin (K)",
  reaumur: "Réaumur (°R)",
};

const TEMP_SYMBOL: Record<TempUnit, string> = {
  celsius: "°C",
  fahrenheit: "°F",
  kelvin: "K",
  reaumur: "°R",
};

function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  if (from === to) return value;
  let c = value;
  if (from === "fahrenheit") c = ((value - 32) * 5) / 9;
  else if (from === "kelvin") c = value - 273.15;
  else if (from === "reaumur") c = (value * 5) / 4;
  if (to === "fahrenheit") return (c * 9) / 5 + 32;
  if (to === "kelvin") return c + 273.15;
  if (to === "reaumur") return (c * 4) / 5;
  return c;
}

function formatResult(value: number): string {
  if (!isFinite(value)) return "";
  return value
    .toPrecision(8)
    .replace(/\.?0+$/, "")
    .replace(/\.$/, "");
}

function LadderStairs({
  category,
  fromUnit,
  toUnit,
  locale,
  t,
}: {
  category: LadderCategory;
  fromUnit: string;
  toUnit: string;
  locale: Locale;
  t: TFunc;
}) {
  const symbols = LADDER_SYMBOLS[category];
  const fromIdx = symbols.indexOf(fromUnit);
  const toIdx = symbols.indexOf(toUnit);
  const step = LADDER_STEP[category];

  let caption = t("tool.unit-converter.ladderHint").replace(
    /\{\{step\}\}/g,
    String(step),
  );
  if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
    const diff = toIdx - fromIdx;
    const steps = Math.abs(diff);
    const factor = Math.pow(step, steps).toLocaleString(
      locale === "id" ? "id-ID" : "en-US",
    );
    caption = (
      diff > 0
        ? t("tool.unit-converter.stepsDown")
        : t("tool.unit-converter.stepsUp")
    )
      .replace("{{steps}}", String(steps))
      .replace("{{factor}}", factor);
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">
        {t("tool.unit-converter.ladderTitle")}
      </p>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
        {symbols.map((sym, i) => {
          const isFrom = i === fromIdx;
          const isTo = i === toIdx;
          return (
            <div
              key={sym}
              className="flex flex-col items-center gap-1"
              style={{ marginTop: i * 10 }}
            >
              <span
                className={cn(
                  "h-3 text-[10px] font-semibold uppercase",
                  isFrom
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isTo
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-transparent",
                )}
              >
                {isFrom ? t("common.from") : isTo ? t("common.to") : " "}
              </span>
              <div
                title={unitFullName(category, i, locale)}
                className={cn(
                  "flex h-11 w-14 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-colors",
                  isFrom &&
                    "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300",
                  isTo &&
                    "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-950/40 dark:text-blue-300",
                  !isFrom &&
                    !isTo &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {displaySymbol(sym)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function LadderUnitSelect({
  category,
  value,
  onChange,
  locale,
  t,
}: {
  category: LadderCategory;
  value: string;
  onChange: (v: string) => void;
  locale: Locale;
  t: TFunc;
}) {
  const extras = EXTRA_UNITS[category];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t("tool.unit-converter.metricLadder")}</SelectLabel>
          {LADDER_SYMBOLS[category].map((sym, i) => (
            <SelectItem key={sym} value={sym}>
              {unitFullName(category, i, locale)} ({displaySymbol(sym)})
            </SelectItem>
          ))}
        </SelectGroup>
        {extras.length > 0 && (
          <SelectGroup>
            <SelectLabel>{t("tool.unit-converter.otherUnits")}</SelectLabel>
            {extras.map((u) => (
              <SelectItem key={u.key} value={u.key}>
                {u.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

function TempUnitSelect({
  value,
  onChange,
}: {
  value: TempUnit;
  onChange: (v: TempUnit) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TempUnit)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(TEMP_LABEL) as TempUnit[]).map((u) => (
          <SelectItem key={u} value={u}>
            {TEMP_LABEL[u]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function UnitConverterPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState("km");
  const [toUnit, setToUnit] = useState("m");
  const [inputVal, setInputVal] = useState("1");
  const [tempFrom, setTempFrom] = useState<TempUnit>("celsius");
  const [tempTo, setTempTo] = useState<TempUnit>("fahrenheit");

  const isLadder = category !== "temperature";
  const numericInput = parseFloat(inputVal);

  const result = isNaN(numericInput)
    ? ""
    : formatResult(
        isLadder
          ? ladderConvert(numericInput, category, fromUnit, toUnit)
          : convertTemp(numericInput, tempFrom, tempTo),
      );

  const onCategoryChange = (c: Category) => {
    setCategory(c);
    if (c !== "temperature") {
      const [f, target] = defaultUnits(c);
      setFromUnit(f);
      setToUnit(target);
    }
  };

  const swap = () => {
    if (isLadder) {
      setFromUnit(toUnit);
      setToUnit(fromUnit);
    } else {
      setTempFrom(tempTo);
      setTempTo(tempFrom);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: t("action.copied"), description: result });
  };

  const activeUnitLabel = isLadder ? displaySymbol(toUnit) : TEMP_SYMBOL[tempTo];

  return (
    <ToolShell
      title={t("tool.unit-converter.name")}
      description={t("tool.unit-converter.description")}
    >
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((c) => {
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
                {t(`tool.unit-converter.category.${c}` as any)}
              </Button>
            );
          })}
        </div>

        {isLadder ? (
          <LadderStairs
            category={category}
            fromUnit={fromUnit}
            toUnit={toUnit}
            locale={locale}
            t={t}
          />
        ) : (
          <p className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground">
            {t("tool.unit-converter.temperatureNote")}
          </p>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("common.from")}</Label>
            {isLadder ? (
              <LadderUnitSelect
                category={category}
                value={fromUnit}
                onChange={setFromUnit}
                locale={locale}
                t={t}
              />
            ) : (
              <TempUnitSelect value={tempFrom} onChange={setTempFrom} />
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={swap} className="mb-0.5">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-2">
            <Label>{t("common.to")}</Label>
            {isLadder ? (
              <LadderUnitSelect
                category={category}
                value={toUnit}
                onChange={setToUnit}
                locale={locale}
                t={t}
              />
            ) : (
              <TempUnitSelect value={tempTo} onChange={setTempTo} />
            )}
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
                  {activeUnitLabel}
                </span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={copyResult}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        {category === "solidVolume" && (
          <p className="text-xs text-muted-foreground">
            {t("tool.unit-converter.solidVolumeNote")}
          </p>
        )}
      </div>
    </ToolShell>
  );
}
