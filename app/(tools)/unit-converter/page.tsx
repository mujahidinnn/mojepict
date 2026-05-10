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
import { ArrowLeftRight, Copy } from "lucide-react";
import { useState } from "react";

type Category = "length" | "weight" | "temperature";

const units: Record<Category, string[]> = {
  length: [
    "meter",
    "kilometer",
    "centimeter",
    "millimeter",
    "mile",
    "yard",
    "foot",
    "inch",
  ],
  weight: ["kilogram", "gram", "milligram", "pound", "ounce", "ton"],
  temperature: ["celsius", "fahrenheit", "kelvin"],
};

function convert(
  value: number,
  from: string,
  to: string,
  category: Category,
): number {
  if (from === to) return value;
  if (category === "temperature") {
    let celsius = value;
    if (from === "fahrenheit") celsius = ((value - 32) * 5) / 9;
    if (from === "kelvin") celsius = value - 273.15;
    if (to === "fahrenheit") return (celsius * 9) / 5 + 32;
    if (to === "kelvin") return celsius + 273.15;
    return celsius;
  }
  const toBase: Record<string, number> = {
    meter: 1,
    kilometer: 1000,
    centimeter: 0.01,
    millimeter: 0.001,
    mile: 1609.344,
    yard: 0.9144,
    foot: 0.3048,
    inch: 0.0254,
    kilogram: 1,
    gram: 0.001,
    milligram: 0.000001,
    pound: 0.453592,
    ounce: 0.0283495,
    ton: 1000,
  };
  return (value * toBase[from]) / toBase[to];
}

export default function UnitConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState("meter");
  const [toUnit, setToUnit] = useState("kilometer");
  const [inputVal, setInputVal] = useState("1");

  const result = isNaN(parseFloat(inputVal))
    ? ""
    : convert(parseFloat(inputVal), fromUnit, toUnit, category)
        .toPrecision(8)
        .replace(/\.?0+$/, "");

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast({ title: t("action.copied"), description: result });
  };

  const onCategoryChange = (c: Category) => {
    setCategory(c);
    setFromUnit(units[c][0]);
    setToUnit(units[c][1]);
  };

  return (
    <ToolShell
      title={t("tool.unit-converter.name")}
      description={t("tool.unit-converter.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => onCategoryChange(v as Category)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="length">Length</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units[category].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={swap} className="mb-0.5">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units[category].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Value</Label>
          <Input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter value..."
          />
        </div>

        {result && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Result</p>
              <p className="text-2xl font-semibold font-mono">
                {result}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {toUnit}
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
