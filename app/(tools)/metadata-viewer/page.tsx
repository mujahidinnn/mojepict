"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { Copy, Download, Info, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function MetadataViewerPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setImageFile(URL.createObjectURL(file));
    try {
      const exifr = await import("exifr");
      const result = await exifr.parse(file);
      setMetadata(result || null);
      if (!result) {
        toast({
          variant: "destructive",
          description: t("state.empty") || "No metadata found.",
        });
      }
    } catch (err) {
      console.error("Failed to read metadata", err);
      setMetadata(null);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("toast.error.generic"),
      });
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setImageFile(null);
    setMetadata(null);
    toast({ description: t("tool.image-draw.reset-msg") });
  };

  const handleCopy = () => {
    if (!metadata) return;
    const text = JSON.stringify(metadata, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      toast({ description: t("toast.success.copied") });
    });
  };

  const handleDownload = () => {
    if (!metadata) return;
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName.split(".")[0]}-metadata.json`;
    link.click();
    toast({
      title: t("common.success"),
      description: t("toast.success.downloaded"),
    });
  };

  return (
    <ToolShell
      title={t("tool.metadata-viewer.name") || "Metadata Viewer"}
      description={
        t("tool.metadata-viewer.description") ||
        "View EXIF data and hidden metadata from your images."
      }
    >
      {!imageFile ? (
        <Dropzone
          onFile={processFile}
          title={t("common.upload-click")}
          subtitle={t("common.upload-drag")}
        />
      ) : (
        <ToolWorkspace
          sidebar={
            <>
              <div className="space-y-2">
                <ImageZoomPreview className="min-h-[200px]">
                  <Image
                    src={imageFile}
                    alt="Preview"
                    width={320}
                    height={320}
                    unoptimized
                    className="max-h-[200px] w-auto object-contain"
                  />
                </ImageZoomPreview>
                <p className="truncate text-center text-xs text-muted-foreground">
                  {fileName}
                </p>
              </div>

              <ToolActionBar
                primaryLabel={t("action.download")}
                primaryIcon={<Download className="h-4 w-4" />}
                onPrimary={handleDownload}
                primaryDisabled={!metadata}
                onReset={handleReset}
              >
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleCopy}
                  disabled={!metadata}
                >
                  <Copy className="h-4 w-4" /> {t("action.copy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => inputRef.current?.click()}
                >
                  <RotateCcw className="h-4 w-4" /> {t("tool.image-draw.change")}
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelectFile}
                />
              </ToolActionBar>
            </>
          }
        >
          <div className="flex flex-col rounded-xl border bg-muted/10">
            <div className="flex items-center gap-2 border-b bg-muted/20 px-4 py-3">
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Metadata</span>
            </div>
            <div className="max-h-[500px] overflow-auto">
              {metadata ? (
                <div className="divide-y text-sm">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row p-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-semibold text-muted-foreground sm:w-1/3 shrink-0 uppercase text-[10px] tracking-wider mb-1 sm:mb-0">
                        {key}
                      </span>
                      <span className="sm:w-2/3 break-all font-mono text-[13px]">
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-20">
                  <ToolEmptyState
                    icon={<Info className="h-6 w-6" />}
                    title={t("state.empty") || "No metadata found."}
                  />
                </div>
              )}
            </div>
          </div>
        </ToolWorkspace>
      )}
    </ToolShell>
  );
}
