"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { ToolShell } from "@/components/tools/ToolShell";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { useI18n } from "@/lib/i18n/context";
import { Download } from "lucide-react";

const FORMATS = [
  "CODE128",
  "CODE39",
  "EAN13",
  "EAN8",
  "UPC",
  "ITF14",
  "MSI",
  "pharmacode",
  "codabar",
];

export default function BarcodeGeneratorPage() {
  const { t } = useI18n();
  const svgRef = useRef<SVGSVGElement>(null);
  const [value, setValue] = useState("123456789012");
  const [format, setFormat] = useState("CODE128");
  const [lineColor, setLineColor] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [displayValue, setDisplayValue] = useState(true);
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !value) {
      setError(true);
      return;
    }
    try {
      JsBarcode(svgRef.current, value, {
        format,
        lineColor,
        background,
        displayValue,
        width,
        height,
        margin: 16,
      });
      setError(false);
    } catch {
      setError(true);
    }
  }, [value, format, lineColor, background, displayValue, width, height]);

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "barcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPngBlob = (): Promise<Blob | null> => {
    if (!svgRef.current) return Promise.resolve(null);
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const rect = svgRef.current!.getBoundingClientRect();
        const canvas = document.createElement("canvas");
        canvas.width = img.width || rect.width;
        canvas.height = img.height || rect.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, "image/png");
      };
      img.src = url;
    });
  };

  const downloadPng = async () => {
    const blob = await getPngBlob();
    if (!blob) return;
    const pngUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "barcode.png";
    a.click();
    URL.revokeObjectURL(pngUrl);
  };

  return (
    <ToolShell
      title={t("tool.barcode-generator.name")}
      description={t("tool.barcode-generator.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t("tool.barcode-generator.format")}
              </Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.barcode-generator.lineColor")}
                </Label>
                <Input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="h-11 p-1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.barcode-generator.background")}
                </Label>
                <Input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="h-11 p-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.barcode-generator.barWidth")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("tool.barcode-generator.height")}
                </Label>
                <Input
                  type="number"
                  min={40}
                  max={300}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">{t("tool.barcode-generator.showText")}</Label>
              <Switch checked={displayValue} onCheckedChange={setDisplayValue} />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button className="w-full gap-2" onClick={downloadPng} disabled={error}>
                <Download className="h-4 w-4" /> PNG
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadSvg}
                disabled={error}
              >
                <Download className="h-4 w-4" /> SVG
              </Button>
              <CopyImageButton getBlob={getPngBlob} disabled={error} />
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              {t("tool.barcode-generator.value")}
            </Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={t("tool.barcode-generator.valuePlaceholder")}
              className="h-11 font-mono"
            />
          </div>

          <div className="flex min-h-[280px] items-center justify-center overflow-x-auto rounded-xl border bg-muted/10 p-6">
            {error ? (
              <p className="text-sm text-muted-foreground">
                {t("tool.barcode-generator.invalid")}
              </p>
            ) : (
              <svg ref={svgRef} />
            )}
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
