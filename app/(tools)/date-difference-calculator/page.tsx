"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays, intervalToDuration } from "date-fns";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/context";
import { CalendarDays } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DateDifferenceCalculatorPage() {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(todayISO());

  const result = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

    const [from, to] = start <= end ? [start, end] : [end, start];
    const duration = intervalToDuration({ start: from, end: to });
    const totalDays = differenceInCalendarDays(to, from);

    return {
      years: duration.years ?? 0,
      months: duration.months ?? 0,
      days: duration.days ?? 0,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      totalHours: totalDays * 24,
    };
  }, [startDate, endDate]);

  const stats = result
    ? [
        [t("tool.date-difference-calculator.years"), result.years],
        [t("tool.date-difference-calculator.months"), result.months],
        [t("tool.date-difference-calculator.days"), result.days],
      ]
    : [];

  return (
    <ToolShell
      title={t("tool.date-difference-calculator.name")}
      description={t("tool.date-difference-calculator.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.date-difference-calculator.startDate")}
            </Label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.date-difference-calculator.endDate")}
            </Label>
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {result ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-xl border bg-muted/10 p-4"
                >
                  <span className="text-3xl font-bold tracking-tight">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                [t("tool.date-difference-calculator.totalDays"), result.totalDays],
                [t("tool.date-difference-calculator.totalWeeks"), result.totalWeeks],
                [t("tool.date-difference-calculator.totalHours"), result.totalHours],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-xl border bg-muted/10 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-lg font-semibold">
                      {Number(value).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border bg-muted/10">
            <ToolEmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title={t("tool.date-difference-calculator.placeholder")}
            />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
