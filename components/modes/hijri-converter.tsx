"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { useI18n } from "@/lib/i18n/context";

const HIJRI = "en-u-ca-islamic-umalqura-nu-latn";
const MONTHS = ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Syaban", "Ramadan", "Syawal", "Zulkaidah", "Zulhijah"];
const fmt = new Intl.DateTimeFormat(HIJRI, { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });

function toHijri(d: Date) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, +x.value]));
  return { y: p.year, m: p.month, d: p.day };
}

/** Scans around the approximate Gregorian year; Intl has no reverse conversion. */
function toGregorian(y: number, m: number, d: number): Date | null {
  const start = Date.UTC(Math.round(y * 0.970224 + 621.57), 0, 1) - 400 * 864e5;
  for (let i = 0; i < 800; i++) {
    const g = new Date(start + i * 864e5);
    const h = toHijri(g);
    if (h.y === y && h.m === m && h.d === d) return g;
  }
  return null;
}

const gFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeZone: "UTC" });

export default function HijriConverter() {
  const { t } = useI18n();
  const [greg, setGreg] = useState("");
  const [h, setH] = useState({ y: "", m: "", d: "" });

  // Set on the client only: the current date differs between build and visit.
  useEffect(() => setGreg(new Date().toISOString().slice(0, 10)), []);

  const gDate = greg ? new Date(greg + "T00:00:00Z") : null;
  const hijri = gDate && !isNaN(+gDate) ? toHijri(gDate) : null;

  const hy = +h.y, hm = +h.m, hd = +h.d;
  const valid = hy >= 1300 && hy <= 1600 && hm >= 1 && hm <= 12 && hd >= 1 && hd <= 30;
  const back = valid ? toGregorian(hy, hm, hd) : null;

  return (
    <div className="max-w-screen-lg grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-4">
        <FormGroup label={t("tool.hijri-converter.gregorian")}>
          <Input type="date" value={greg} onChange={(e) => setGreg(e.target.value)} />
        </FormGroup>
        <Card className="p-6 bg-muted/10 text-lg">
          {hijri ? `${hijri.d} ${MONTHS[hijri.m - 1]} ${hijri.y} H` : "—"}
        </Card>
      </div>
      <div className="flex flex-col gap-4">
        <FormGroup label={t("tool.hijri-converter.hijri")}>
          <div className="grid grid-cols-3 gap-2">
            {(["d", "m", "y"] as const).map((k) => (
              <Input
                key={k}
                inputMode="numeric"
                value={h[k]}
                onChange={(e) => setH({ ...h, [k]: e.target.value.replace(/\D/g, "") })}
                placeholder={{ d: t("tool.hijri-converter.day"), m: t("tool.hijri-converter.month"), y: t("tool.hijri-converter.year") }[k]}
              />
            ))}
          </div>
        </FormGroup>
        <Card className="p-6 bg-muted/10 text-lg">
          {back ? gFmt.format(back) : h.y || h.m || h.d ? t("tool.hijri-converter.invalid") : "—"}
        </Card>
      </div>
      <p className="md:col-span-2 text-xs text-muted-foreground">{t("tool.hijri-converter.note")}</p>
    </div>
  );
}
