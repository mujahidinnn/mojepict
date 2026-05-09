"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  QrCode,
  Upload,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Loader2,
} from "lucide-react";
import jsQR from "jsqr";
import Image from "next/image";

export default function QRScannerPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processQRCode = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);

      const image = new window.Image();
      image.src = result;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);

        const imageData = context.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setScanResult(code.data);
          toast({
            title: t("common.success"),
            description: t("tool.qr-scanner.success"),
          });
        } else {
          setScanResult(null);
          toast({
            variant: "destructive",
            title: t("common.error"),
            description: t("tool.qr-scanner.not-found"),
          });
        }
        setIsProcessing(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processQRCode(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) processQRCode(file);
      }
    }
  }, []);

  const copyToClipboard = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult);
      toast({ description: t("toast.success.copied") });
    }
  };

  const isURL = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ToolShell
      title={t("tool.qr-scanner.name")}
      description={t("tool.qr-scanner.description")}
    >
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 outline-none"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Upload className="h-3 w-3" /> {t("tool.qr-scanner.input-label")}
          </Label>
          <Card className="relative border-dashed border-2 min-h-[400px] flex items-center justify-center overflow-hidden bg-muted/20">
            {imagePreview ? (
              <div className="relative w-full h-[400px] p-4 flex items-center justify-center">
                <Image
                  src={imagePreview}
                  alt="QR Preview"
                  fill
                  unoptimized
                  className="object-contain p-4"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 shadow-lg z-10"
                  onClick={() => {
                    setImagePreview(null);
                    setScanResult(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 group text-center w-full">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-lg">
                    {t("tool.qr-scanner.upload-title")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("tool.qr-scanner.upload-subtitle")}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                />
              </label>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Search className="h-3 w-3" /> {t("tool.qr-scanner.result-label")}
          </Label>
          <Card className="p-6 min-h-[400px] flex flex-col justify-between bg-muted/10 border-2">
            {scanResult ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-background border rounded-lg break-all font-mono text-sm shadow-inner min-h-[150px]">
                  {scanResult}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={copyToClipboard}
                    variant="secondary"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />{" "}
                    {t("tool.qr-scanner.copy-button")}
                  </Button>

                  {isURL(scanResult) && (
                    <Button asChild className="gap-2">
                      <a
                        href={scanResult}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />{" "}
                        {t("tool.qr-scanner.open-link")}
                      </a>
                    </Button>
                  )}
                </div>

                {scanResult.startsWith("WIFI:") && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-xs font-bold text-blue-400 uppercase">
                      {t("tool.qr-scanner.wifi-detected")}
                    </p>
                    <p className="text-sm mt-1">
                      {t("tool.qr-scanner.wifi-hint")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <QrCode className="h-16 w-16 mb-4" />
                <p>{t("tool.qr-scanner.placeholder")}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
