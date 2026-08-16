"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import {
  ProcessingMode,
  ProcessingModeToggle,
} from "@/components/tools/ProcessingModeToggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Upload, ImageIcon, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

export default function RemoveBgPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [mode, setMode] = useState<ProcessingMode>("local");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (file: File) => {
    if (inputImage) URL.revokeObjectURL(inputImage);
    setInputFile(file);
    setInputImage(URL.createObjectURL(file));
    setOutputImage(null);
    setProgress(0);
  };

  const processLocal = async () => {
    if (!inputImage) return;
    setProgress(1);

    const imgly = await import("@imgly/background-removal");
    const removeFn = (imgly.default ||
      (imgly as any).removeBackground) as any;
    const env = (imgly as any).env;
    if (env) env.wasm.numThreads = 1;

    const blob = await removeFn(inputImage, {
      debug: true,
      model: "isnet_fp16",
      progress: (_key: string, current: number, total: number) => {
        if (total > 0) {
          const p = Math.round((current / total) * 100);
          setProgress((prev) => Math.max(prev, p));
        } else {
          setProgress((prev) => (prev < 90 ? prev + 1 : prev));
        }
      },
    });

    return URL.createObjectURL(blob);
  };

  const processAi = async () => {
    if (!inputFile) return;
    setProgress(50);
    const form = new FormData();
    form.append("image", inputFile);

    const res = await fetch("/api/remove-bg", { method: "POST", body: form });

    if (res.status === 503) {
      toast({
        variant: "destructive",
        description: t("common.mode.ai.notConfigured"),
      });
      setMode("local");
      return processLocal();
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message ?? t("toast.error.failed"));
    }

    const blob = await res.blob();
    setProgress(100);
    return URL.createObjectURL(blob);
  };

  const processImage = async () => {
    if (!inputImage) return;
    setIsProcessing(true);
    setProgress(1);

    try {
      const url = mode === "ai" ? await processAi() : await processLocal();
      if (!url) return;
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

  const handleReset = () => {
    if (inputImage) URL.revokeObjectURL(inputImage);
    setInputFile(null);
    setInputImage(null);
    setOutputImage(null);
    setProgress(0);
  };

  return (
    <ToolShell
      title={t("tool.remove-bg.name")}
      description={t("tool.remove-bg.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <ProcessingModeToggle mode={mode} onChange={setMode} />
            <ToolActionBar
              primaryLabel={t("tool.remove-bg.name")}
              primaryIcon={<Sparkles className="h-4 w-4" />}
              onPrimary={processImage}
              primaryDisabled={!inputImage || isProcessing}
              onReset={inputImage ? handleReset : undefined}
            >
              {outputImage && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
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
              )}
            </ToolActionBar>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Upload className="h-3 w-3" /> {t("common.input-image")}
            </Label>
            {inputImage ? (
              <ImageZoomPreview onRemove={handleReset} removeLabel={t("action.clear")}>
                <Image
                  src={inputImage}
                  alt="Original"
                  width={480}
                  height={480}
                  unoptimized
                  className="max-h-[320px] w-auto object-contain"
                />
              </ImageZoomPreview>
            ) : (
              <Dropzone
                onFile={handleFile}
                title={t("tool.remove-bg.upload-hint") || "Upload Image"}
                subtitle={t("tool.remove-bg.format-hint")}
                className="min-h-[360px]"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3" />{" "}
              {t("tool.remove-bg.result-label") || "RESULT"}
            </Label>
            <ImageZoomPreview checkered>
              {isProcessing && (
                <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-md">
                  <Loader2 className="h-10 w-10 animate-spin mb-2" />
                  <span className="text-xl font-bold">{progress}%</span>
                  <p className="text-xs opacity-70">
                    {mode === "ai"
                      ? t("tool.remove-bg.processing.ai")
                      : progress < 100
                        ? t("tool.remove-bg.processing")
                        : t("tool.remove-bg.finalizing")}
                  </p>
                </div>
              )}

              {outputImage ? (
                <Image
                  src={outputImage}
                  alt="Result"
                  width={480}
                  height={480}
                  unoptimized
                  className="max-h-[320px] w-auto object-contain animate-in fade-in zoom-in duration-300"
                />
              ) : (
                <ToolEmptyState
                  icon={<ImageIcon className="h-6 w-6" />}
                  title={t("tool.remove-bg.placeholder")}
                />
              )}
            </ImageZoomPreview>
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
