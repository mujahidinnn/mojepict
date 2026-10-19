"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/hooks/use-toast";

interface DropzoneProps {
  onFile?: (file: File) => void;
  /** When set alongside multiple, receives every selected/dropped file instead of just the first. */
  onFiles?: (files: File[]) => void;
  accept?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  multiple?: boolean;
}

/** Matches a file against an <input accept> string (MIME, MIME wildcard, or .ext). */
function matchesAccept(file: File, accept: string) {
  const tokens = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0 || tokens.includes("*") || tokens.includes("*/*")) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((tok) =>
    tok.startsWith(".")
      ? name.endsWith(tok)
      : tok.endsWith("/*")
        ? type.startsWith(tok.slice(0, -1))
        : type === tok,
  );
}

/**
 * Shared upload control: click-to-browse + real drag-and-drop, one
 * consistent min-height/border treatment across every tool.
 */
export function Dropzone({
  onFile,
  onFiles,
  accept = "image/*",
  title,
  subtitle,
  icon,
  className,
  multiple = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { t } = useI18n();
  const { toast } = useToast();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const all = Array.from(files);
      const accepted = all.filter((f) => matchesAccept(f, accept));
      if (accepted.length < all.length) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("media.dropzone.rejected"),
        });
      }
      if (accepted.length === 0) return;
      if (multiple && onFiles) {
        onFiles(accepted);
        return;
      }
      onFile?.(accepted[0]);
    },
    [onFile, onFiles, multiple, accept, toast, t],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex min-h-96 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/10 p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/30 hover:bg-muted/20",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        {icon ?? <Upload className="h-6 w-6 text-primary" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
