"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Plus, Trash2 } from "lucide-react";

type GradientType = "linear" | "radial";

export default function GradientGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [type, setType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [colors, setColors] = useState(["#6366f1", "#ec4899"]);

  const css = useMemo(() => {
    const stops = colors.join(", ");
    return type === "linear"
      ? `linear-gradient(${angle}deg, ${stops})`
      : `radial-gradient(circle, ${stops})`;
  }, [type, angle, colors]);

  const fullCss = `background: ${css};`;

  const copy = () => {
    navigator.clipboard.writeText(fullCss);
    toast({ description: t("toast.success.copied") });
  };

  const updateColor = (i: number, value: string) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  };

  const addColor = () => {
    if (colors.length >= 5) return;
    setColors((prev) => [...prev, "#22c55e"]);
  };

  const removeColor = (i: number) => {
    if (colors.length <= 2) return;
    setColors((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <ToolShell
      title={t("tool.gradient-generator.name")}
      description={t("tool.gradient-generator.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.gradient-generator.type")}
              </Label>
              <Tabs value={type} onValueChange={(v) => setType(v as GradientType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="linear">
                    {t("tool.gradient-generator.linear")}
                  </TabsTrigger>
                  <TabsTrigger value="radial">
                    {t("tool.gradient-generator.radial")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {type === "linear" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.gradient-generator.angle")}
                  </Label>
                  <span className="text-xs font-medium tabular-nums">{angle}°</span>
                </div>
                <Slider
                  value={[angle]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={([v]) => setAngle(v)}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("tool.gradient-generator.colors")}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={addColor}
                  disabled={colors.length >= 5}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => updateColor(i, e.target.value)}
                      className="h-9 w-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                    />
                    <span className="flex-1 font-mono text-sm uppercase text-muted-foreground">
                      {c}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeColor(i)}
                      disabled={colors.length <= 2}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CSS
              </Label>
              <div className="rounded-md border bg-muted/20 p-3">
                <code className="text-xs break-all">{fullCss}</code>
              </div>
              <Button type="button" onClick={copy} className="w-full gap-2">
                <Copy className="h-4 w-4" /> {t("action.copy")}
              </Button>
            </div>
          </>
        }
      >
        <div
          className="min-h-[500px] w-full rounded-xl border shadow-inner"
          style={{ backgroundImage: css }}
        />
      </ToolWorkspace>
    </ToolShell>
  );
}
