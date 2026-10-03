"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Options sharing a group render under one heading, in first-seen order. */
  group?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** Only show the search box once there are more options than this. */
  searchThreshold?: number;
  "aria-label"?: string;
}

function groupOptions(options: ComboboxOption[]) {
  const groups = new Map<string | undefined, ComboboxOption[]>();
  for (const opt of options) {
    const list = groups.get(opt.group);
    if (list) list.push(opt);
    else groups.set(opt.group, [opt]);
  }
  return [...groups.entries()];
}

/** Drop-in Select replacement that adds a search box once the option list gets long. */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  className,
  searchThreshold = 10,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const groups = groupOptions(options);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className={cn("line-clamp-1", !selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder ?? t("common.combobox.select")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          {options.length > searchThreshold && (
            <CommandInput placeholder={searchPlaceholder ?? t("common.combobox.search")} />
          )}
          <CommandList>
            <CommandEmpty>{emptyText ?? t("common.combobox.noResults")}</CommandEmpty>
            {groups.map(([group, items]) => (
              <CommandGroup key={group ?? "__ungrouped"} heading={group}>
                {items.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", opt.value === value ? "opacity-100" : "opacity-0")} />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
