"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
}

function parseISODate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  min,
  max,
  className,
  disabled,
}: DatePickerProps) {
  const { locale } = useI18n();
  const [open, setOpen] = React.useState(false);
  const dateLocale = locale === "id" ? idLocale : enUS;

  const selected = parseISODate(value);
  const minDate = min ? parseISODate(min) : undefined;
  const maxDate = max ? parseISODate(max) : undefined;
  const disabledMatchers = [
    minDate ? { before: minDate } : null,
    maxDate ? { after: maxDate } : null,
  ].filter((m): m is { before: Date } | { after: Date } => m !== null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start gap-2 text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
          {selected ? format(selected, "PPP", { locale: dateLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toISODate(date));
            setOpen(false);
          }}
          disabled={disabledMatchers.length ? disabledMatchers : undefined}
          defaultMonth={selected ?? maxDate}
          locale={dateLocale}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
