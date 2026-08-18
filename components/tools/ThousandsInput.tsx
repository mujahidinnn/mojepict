"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface ThousandsInputProps {
  /** Raw numeric string, e.g. "2000000" or "2000000.5" - no separators. */
  value: string;
  onChange: (raw: string) => void;
  className?: string;
  placeholder?: string;
}

// Rupiah convention regardless of UI language: "." groups thousands, "," is the decimal separator.
const GROUP_SEP = ".";
const DECIMAL_SEP = ",";

function formatThousands(raw: string) {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const withGroups = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEP);
  return decPart === undefined ? withGroups : `${withGroups}${DECIMAL_SEP}${decPart}`;
}

/** Number input that displays Rupiah-style thousands separators while typing. */
export const ThousandsInput = forwardRef<HTMLInputElement, ThousandsInputProps>(
  ({ value, onChange, className, placeholder }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(new RegExp(`[^0-9${DECIMAL_SEP}]`, "g"), "");
      const [intPart, ...rest] = cleaned.split(DECIMAL_SEP);
      const raw = rest.length > 0 ? `${intPart}.${rest.join("")}` : intPart;
      onChange(raw);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={formatThousands(value)}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    );
  },
);
ThousandsInput.displayName = "ThousandsInput";
