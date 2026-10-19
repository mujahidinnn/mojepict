"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays, format, intervalToDuration } from "date-fns";
import { useI18n } from "@/lib/i18n/context";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { DatePicker } from "@/components/ui/date-picker";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { Cake, PartyPopper } from "lucide-react";

function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

function calculateAge(birth: Date, asOf: Date) {
  const { years = 0, months = 0, days = 0 } = intervalToDuration({ start: birth, end: asOf });
  const totalDays = differenceInCalendarDays(asOf, birth);

  let nextBirthday = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < asOf) {
    nextBirthday = new Date(asOf.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const daysToNextBirthday = differenceInCalendarDays(nextBirthday, asOf);

  return { years, months, days, totalDays, daysToNextBirthday };
}

export default function AgeCalculatorPage() {
  const { t } = useI18n();
  const [birthDate, setBirthDate] = useState("");
  const [asOfDate, setAsOfDate] = useState(todayISO());

  const asOfBeforeBirth = !!birthDate && !!asOfDate && asOfDate < birthDate;
  const age = useMemo(() => {
    if (!birthDate || !asOfDate) return null;
    const birth = new Date(birthDate + "T00:00:00");
    const asOf = new Date(asOfDate + "T00:00:00");
    if (isNaN(birth.getTime()) || isNaN(asOf.getTime()) || birth > asOf) return null;
    return calculateAge(birth, asOf);
  }, [birthDate, asOfDate]);

  const stats = age
    ? [
        [t("tool.age-calculator.years"), age.years],
        [t("tool.age-calculator.months"), age.months],
        [t("tool.age-calculator.days"), age.days],
      ]
    : [];

  return (
    <ToolShell
      title={t("tool.age-calculator.name")}
      description={t("tool.age-calculator.description")}
    >
      <div className="max-w-screen-lg flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label={t("tool.age-calculator.birthDate")}>
            <DatePicker value={birthDate} max={asOfDate} onChange={setBirthDate} />
          </FormGroup>
          <FormGroup label={t("tool.age-calculator.asOfDate")}>
            <DatePicker value={asOfDate} onChange={setAsOfDate} />
          </FormGroup>
        </div>

        {age ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-muted/10 p-6"
                >
                  <span className="text-3xl font-bold tracking-tight">{value}</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
                <Cake className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.age-calculator.totalDays")}
                </span>
                <span className="text-lg font-semibold">
                  {age.totalDays.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
                <PartyPopper className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                  {t("tool.age-calculator.nextBirthday")}
                </span>
                <span className="text-lg font-semibold">{age.daysToNextBirthday}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center rounded-xl border bg-muted/10">
            <ToolEmptyState
              icon={<Cake className="h-6 w-6" />}
              title={t(asOfBeforeBirth ? "tool.age-calculator.asOfBeforeBirth" : "tool.age-calculator.placeholder")}
            />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
