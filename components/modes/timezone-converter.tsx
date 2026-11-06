"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { useI18n } from "@/lib/i18n/context";

const ZONES: [string, string][] = [
  ["Asia/Jakarta", "WIB · Jakarta"],
  ["Asia/Makassar", "WITA · Makassar"],
  ["Asia/Jayapura", "WIT · Jayapura"],
  ["UTC", "UTC"],
  ["Asia/Riyadh", "Makkah / Riyadh"],
  ["Asia/Dubai", "Dubai"],
  ["Asia/Singapore", "Singapore"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
  ["Europe/London", "London"],
  ["Europe/Paris", "Paris"],
  ["America/New_York", "New York"],
  ["America/Los_Angeles", "Los Angeles"],
];

const parts = (zone: string, ms: number) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(new Date(ms)).map((x) => [x.type, +x.value]),
  );
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
};

/** Wall-clock "YYYY-MM-DDTHH:mm" in `zone` to a UTC instant (offset re-checked once for DST edges). */
function toInstant(local: string, zone: string): number {
  const wall = Date.parse(local + "Z");
  let ms = wall - (parts(zone, wall) - wall);
  ms = wall - (parts(zone, ms) - ms);
  return ms;
}

export default function TimezoneConverter() {
  const { t } = useI18n();
  const [local, setLocal] = useState("");
  const [zone, setZone] = useState("Asia/Jakarta");

  // Client only: "now" differs between build and visit.
  useEffect(() => setLocal(new Date(parts("Asia/Jakarta", Date.now())).toISOString().slice(0, 16)), []);

  const instant = local ? toInstant(local, zone) : NaN;
  const show = (z: string) =>
    new Intl.DateTimeFormat("id-ID", {
      timeZone: z, dateStyle: "medium", timeStyle: "short", hourCycle: "h23",
    }).format(instant);

  return (
    <div className="max-w-screen-lg flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormGroup label={t("tool.timezone-converter.time")}>
          <Input type="datetime-local" value={local} onChange={(e) => setLocal(e.target.value)} />
        </FormGroup>
        <FormGroup label={t("tool.timezone-converter.from")}>
          <Select value={zone} onValueChange={setZone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ZONES.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormGroup>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ZONES.filter(([id]) => id !== zone).map(([id, label]) => (
          <Card key={id} className="p-4 bg-muted/10 flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{isNaN(instant) ? "—" : show(id)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
