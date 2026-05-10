"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight, Copy, RotateCcw, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <ToolShell
      title={t("tool.data-converter.name")}
      description={t("tool.data-converter.description")}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full min-w-0">
          <Card className="border shadow-sm bg-card">
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    {t("common.from")}
                  </Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="text-lg font-semibold h-12 focus-visible:ring-primary"
                    />
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-full h-11 bg-background">
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
                </div>

                <div className="pb-1 hidden md:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("common.swap")}
                    onClick={handleSwap}
                    className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors h-12 w-12"
                  >
                    <ArrowLeftRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    {t("common.to")}
                  </Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        readOnly
                        value={
                          result % 1 === 0
                            ? result
                            : result.toFixed(4).replace(/\.?0+$/, "")
                        }
                        className="text-lg font-semibold h-12 bg-muted/30 pr-10 border-dashed"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(result.toString())}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger className="w-full h-11 bg-background">
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
                </div>
              </div>

              <div className="pt-4">
                <div className="bg-muted/30 rounded-xl border p-4 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Info className="h-4 w-4" />
                    {t("tool.unit-converter.quick-ref")}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                    <div className="p-2 border rounded bg-background/50">
                      <p className="text-muted-foreground">1 GB</p>
                      <p className="font-bold">1,024 MB</p>
                    </div>
                    <div className="p-2 border rounded bg-background/50">
                      <p className="text-muted-foreground">1 TB</p>
                      <p className="font-bold">1,024 GB</p>
                    </div>
                    <div className="p-2 border rounded bg-background/50">
                      <p className="text-muted-foreground">1 MB</p>
                      <p className="font-bold">1,024 KB</p>
                    </div>
                    <div className="p-2 border rounded bg-background/50">
                      <p className="text-muted-foreground">1 Byte</p>
                      <p className="font-bold">8 Bits</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-[280px] flex flex-col gap-4 sticky top-6">
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex flex-col gap-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {t("common.actions")}
              </Label>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 text-orange-500" />
                {t("tool.unit-converter.reset-value")}
              </Button>

              <Separator className="my-2" />

              <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                  {t("tool.data-converter.note")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
