"use client";

import { Cpu, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";

export type ProcessingMode = "local" | "ai";

interface ProcessingModeToggleProps {
  mode: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

/**
 * Local (default, always works, zero config) vs AI Enhanced (calls a
 * server-side API route backed by a third-party service) toggle, shared by
 * every tool that offers a hybrid processing path.
 */
export function ProcessingModeToggle({
  mode,
  onChange,
  disabled,
}: ProcessingModeToggleProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-1.5">
      <Tabs value={mode} onValueChange={(v) => onChange(v as ProcessingMode)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="local" disabled={disabled} className="gap-1.5">
            <Cpu className="h-3.5 w-3.5" /> {t("common.mode.local")}
          </TabsTrigger>
          <TabsTrigger value="ai" disabled={disabled} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {t("common.mode.ai")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-[11px] text-muted-foreground">
        {mode === "local" ? t("common.mode.local.hint") : t("common.mode.ai.hint")}
      </p>
    </div>
  );
}
