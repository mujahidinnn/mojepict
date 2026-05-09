"use client";

import { ToolShell } from "@/components/tools/ToolShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import * as exifr from "exifr";
import {
  Copy,
  Download,
  ImageIcon,
  Info,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function MetadataViewerPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setImageFile(URL.createObjectURL(file));
    try {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setImageFile(null);
    setMetadata(null);
    setConfirmClear(false);
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
    <>
      <ToolShell
        title={t("tool.metadata-viewer.name") || "Metadata Viewer"}
        description={
          t("tool.metadata-viewer.description") ||
          "View EXIF data and hidden metadata from your images."
        }
      >
        <div className="grid grid-cols-1 gap-6">
          {!imageFile ? (
            <Card
              className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors group"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelectFile}
                  ref={inputRef}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">{t("common.upload-click")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("common.upload-drag")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 animate-in fade-in slide-in-from-bottom-4">
              <Card className="h-fit">
                <CardHeader className="py-4 border-b bg-muted/20">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border shadow-inner">
                    <Image
                      src={imageFile}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="w-full text-center">
                    <p className="text-sm font-medium truncate max-w-full">
                      {fileName}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader className="py-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" /> Metadata
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      disabled={!metadata}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> {t("action.copy")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={!metadata}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />{" "}
                      {t("action.download")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[500px] overflow-auto">
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
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic">
                      <Info className="h-8 w-8 mb-2 opacity-20" />
                      <p>{t("state.empty") || "No metadata found."}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {imageFile && (
            <div className="flex justify-center gap-4 pt-4">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 className="h-4 w-4" /> {t("action.reset")}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="gap-2"
                onClick={() => inputRef.current?.click()}
              >
                <RotateCcw className="h-4 w-4" /> {t("tool.image-draw.change")}
              </Button>
            </div>
          )}
        </div>
      </ToolShell>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.confirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("action.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
