"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFile: (file: File) => void;
  accept?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  multiple?: boolean;
}

/**
 * Shared upload control: click-to-browse + real drag-and-drop, one
 * consistent min-height/border treatment across every tool.
 */
export function Dropzone({
  onFile,
  accept = "image/*",
  title,
  subtitle,
  icon,
  className,
  multiple = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
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
        "flex min-h-[360px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/10 p-8 text-center transition-colors outline-none",
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
        onChange={(e) => handleFiles(e.target.files)}
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
