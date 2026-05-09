"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import ImageTracer from "imagetracerjs";
import { Download, Loader2, PenTool, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function SvgTracerPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [svgOutput, setSvgOutput] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);

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

  return (
    <ToolShell
      title={t("tool.svg-tracer.name")}
      description={t("tool.svg-tracer.description")}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Upload className="h-3 w-3" /> {t("tool.remove-bg.input-label")}
          </Label>
          <Card className="relative border-dashed border-2 min-h-[400px] flex items-center justify-center bg-muted/20 overflow-hidden">
            {imagePreview ? (
              <div className="relative w-full h-[400px] p-4 flex flex-col items-center justify-center">
                <Image
                  src={imagePreview}
                  alt="Original Image"
                  fill
                  unoptimized
                  className="object-contain p-4"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => {
                    setImagePreview(null);
                    setSvgOutput(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center w-full group">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="font-medium">{t("common.upload-click")}</p>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg"
                  onChange={handleUpload}
                />
              </label>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <PenTool className="h-3 w-3" /> {t("tool.remove-bg.result-label")}
          </Label>
          <Card className="relative border-2 min-h-[400px] flex items-center justify-center bg-muted/20 overflow-hidden shadow-inner p-4">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground italic">
                  {t("tool.svg-tracer.processing")}
                </p>
              </div>
            ) : svgOutput ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div
                  className="w-full h-full min-h-[300px] flex items-center justify-center overflow-auto"
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
                <Button
                  className="mt-4 gap-2 w-full sm:w-auto"
                  onClick={downloadSvg}
                >
                  <Download className="h-4 w-4" />{" "}
                  {t("tool.svg-tracer.download")}
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                {t("tool.remove-bg.placeholder")}
              </p>
            )}
          </Card>
        </div>
      </div>
    </ToolShell>
  );
}
