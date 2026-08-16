"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Download, Loader2, PenTool, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function SvgTracerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);

      const { default: ImageTracer } = await import("imagetracerjs");
      ImageTracer.imageToSVG(
        dataUrl,
        (svgString: string) => {
          setSvgOutput(svgString);
          setIsProcessing(false);
          toast({
            title: t("common.success"),
            description: t("toast.success.processed"),
          });
        },
        { ltres: 1, qtres: 1, numberofcolors: 16, strokewidth: 1 },
      );
    };
    reader.readAsDataURL(file);
  };

  const downloadSvg = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mojepict-vector.svg";
    link.click();
    URL.revokeObjectURL(url);
    toast({ description: t("toast.success.downloaded") });
  };

  const handleReset = () => {
    setImagePreview(null);
    setSvgOutput(null);
  };

  return (
    <ToolShell
      title={t("tool.svg-tracer.name")}
      description={t("tool.svg-tracer.description")}
    >
      <ToolWorkspace
        sidebar={
          <ToolActionBar
            primaryLabel={t("tool.svg-tracer.download")}
            primaryIcon={<Download className="h-4 w-4" />}
            onPrimary={downloadSvg}
            primaryDisabled={!svgOutput}
            onReset={imagePreview ? handleReset : undefined}
          />
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Upload className="h-3 w-3" /> {t("common.input-image")}
            </Label>
            {imagePreview ? (
              <ImageZoomPreview onRemove={handleReset} removeLabel={t("action.clear")}>
                <Image
                  src={imagePreview}
                  alt="Original Image"
                  width={480}
                  height={480}
                  unoptimized
                  className="max-h-[320px] w-auto object-contain"
                />
              </ImageZoomPreview>
            ) : (
              <Dropzone
                onFile={handleFile}
                accept="image/png,image/jpeg"
                title={t("common.upload-click")}
                subtitle={t("common.upload-drag")}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <PenTool className="h-3 w-3" /> {t("tool.svg-tracer.result-label")}
            </Label>
            <ImageZoomPreview>
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground italic">
                    {t("tool.svg-tracer.processing")}
                  </p>
                </div>
              ) : svgOutput ? (
                <div
                  className="flex items-center justify-center [&_svg]:max-h-[320px] [&_svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : (
                <ToolEmptyState
                  icon={<PenTool className="h-6 w-6" />}
                  title={t("tool.svg-tracer.placeholder")}
                />
              )}
            </ImageZoomPreview>
          </div>
        </div>
      </ToolWorkspace>
    </ToolShell>
  );
}
