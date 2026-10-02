"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;

type CharsetKey = keyof typeof CHARSETS;

function generatePassword(length: number, charset: string) {
  if (!charset) return "";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => charset[v % charset.length]).join("");
}

export default function PasswordGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<Record<CharsetKey, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [password, setPassword] = useState("");

  const charset = useMemo(
    () =>
      (Object.keys(CHARSETS) as CharsetKey[])
        .filter((key) => options[key])
        .map((key) => CHARSETS[key])
        .join(""),
    [options],
  );

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, charset));
  }, [length, charset]);

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, charset]);

  const strength = useMemo(() => {
    const variety = Object.values(options).filter(Boolean).length;
    const score =
      length >= 20 && variety >= 3 ? 3 : length >= 14 && variety >= 2 ? 2 : length >= 8 ? 1 : 0;
    const levels = [
      { label: t("tool.password-generator.strength.weak"), color: "bg-destructive" },
      { label: t("tool.password-generator.strength.fair"), color: "bg-amber-500" },
      { label: t("tool.password-generator.strength.strong"), color: "bg-blue-500" },
      { label: t("tool.password-generator.strength.veryStrong"), color: "bg-emerald-500" },
    ];
    return { ...levels[score], score };
  }, [length, options, t]);

  const toggleOption = (key: CharsetKey) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!Object.values(next).some(Boolean)) {
        toast({
          variant: "destructive",
          description: t("tool.password-generator.needOneOption"),
        });
        return prev;
      }
      return next;
    });
  };

  const copyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    toast({ description: t("toast.success.copied") });
  };

  return (
    <ToolShell
      title={t("tool.password-generator.name")}
      description={t("tool.password-generator.description")}
    >
      <div className="max-w-screen-lg flex flex-col gap-8">
        {/* Password Display Card */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/10 p-6">
          <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
          <code className="flex-1 truncate text-sm font-mono tracking-wide">
            {password}
          </code>
          <Button
            size="icon"
            variant="ghost"
            onClick={copyPassword}
            aria-label={t("action.copy")}
            className="h-9 w-9 shrink-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={regenerate}
            aria-label={t("tool.password-generator.generate")}
            className="h-9 w-9 shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Strength Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-1.5 flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-full flex-1 rounded-full",
                  i <= strength.score ? strength.color : "bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground w-20 text-right">
            {strength.label}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Length Slider */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label className="text-sm font-medium">
                {t("tool.password-generator.length")}
              </Label>
              <span className="text-sm font-mono text-muted-foreground">{length}</span>
            </div>
            <Slider
              value={[length]}
              min={8}
              max={64}
              step={1}
              onValueChange={(v: number[]) => setLength(v[0])}
            />
          </div>

          {/* Character Sets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium block">
              {t("tool.password-generator.characterSets")}
            </Label>
            <div className="space-y-2">
              {(Object.keys(CHARSETS) as CharsetKey[]).map((key) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <Label
                    htmlFor={`opt-${key}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t(`tool.password-generator.${key}` as any)}
                  </Label>
                  <Switch
                    id={`opt-${key}`}
                    checked={options[key]}
                    onCheckedChange={() => toggleOption(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button onClick={regenerate} className="w-full h-10 gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("tool.password-generator.generate")}
        </Button>
      </div>
    </ToolShell>
  );
}
