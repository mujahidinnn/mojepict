"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Copy } from "lucide-react";

const ONES = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
const SCALES: [number, string][] = [
  [1e12, "triliun"],
  [1e9, "miliar"],
  [1e6, "juta"],
];

/** Integer 0 <= n < 1e15 to Indonesian words. */
export function say(n: number): string {
  if (n < 12) return ONES[n];
  if (n < 20) return `${say(n - 10)} belas`;
  if (n < 100) return `${say(Math.floor(n / 10))} puluh${n % 10 ? " " + say(n % 10) : ""}`;
  if (n < 200) return `seratus${n % 100 ? " " + say(n % 100) : ""}`;
  if (n < 1000) return `${say(Math.floor(n / 100))} ratus${n % 100 ? " " + say(n % 100) : ""}`;
  if (n < 2000) return `seribu${n % 1000 ? " " + say(n % 1000) : ""}`;
  if (n < 1e6) return `${say(Math.floor(n / 1000))} ribu${n % 1000 ? " " + say(n % 1000) : ""}`;
  for (const [v, w] of SCALES) {
    if (n >= v) return `${say(Math.floor(n / v))} ${w}${n % v ? " " + say(n % v) : ""}`;
  }
  return "";
}

/** "1234,5" -> "seribu dua ratus tiga puluh empat koma lima"; null when invalid or >= 1e15. */
export function terbilang(input: string): string | null {
  const m = /^(-)?(\d{1,15})(?:[.,](\d+))?$/.exec(input.trim());
  if (!m) return null;
  const [, neg, int, dec] = m;
  const out = say(Number(int));
  const frac = dec ? " koma " + [...dec].map((d) => ONES[+d]).join(" ") : "";
  return (neg && Number(int) + Number(dec ?? 0) > 0 ? "minus " : "") + out + frac;
}

export default function Terbilang() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [rupiah, setRupiah] = useState(true);

  const words = useMemo(() => terbilang(value), [value]);
  const text = words ? `${words}${rupiah ? " rupiah" : ""}` : "";
  const pretty = text && text.charAt(0).toUpperCase() + text.slice(1);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      toast({ description: t("toast.success.copied") });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  };

  return (
    <div className="max-w-screen-lg flex flex-col gap-6">
      <FormGroup
        label={t("tool.terbilang.input")}
        error={value && !words ? t("tool.terbilang.invalid") : undefined}
      >
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="1250000"
        />
      </FormGroup>
      <div className="flex items-center gap-3">
        <Switch checked={rupiah} onCheckedChange={setRupiah} id="terbilang-rp" />
        <Label htmlFor="terbilang-rp" className="text-sm font-normal cursor-pointer">
          {t("tool.terbilang.rupiah")}
        </Label>
      </div>
      <Card className="p-6 flex items-start justify-between gap-4 bg-muted/10">
        <p className="text-base break-words">{pretty || t("tool.terbilang.placeholder")}</p>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={copy} disabled={!pretty} aria-label={t("action.copy")}>
          <Copy className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
