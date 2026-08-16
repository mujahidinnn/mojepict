"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QrCode, Copy, ExternalLink, Search, Loader2 } from "lucide-react";
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
      image.onload = async () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);

        const imageData = context.getImageData(0, 0, image.width, image.height);
        const { default: jsQR } = await import("jsqr");
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

  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
  };

  return (
    <ToolShell
      title={t("tool.qr-scanner.name")}
      description={t("tool.qr-scanner.description")}
    >
      <div className="outline-none" onPaste={handlePaste} tabIndex={0}>
        <ToolWorkspace
          sidebar={
            <ToolActionBar onReset={imagePreview ? handleReset : undefined}>
              <Button
                onClick={copyToClipboard}
                variant="secondary"
                className="w-full gap-2"
                disabled={!scanResult}
              >
                <Copy className="h-4 w-4" /> {t("tool.qr-scanner.copy-button")}
              </Button>

              {scanResult && isURL(scanResult) && (
                <Button asChild className="w-full gap-2">
                  <a href={scanResult} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />{" "}
                    {t("tool.qr-scanner.open-link")}
                  </a>
                </Button>
              )}
            </ToolActionBar>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <QrCode className="h-3 w-3" /> {t("common.input-image")}
              </Label>
              {imagePreview ? (
                <ImageZoomPreview onRemove={handleReset} removeLabel={t("action.clear")}>
                  {isProcessing && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  <Image
                    src={imagePreview}
                    alt="QR Preview"
                    width={480}
                    height={480}
                    unoptimized
                    className="max-h-[320px] w-auto object-contain"
                  />
                </ImageZoomPreview>
              ) : (
                <Dropzone
                  onFile={processQRCode}
                  icon={<QrCode className="h-6 w-6 text-primary" />}
                  title={t("tool.qr-scanner.upload-title")}
                  subtitle={t("tool.qr-scanner.upload-subtitle")}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Search className="h-3 w-3" /> {t("tool.qr-scanner.result-label")}
              </Label>
              <div className="flex min-h-[360px] flex-col justify-between rounded-xl border bg-muted/10 p-6">
                {scanResult ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="p-4 bg-background border rounded-lg break-all font-mono text-sm shadow-inner min-h-[150px]">
                      {scanResult}
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
                  <div className="flex-1 flex items-center justify-center">
                    <ToolEmptyState
                      icon={<QrCode className="h-6 w-6" />}
                      title={t("tool.qr-scanner.placeholder")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ToolWorkspace>
      </div>
    </ToolShell>
  );
}
