"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Dropzone } from "@/components/tools/Dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractPaletteFromImage, hexToHsl, hslToHex, isValidHex } from "@/lib/color";
import {
  getSavedPalettes,
  removeSavedPalette,
  savePalette,
  SavedPalette,
} from "@/hooks/use-saved-palettes";
import { Copy, ImageIcon, Lock, Shuffle, Trash2, Unlock, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  "complementary",
  "splitComplementary",
  "analogous",
  "triadic",
  "tetradic",
  "square",
  "monochromatic",
] as const;
type Mode = (typeof MODES)[number];

const FORMATS = ["css", "scss", "tailwind", "json"] as const;
type Format = (typeof FORMATS)[number];

type Source = "color" | "image";

function clampLightness(l: number) {
  return Math.max(8, Math.min(92, l));
}

function generatePalette(base: string, mode: Mode): string[] {
  const { h, s, l } = hexToHsl(base);

  switch (mode) {
    case "complementary": {
      const h2 = h + 180;
      return [
        hslToHex(h, s, clampLightness(l - 20)),
        hslToHex(h, s, l),
        hslToHex(h, s, clampLightness(l + 20)),
        hslToHex(h2, s, clampLightness(l + 20)),
        hslToHex(h2, s, l),
        hslToHex(h2, s, clampLightness(l - 20)),
      ];
    }
    case "splitComplementary":
      return [h, h + 150, h + 210].map((hue) => hslToHex(hue, s, l));
    case "analogous":
      return [h - 60, h - 30, h, h + 30, h + 60].map((hue) => hslToHex(hue, s, l));
    case "triadic":
      return [h, h + 120, h + 240].map((hue) => hslToHex(hue, s, l));
    case "tetradic":
      return [h, h + 60, h + 180, h + 240].map((hue) => hslToHex(hue, s, l));
    case "square":
      return [h, h + 90, h + 180, h + 270].map((hue) => hslToHex(hue, s, l));
    case "monochromatic":
      return [20, 35, 50, 65, 80].map((lightness) => hslToHex(h, s, lightness));
  }
}

function formatPalette(colors: string[], format: Format): string {
  const upper = colors.map((c) => c.toUpperCase());
  switch (format) {
    case "css":
      return [":root {", ...upper.map((c, i) => `  --palette-${i + 1}: ${c};`), "}"].join("\n");
    case "scss":
      return upper.map((c, i) => `$palette-${i + 1}: ${c};`).join("\n");
    case "tailwind":
      return [
        "module.exports = {",
        "  theme: {",
        "    extend: {",
        "      colors: {",
        "        palette: {",
        ...upper.map((c, i) => `          ${i + 1}: "${c}",`),
        "        },",
        "      },",
        "    },",
        "  },",
        "};",
      ].join("\n");
    case "json":
      return JSON.stringify(upper, null, 2);
  }
}

export default function ColorPalettePage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [source, setSource] = useState<Source>("color");
  const [baseColor, setBaseColor] = useState("#6366f1");
  const [mode, setMode] = useState<Mode>("analogous");
  const [exportFormat, setExportFormat] = useState<Format>("css");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageColors, setImageColors] = useState<string[] | null>(null);

  const [palette, setPalette] = useState<string[]>(() =>
    generatePalette("#6366f1", "analogous"),
  );
  const [locks, setLocks] = useState<boolean[]>([]);
  const [saved, setSaved] = useState<SavedPalette[]>([]);

  useEffect(() => {
    setSaved(getSavedPalettes());
  }, []);

  // Recompute whenever the generation inputs change, keeping locked slots fixed.
  useEffect(() => {
    const fresh =
      source === "image"
        ? (imageColors ?? [])
        : generatePalette(isValidHex(baseColor) ? baseColor : "#6366f1", mode);

    setPalette((prev) =>
      fresh.map((color, i) => (locks[i] && prev[i] ? prev[i] : color)),
    );
    setLocks((prev) => {
      if (prev.length === fresh.length) return prev;
      return fresh.map((_, i) => prev[i] ?? false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, baseColor, mode, imageColors]);

  const handleImage = async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    try {
      const colors = await extractPaletteFromImage(file, 6);
      setImageColors(colors);
    } catch (error) {
      console.error("Palette extraction error:", error);
      toast({ variant: "destructive", description: t("toast.error.generic") });
    }
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setImageColors(null);
  };

  const toggleLock = (i: number) => {
    setLocks((prev) => prev.map((locked, idx) => (idx === i ? !locked : locked)));
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex.toUpperCase());
    toast({ description: `${hex.toUpperCase()} ${t("action.copied")}` });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(formatPalette(palette, exportFormat));
    toast({ description: t("tool.color-palette.copied-all") });
  };

  const randomize = () => {
    const hue = Math.floor(Math.random() * 360);
    setBaseColor(hslToHex(hue, 65, 55));
  };

  const handleSave = () => {
    if (palette.length === 0) return;
    setSaved(savePalette(palette));
    toast({ description: t("tool.color-palette.saved") });
  };

  const handleRemoveSaved = (id: string) => {
    setSaved(removeSavedPalette(id));
  };

  const loadSaved = (colors: string[]) => {
    setPalette(colors);
    setLocks(colors.map(() => false));
  };

  return (
    <ToolShell
      title={t("tool.color-palette.name")}
      description={t("tool.color-palette.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.color-palette.source")}
              </Label>
              <Tabs value={source} onValueChange={(v) => setSource(v as Source)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="color">
                    {t("tool.color-palette.source.color")}
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    {t("tool.color-palette.source.image")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {source === "color" ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.color-palette.base-color")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 rounded-lg border overflow-hidden">
                      <div
                        className="absolute inset-0"
                        style={{ background: isValidHex(baseColor) ? baseColor : "#6366f1" }}
                      />
                      <input
                        type="color"
                        value={isValidHex(baseColor) ? baseColor : "#6366f1"}
                        onChange={(e) => setBaseColor(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                    <Input
                      value={baseColor.toUpperCase()}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.color-palette.harmony")}
                  </Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {t(`tool.color-palette.mode.${m}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={randomize}>
                  <Shuffle className="h-4 w-4" /> {t("tool.color-palette.randomize")}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("common.input-image")}
                </Label>
                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Source" className="h-28 w-full object-cover" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7 shadow-lg"
                      onClick={clearImage}
                      aria-label={t("action.clear")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Dropzone
                    onFile={handleImage}
                    icon={<ImageIcon className="h-6 w-6 text-primary" />}
                    title={t("tool.color-palette.upload-hint")}
                    className="min-h-[160px]"
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("tool.color-palette.export-format")}
              </Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as Format)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`tool.color-palette.format.${f}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ToolActionBar
              primaryLabel={t("tool.color-palette.copy-all")}
              primaryIcon={<Copy className="h-4 w-4" />}
              onPrimary={copyAll}
              primaryDisabled={palette.length === 0}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleSave}
                disabled={palette.length === 0}
              >
                <Bookmark className="h-4 w-4" /> {t("tool.color-palette.save")}
              </Button>
            </ToolActionBar>
          </>
        }
      >
        {palette.length === 0 ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-xl border bg-muted/10">
            <ToolEmptyState
              icon={<ImageIcon className="h-6 w-6" />}
              title={t("tool.color-palette.upload-hint")}
            />
          </div>
        ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {palette.map((hex, i) => (
            <div
              key={i}
              className="group flex flex-col overflow-hidden rounded-xl border transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => copyColor(hex)}
                className="relative aspect-square w-full"
                style={{ background: hex }}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(i);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleLock(i);
                    }
                  }}
                  aria-label={locks[i] ? t("tool.color-palette.unlock") : t("tool.color-palette.lock")}
                  className={cn(
                    "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-opacity",
                    locks[i] ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  {locks[i] ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </span>
              </button>
              <div className="flex items-center justify-between gap-2 bg-card px-3 py-2">
                <span className="font-mono text-xs">{hex.toUpperCase()}</span>
                <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
        )}

        {saved.length > 0 && (
          <div className="mt-8 space-y-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("tool.color-palette.saved-title")}
            </Label>
            <div className="flex flex-col gap-2">
              {saved.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border p-2 hover:bg-accent/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => loadSaved(p.colors)}
                    className="flex flex-1 overflow-hidden rounded-md"
                  >
                    {p.colors.map((c, i) => (
                      <span key={i} className="h-8 flex-1" style={{ background: c }} />
                    ))}
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-destructive"
                    onClick={() => handleRemoveSaved(p.id)}
                    aria-label={t("tool.color-palette.remove-saved")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
