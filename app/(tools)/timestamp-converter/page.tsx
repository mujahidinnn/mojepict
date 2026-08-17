"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Copy } from "lucide-react";

type Unit = "seconds" | "milliseconds";

function toDatePart(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimePart(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function TimestampConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<Unit>("seconds");
  const [datePart, setDatePart] = useState(() => toDatePart(new Date()));
  const [timePart, setTimePart] = useState(() => toTimePart(new Date()));

  const parsedDate = useMemo(() => {
    if (!timestampInput.trim()) return null;
    const num = Number(timestampInput);
    if (!Number.isFinite(num)) return null;
    const ms = unit === "seconds" ? num * 1000 : num;
    const date = new Date(ms);
    return isNaN(date.getTime()) ? null : date;
  }, [timestampInput, unit]);

  const parsedTimestamp = useMemo(() => {
    if (!datePart) return null;
    const date = new Date(`${datePart}T${timePart || "00:00:00"}`);
    return isNaN(date.getTime()) ? null : date;
  }, [datePart, timePart]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.timestamp-converter.name")}
      description={t("tool.timestamp-converter.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 text-white">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-xs text-muted-foreground">
              {t("tool.timestamp-converter.now")}
            </span>
            <span className="text-lg font-semibold font-mono truncate">
              {now === null ? "-" : Math.floor(now / 1000)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => now !== null && copy(String(Math.floor(now / 1000)))}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("tool.timestamp-converter.toDate")}
          </Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={t("tool.timestamp-converter.timestampPlaceholder")}
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              className="font-mono"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">
                  {t("tool.timestamp-converter.seconds")}
                </SelectItem>
                <SelectItem value="milliseconds">
                  {t("tool.timestamp-converter.milliseconds")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {timestampInput.trim() && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-sm font-mono truncate">
                {parsedDate ? parsedDate.toString() : t("tool.timestamp-converter.invalid")}
              </span>
              {parsedDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => copy(parsedDate.toISOString())}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("tool.timestamp-converter.toTimestamp")}
          </Label>
          <div className="flex gap-2">
            <DatePicker value={datePart} onChange={setDatePart} className="flex-1" />
            <Input
              type="time"
              step="1"
              value={timePart}
              onChange={(e) => setTimePart(e.target.value)}
              className="w-32 shrink-0 font-mono"
            />
          </div>
          {parsedTimestamp && (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <span className="text-sm font-mono">
                {Math.floor(parsedTimestamp.getTime() / 1000)} ({parsedTimestamp.getTime()} ms)
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copy(String(Math.floor(parsedTimestamp.getTime() / 1000)))}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
