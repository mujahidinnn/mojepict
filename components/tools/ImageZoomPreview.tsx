"use client";

import { ReactNode, useState } from "react";
import { Maximize, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const STEP = 0.25;

interface ImageZoomPreviewProps {
  /** The image/canvas/svg being previewed. */
  children: ReactNode;
  className?: string;
  /** Absolutely-positioned controls drawn above the zoomable content, for anything `onRemove` doesn't cover. */
  overlay?: ReactNode;
  /** Checkerboard background, for previewing transparent-background results. */
  checkered?: boolean;
  /** Renders the standard top-right "remove image" button when provided — one consistent look everywhere. */
  onRemove?: () => void;
  removeLabel?: string;
}

/**
 * Shared preview surface: opens fit-to-view (scale 1) and only changes size
 * via the explicit zoom in/out/reset controls — no implicit scroll-wheel or
 * drag-to-zoom, so the initial view is always predictable.
 */
export function ImageZoomPreview({
  children,
  className,
  overlay,
  checkered,
  onRemove,
  removeLabel = "Remove image",
}: ImageZoomPreviewProps) {
  const [scale, setScale] = useState(1);

  return (
    <div
      className={cn(
        "relative flex min-h-[360px] w-full flex-col overflow-hidden rounded-xl border bg-muted/10",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-auto p-4",
          checkered &&
            "bg-[linear-gradient(45deg,hsl(var(--muted))25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]",
        )}
      >
        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>

      {onRemove && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-3 right-3 h-8 w-8 shadow-lg"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      {overlay}

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - STEP).toFixed(2)))}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="w-10 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(2)))}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setScale(1)}
          disabled={scale === 1}
          aria-label="Reset zoom"
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
