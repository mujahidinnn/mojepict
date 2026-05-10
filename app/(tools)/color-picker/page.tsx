"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

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
      badge="New"
    >
      <div className="flex flex-col gap-6 max-w-md">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-xl border overflow-hidden shrink-0">
            <div className="absolute inset-0" style={{ background: color }} />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Hex value</Label>
            <Input
              value={color.toUpperCase()}
              onChange={(e) => setColor(e.target.value)}
              className="font-mono w-36"
              maxLength={7}
            />
          </div>
        </div>

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
