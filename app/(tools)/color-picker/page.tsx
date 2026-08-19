"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ColorPickerPanel } from "@/components/tools/ColorPickerPanel";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { hexToRgb, rgbToHsl } from "@/lib/color";

export default function ColorPickerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [color, setColor] = useState("#6366f1");

  const { r, g, b } = hexToRgb(color);
  const { h, s, l } = rgbToHsl(r, g, b);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("action.copied"), description: label });
  };

  const formats = [
    { label: "HEX", value: color.toUpperCase() },
    { label: "RGB", value: `rgb(${r}, ${g}, ${b})` },
    { label: "HSL", value: `hsl(${h}, ${s}%, ${l}%)` },
  ];

  return (
    <ToolShell
      title={t("tool.color-picker.name")}
      description={t("tool.color-picker.description")}
    >
      <div className="flex flex-col gap-6 max-w-xl">
        <ColorPickerPanel value={color} onChange={setColor} />

        <div className="flex flex-col gap-3">
          {formats.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5"
            >
              <div>
                <Badge variant="secondary" className="text-[10px] mb-1">
                  {label}
                </Badge>
                <p className="font-mono text-sm">{value}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(value, `${label} copied`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border overflow-hidden h-24"
          style={{
            background: `linear-gradient(to right, hsl(${h},${s}%,20%), hsl(${h},${s}%,50%), hsl(${h},${s}%,80%))`,
          }}
        />
      </div>
    </ToolShell>
  );
}
