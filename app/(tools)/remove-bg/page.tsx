"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Download,
  Upload,
  Trash2,
  ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export default function RemoveBgPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputImage) URL.revokeObjectURL(inputImage);
    setInputImage(URL.createObjectURL(file));
    setOutputImage(null);
    setProgress(0);
  };

  const processImage = async () => {
    if (!inputImage) return;
    setIsProcessing(true);
    setProgress(1);

    try {
      const imgly = await import("@imgly/background-removal");

      const removeFn = (imgly.default ||
        (imgly as any).removeBackground) as any;
      const env = (imgly as any).env;

      if (env) {
        env.wasm.numThreads = 1;
      }

      const blob = await removeFn(inputImage, {
        debug: true,
        model: "isnet_fp16",
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const p = Math.round((current / total) * 100);
            setProgress((prev) => Math.max(prev, p));
          } else {
            setProgress((prev) => (prev < 90 ? prev + 1 : prev));
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setOutputImage(url);
      setProgress(100);
      toast({
        title: t("common.success"),
        description: t("toast.success.processed"),
      });
    } catch (error) {
      console.error("Remove BG Error:", error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.failed"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolShell
      title={t("tool.remove-bg.name")}
      description={t("tool.remove-bg.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Upload className="h-3 w-3" />{" "}
            {t("tool.remove-bg.input-label") || "INPUT IMAGE"}
          </Label>
          <Card className="relative border-dashed border-2 min-h-[400px] flex items-center justify-center overflow-hidden bg-muted/20">
            {inputImage ? (
              <div className="relative w-full h-[400px] p-4">
                <Image
                  src={inputImage}
                  alt="Original"
                  fill
                  unoptimized
                  className="object-contain"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 shadow-lg"
                  onClick={() => setInputImage(null)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 group">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">
                  {t("tool.remove-bg.upload-hint") || "Upload Image"}
                </p>
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
            <Sparkles className="h-3 w-3" />{" "}
            {t("tool.remove-bg.result-label") || "RESULT"}
          </Label>
          <Card className="relative min-h-[400px] flex items-center justify-center overflow-hidden bg-muted/20 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]">
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-md">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <span className="text-xl font-bold">{progress}%</span>
                <p className="text-xs opacity-70">
                  {progress < 100
                    ? t("tool.remove-bg.processing")
                    : t("tool.remove-bg.finalizing")}
                </p>
              </div>
            )}

            {outputImage ? (
              <div className="relative w-full h-[400px] p-4 animate-in fade-in zoom-in duration-300">
                <Image
                  src={outputImage}
                  alt="Result"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted" />
                <Button
                  disabled={!inputImage || isProcessing}
                  onClick={processImage}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" /> {t("tool.remove-bg.name")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {outputImage && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => {
              const a = document.createElement("a");
              a.href = outputImage;
              a.download = "mojepict-removed.png";
              a.click();
            }}
          >
            <Download className="h-4 w-4" />{" "}
            {t("tool.remove-bg.download-button") || "Download Image"}
          </Button>
        </div>
      )}
    </ToolShell>
  );
}
