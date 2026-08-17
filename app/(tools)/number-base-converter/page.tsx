"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";

type Base = 2 | 8 | 10 | 16;

const BASES: { base: Base; label: string; prefix: string }[] = [
  { base: 2, label: "Binary", prefix: "0b" },
  { base: 8, label: "Octal", prefix: "0o" },
  { base: 10, label: "Decimal", prefix: "" },
  { base: 16, label: "Hexadecimal", prefix: "0x" },
];

const VALID_CHARS: Record<Base, RegExp> = {
  2: /^[01]*$/,
  8: /^[0-7]*$/,
  10: /^[0-9]*$/,
  16: /^[0-9a-fA-F]*$/,
};

export default function NumberBaseConverterPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeBase, setActiveBase] = useState<Base>(10);
  const [rawValue, setRawValue] = useState("42");

  const decimal = rawValue.trim() && VALID_CHARS[activeBase].test(rawValue.trim())
    ? parseInt(rawValue.trim(), activeBase)
    : NaN;
  const isValid = Number.isFinite(decimal) && !Number.isNaN(decimal);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.number-base-converter.name")}
      description={t("tool.number-base-converter.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/10 p-4">
          {BASES.map(({ base, label, prefix }) => {
            const isActive = base === activeBase;
            const displayValue = isActive
              ? rawValue
              : isValid
                ? decimal.toString(base)
                : "";
            return (
              <div key={base} className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t(`tool.number-base-converter.base.${base}` as any) || label} ({t("tool.number-base-converter.baseLabel").replace("{{base}}", String(base))})
                </Label>
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground font-mono">
                    {prefix}
                  </span>
                  <Input
                    value={displayValue}
                    onFocus={() => {
                      if (!isActive && isValid) {
                        setActiveBase(base);
                        setRawValue(decimal.toString(base));
                      } else {
                        setActiveBase(base);
                      }
                    }}
                    onChange={(e) => {
                      setActiveBase(base);
                      const v = e.target.value;
                      if (VALID_CHARS[base].test(v)) setRawValue(v);
                    }}
                    className="font-mono"
                    spellCheck={false}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => copy(displayValue)}
                    disabled={!displayValue}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {!isValid && rawValue.trim() && (
          <p className="text-sm text-destructive">{t("tool.number-base-converter.invalid")}</p>
        )}
      </div>
    </ToolShell>
  );
}
