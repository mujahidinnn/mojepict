"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  QrCode,
  Trash2,
  Type,
  Palette,
  Maximize,
  ImageIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const QRCodeCanvas = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeCanvas),
  { ssr: false },
);

export default function QrGeneratorPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(256);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(60);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "mojepict-qr-code.png";
    a.click();
    toast({
      title: t("common.success"),
      description: t("toast.success.downloaded"),
    });
  };

  const getQrBlob = (): Promise<Blob | null> => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return Promise.resolve(null);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  };

  return (
    <ToolShell
      title={t("tool.qr-generator.name") || "QR Code Generator"}
      description={
        t("tool.qr-generator.description") ||
        "Generate custom QR codes with logos and colors instantly."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Type className="h-3.5 w-3.5" />{" "}
                {t("tool.qr-generator.input-label") || "Text or Link"}
              </Label>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  t("tool.qr-generator.placeholder") || "https://mojepict.com"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5" />{" "}
                  {t("tool.qr-generator.qr-color") || "QR Color"}
                </Label>
                <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] font-mono uppercase">
                    {qrColor}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5" />{" "}
                  {t("tool.qr-generator.bg-color") || "Background"}
                </Label>
                <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] font-mono uppercase">
                    {bgColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Maximize className="h-3.5 w-3.5" />{" "}
                  {t("tool.qr-generator.size") || "QR Size"}
                </Label>
                <span className="text-xs font-mono">{size}px</span>
              </div>
              <Slider
                value={[size]}
                min={128}
                max={1024}
                step={16}
                onValueChange={(val: number[]) => setSize(val[0])}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5" />{" "}
                {t("tool.qr-generator.logo-label") || "Logo (Optional)"}
              </Label>
              <div className="flex flex-col gap-3">
                <Dropzone
                  onFile={handleLogoUpload}
                  title={logo ? "Change Logo" : "Upload Logo"}
                  className="min-h-[100px] p-4"
                />

                {logo && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between">
                      <Label className="text-xs">Logo Size</Label>
                      <span className="text-xs font-mono">{logoSize}px</span>
                    </div>
                    <Slider
                      value={[logoSize]}
                      min={20}
                      max={size / 3}
                      onValueChange={(val: number[]) => setLogoSize(val[0])}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 gap-1 text-xs text-destructive"
                      onClick={() => setLogo(null)}
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("common.remove-logo")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleDownload}
              primaryDisabled={!text}
            >
              <CopyImageButton getBlob={getQrBlob} disabled={!text} />
              <p className="text-[10px] text-center text-muted-foreground px-4">
                {t("tool.qr-generator.footer") ||
                  "High-quality PNG output with optional logo integration."}
              </p>
            </ToolActionBar>
          </>
        }
      >
        <ImageZoomPreview>
          {text ? (
            <div className="p-4 border shadow-sm rounded-lg bg-white">
              <QRCodeCanvas
                value={text}
                size={size}
                fgColor={qrColor}
                bgColor={bgColor}
                level="H"
                imageSettings={
                  logo
                    ? {
                        src: logo,
                        x: undefined,
                        y: undefined,
                        height: logoSize,
                        width: logoSize,
                        excavate: true,
                      }
                    : undefined
                }
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          ) : (
            <ToolEmptyState
              icon={<QrCode className="h-6 w-6" />}
              title={t("tool.qr-generator.empty")}
            />
          )}
        </ImageZoomPreview>
      </ToolWorkspace>
    </ToolShell>
  );
}
