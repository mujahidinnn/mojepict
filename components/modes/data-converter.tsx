"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SingleColumnLayout, FormGroup, ResultCard } from "@/components/tools/ToolTemplates";

const DATA_UNITS = [
  { label: "Bit (b)", value: "bit", ratio: 0.125 },
  { label: "Byte (B)", value: "B", ratio: 1 },
  { label: "Kilobyte (KB)", value: "KB", ratio: 1024 },
  { label: "Megabyte (MB)", value: "MB", ratio: 1024 ** 2 },
  { label: "Gigabyte (GB)", value: "GB", ratio: 1024 ** 3 },
  { label: "Terabyte (TB)", value: "TB", ratio: 1024 ** 4 },
  { label: "Petabyte (PB)", value: "PB", ratio: 1024 ** 5 },
];

export default function DataConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [inputValue, setInputValue] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("GB");
  const [toUnit, setToUnit] = useState<string>("MB");
  const [result, setResult] = useState<number>(1024);

  useEffect(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) {
      setResult(0);
      return;
    }

    const fromRatio = DATA_UNITS.find((u) => u.value === fromUnit)?.ratio || 1;
    const toRatio = DATA_UNITS.find((u) => u.value === toUnit)?.ratio || 1;

    const calculated = (num * fromRatio) / toRatio;
    setResult(calculated);
  }, [inputValue, fromUnit, toUnit]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleReset = () => {
    setInputValue("1");
    setFromUnit("GB");
    setToUnit("MB");
  };

  const copyToClipboard = (val: string) => {
    navigator.clipboard.writeText(val);
    toast({
      description: t("toast.success.copied"),
    });
  };

  const formattedResult =
    result % 1 === 0 ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");

  return (
    <ToolShell
      title={t("tool.data-converter.name")}
      description={t("tool.data-converter.description")}
    >
      <SingleColumnLayout>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleReset}>
            {t("tool.unit-converter.reset-value")}
          </Button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <FormGroup label={t("common.from")}>
              <div className="space-y-2">
                <Input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="text-lg font-semibold"
                />
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormGroup>

            <div className="pb-1 hidden md:block">
              <Button
                variant="ghost"
                size="icon"
                title={t("common.swap")}
                onClick={handleSwap}
                className="h-9 w-9"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            <FormGroup label={t("common.to")}>
              <div className="space-y-2">
                <ResultCard content={formattedResult} onCopy={copyToClipboard} />
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormGroup>
          </div>
        </Card>

        <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Info className="h-4 w-4" />
            {t("tool.unit-converter.quick-ref")}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 border rounded bg-background/50">
              <p className="text-muted-foreground">1 GB</p>
              <p className="font-bold">1,024 MB</p>
            </div>
            <div className="p-4 border rounded bg-background/50">
              <p className="text-muted-foreground">1 TB</p>
              <p className="font-bold">1,024 GB</p>
            </div>
            <div className="p-4 border rounded bg-background/50">
              <p className="text-muted-foreground">1 MB</p>
              <p className="font-bold">1,024 KB</p>
            </div>
            <div className="p-4 border rounded bg-background/50">
              <p className="text-muted-foreground">1 Byte</p>
              <p className="font-bold">8 Bits</p>
            </div>
          </div>
        </div>

        <p className="text-xs italic text-muted-foreground">{t("tool.data-converter.note")}</p>
      </SingleColumnLayout>
    </ToolShell>
  );
}
