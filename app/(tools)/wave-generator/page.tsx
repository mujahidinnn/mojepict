"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Dices, Download, Plus, Trash2 } from "lucide-react";
import { generateWavePath, generateBlobPath } from "@/lib/svg-shapes";
import { downloadTextFile } from "@/lib/export-node";
import { rasterizeToPngBlob } from "@/lib/copy-image";

type Mode = "wave" | "blob";

interface WaveLayer {
  id: string;
  amplitude: number;
  frequency: number;
  baseline: number;
  opacity: number;
  color: string;
  flip: boolean;
}

const WAVE_W = 1200;
const WAVE_H = 320;
const BLOB_SIZE = 400;
const MAX_LAYERS = 4;

const DEFAULT_LAYERS: WaveLayer[] = [
  { id: "l1", amplitude: 24, frequency: 1.5, baseline: 55, opacity: 0.5, color: "#6366f1", flip: false },
  { id: "l2", amplitude: 32, frequency: 2, baseline: 70, opacity: 1, color: "#4338ca", flip: false },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WaveGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("wave");
  const [layers, setLayers] = useState<WaveLayer[]>(DEFAULT_LAYERS);

  const [blobPoints, setBlobPoints] = useState(8);
  const [blobIrregularity, setBlobIrregularity] = useState(25);
  const [blobSeed, setBlobSeed] = useState(1);
  const [blobColor, setBlobColor] = useState("#6366f1");

  const wavePaths = useMemo(
    () =>
      layers.map((l) => ({
        ...l,
        d: generateWavePath(WAVE_W, WAVE_H, {
          amplitude: l.amplitude,
          frequency: l.frequency,
          phase: 0,
          baseline: l.baseline / 100,
          flip: l.flip,
        }),
      })),
    [layers]
  );

  const blobPath = useMemo(
    () =>
      generateBlobPath(BLOB_SIZE, {
        points: blobPoints,
        irregularity: blobIrregularity / 100,
        seed: blobSeed,
      }),
    [blobPoints, blobIrregularity, blobSeed]
  );

  const updateLayer = (id: string, patch: Partial<WaveLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLayer = () => {
    if (layers.length >= MAX_LAYERS) return;
    setLayers((prev) => [
      ...prev,
      {
        id: `l${Date.now()}`,
        amplitude: 20 + Math.random() * 20,
        frequency: 1 + Math.random() * 2,
        baseline: 50 + Math.random() * 30,
        opacity: 0.6 + Math.random() * 0.4,
        color: "#818cf8",
        flip: false,
      },
    ]);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers((prev) => prev.filter((l) => l.id !== id));
  };

  const randomizeWave = () => {
    setLayers((prev) =>
      prev.map((l) => ({
        ...l,
        amplitude: Math.round(10 + Math.random() * 50),
        frequency: Math.round((1 + Math.random() * 3) * 10) / 10,
        baseline: Math.round(40 + Math.random() * 40),
        opacity: Math.round((0.4 + Math.random() * 0.6) * 100) / 100,
      }))
    );
  };

  const randomizeBlob = () => {
    setBlobSeed(Math.floor(Math.random() * 1_000_000));
  };

  const waveLoupePreview = (
    <svg
      viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      {wavePaths.map((l) => (
        <path key={l.id} d={l.d} fill={l.color} opacity={l.opacity} />
      ))}
    </svg>
  );

  const blobLoupePreview = (
    <svg viewBox={`0 0 ${BLOB_SIZE} ${BLOB_SIZE}`} className="h-full w-full">
      <path d={blobPath} fill={blobColor} />
    </svg>
  );

  const buildWaveSvg = () => {
    const paths = wavePaths
      .map((l) => `<path d="${l.d}" fill="${l.color}" opacity="${l.opacity}" />`)
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WAVE_W} ${WAVE_H}" preserveAspectRatio="none">${paths}</svg>`;
  };

  const buildBlobSvg = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BLOB_SIZE} ${BLOB_SIZE}"><path d="${blobPath}" fill="${blobColor}" /></svg>`;
  };

  const copySvg = () => {
    const svg = mode === "wave" ? buildWaveSvg() : buildBlobSvg();
    navigator.clipboard.writeText(svg);
    toast({ description: t("toast.success.copied") });
  };

  const downloadSvg = () => {
    const svg = mode === "wave" ? buildWaveSvg() : buildBlobSvg();
    downloadTextFile(svg, mode === "wave" ? "wave.svg" : "blob.svg", "image/svg+xml;charset=utf-8");
  };

  const downloadPng = async () => {
    try {
      const svg = mode === "wave" ? buildWaveSvg() : buildBlobSvg();
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const blob = await rasterizeToPngBlob(dataUrl);
      downloadBlob(blob, mode === "wave" ? "wave.png" : "blob.png");
    } catch {
      toast({ variant: "destructive", description: t("toast.error.generic") });
    }
  };

  return (
    <ToolShell
      title={t("tool.wave-generator.name")}
      description={t("tool.wave-generator.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wave">{t("tool.wave-generator.mode.wave")}</TabsTrigger>
                <TabsTrigger value="blob">{t("tool.wave-generator.mode.blob")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "wave" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.wave-generator.layers")}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={randomizeWave}
                      title={t("tool.wave-generator.randomize")}
                    >
                      <Dices className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={addLayer}
                      disabled={layers.length >= MAX_LAYERS}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {layers.map((layer) => (
                    <div key={layer.id} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={layer.color}
                          onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                          className="h-8 w-8 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
                        />
                        <span className="flex-1 font-mono text-xs uppercase text-muted-foreground">
                          {layer.color}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeLayer(layer.id)}
                          disabled={layers.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            {t("tool.wave-generator.amplitude")}
                          </Label>
                          <span className="text-xs tabular-nums">{layer.amplitude}</span>
                        </div>
                        <Slider
                          value={[layer.amplitude]}
                          min={2}
                          max={80}
                          step={1}
                          onValueChange={([v]) => updateLayer(layer.id, { amplitude: v })}
                          previewContent={waveLoupePreview}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            {t("tool.wave-generator.frequency")}
                          </Label>
                          <span className="text-xs tabular-nums">{layer.frequency}</span>
                        </div>
                        <Slider
                          value={[layer.frequency]}
                          min={0.5}
                          max={5}
                          step={0.1}
                          onValueChange={([v]) => updateLayer(layer.id, { frequency: v })}
                          previewContent={waveLoupePreview}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            {t("tool.wave-generator.baseline")}
                          </Label>
                          <span className="text-xs tabular-nums">{layer.baseline}%</span>
                        </div>
                        <Slider
                          value={[layer.baseline]}
                          min={10}
                          max={95}
                          step={1}
                          onValueChange={([v]) => updateLayer(layer.id, { baseline: v })}
                          previewContent={waveLoupePreview}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            {t("tool.wave-generator.opacity")}
                          </Label>
                          <span className="text-xs tabular-nums">{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[layer.opacity * 100]}
                          min={10}
                          max={100}
                          step={5}
                          onValueChange={([v]) => updateLayer(layer.id, { opacity: v / 100 })}
                          previewContent={waveLoupePreview}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-xs text-muted-foreground">
                          {t("tool.wave-generator.flip")}
                        </Label>
                        <Switch
                          checked={layer.flip}
                          onCheckedChange={(checked) => updateLayer(layer.id, { flip: checked })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("tool.wave-generator.color")}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={randomizeBlob}
                    title={t("tool.wave-generator.randomize")}
                  >
                    <Dices className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <input
                  type="color"
                  value={blobColor}
                  onChange={(e) => setBlobColor(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-md border bg-transparent p-0.5"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {t("tool.wave-generator.points")}
                    </Label>
                    <span className="text-xs tabular-nums">{blobPoints}</span>
                  </div>
                  <Slider
                    value={[blobPoints]}
                    min={5}
                    max={14}
                    step={1}
                    onValueChange={([v]) => setBlobPoints(v)}
                    previewContent={blobLoupePreview}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {t("tool.wave-generator.irregularity")}
                    </Label>
                    <span className="text-xs tabular-nums">{blobIrregularity}%</span>
                  </div>
                  <Slider
                    value={[blobIrregularity]}
                    min={5}
                    max={45}
                    step={1}
                    onValueChange={([v]) => setBlobIrregularity(v)}
                    previewContent={blobLoupePreview}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button type="button" onClick={copySvg} variant="outline" className="w-full gap-2">
                <Copy className="h-4 w-4" /> {t("action.copy")}
              </Button>
              <Button type="button" onClick={downloadSvg} className="w-full gap-2">
                <Download className="h-4 w-4" /> {t("tool.wave-generator.downloadSvg")}
              </Button>
              <Button type="button" onClick={downloadPng} variant="secondary" className="w-full gap-2">
                <Download className="h-4 w-4" /> {t("tool.wave-generator.downloadPng")}
              </Button>
            </div>
          </>
        }
      >
        {mode === "wave" ? (
          <div className="relative w-full overflow-hidden rounded-xl border bg-muted/20">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-3 z-10 h-9 w-9 shadow"
              onClick={randomizeWave}
              title={t("tool.wave-generator.randomize")}
            >
              <Dices className="h-4 w-4" />
            </Button>
            <svg
              viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
              preserveAspectRatio="none"
              className="h-64 w-full sm:h-80"
            >
              {wavePaths.map((l) => (
                <path key={l.id} d={l.d} fill={l.color} opacity={l.opacity} />
              ))}
            </svg>
          </div>
        ) : (
          <div className="relative flex min-h-[400px] w-full items-center justify-center rounded-xl border bg-muted/20">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-3 z-10 h-9 w-9 shadow"
              onClick={randomizeBlob}
              title={t("tool.wave-generator.randomize")}
            >
              <Dices className="h-4 w-4" />
            </Button>
            <div className="relative h-72 w-72">
              <svg viewBox={`0 0 ${BLOB_SIZE} ${BLOB_SIZE}`} className="h-full w-full">
                <path d={blobPath} fill={blobColor} />
              </svg>
            </div>
          </div>
        )}
      </ToolWorkspace>
    </ToolShell>
  );
}
