"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Maximize, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const STEP = 0.25;

interface ImageZoomPreviewProps {
  /** The image/canvas/svg being previewed. */
  children: ReactNode;
  className?: string;
  /** Absolutely-positioned controls drawn above the zoomable content, for anything `onRemove` doesn't cover. */
  overlay?: ReactNode;
  /** Checkerboard background, for previewing transparent-background results. */
  checkered?: boolean;
  /** Renders the standard top-right "remove image" button when provided, for one consistent look everywhere. */
  onRemove?: () => void;
  removeLabel?: string;
}

/**
 * Shared preview surface: opens fit-to-view and only changes size via
 * explicit zoom actions (buttons, Ctrl/Cmd + Plus/Minus/0, or Ctrl/Cmd +
 * scroll / trackpad pinch) - never a bare scroll or drag, so the box never
 * zooms by accident while the user is just scrolling the page. The fit
 * scale is measured against the content's actual natural size (via
 * ResizeObserver), not assumed to be 100% - individual tool pages render
 * children at wildly different native sizes (full resolution canvases,
 * fixed-px overlays, etc.), and a naive scale(1) baseline left the edges of
 * anything bigger than the box permanently clipped (flex-centered overflow
 * can't scroll into negative offset).
 */
export function ImageZoomPreview({
  children,
  className,
  overlay,
  checkered,
  onRemove,
  removeLabel = "Remove image",
}: ImageZoomPreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const isActiveRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isActiveRef.current || !(e.ctrlKey || e.metaKey)) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const recompute = () => {
      const style = getComputedStyle(viewport);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const availableW = viewport.clientWidth - paddingX;
      const availableH = viewport.clientHeight - paddingY;
      const contentW = content.offsetWidth;
      const contentH = content.offsetHeight;
      if (!contentW || !contentH || availableW <= 0 || availableH <= 0) return;
      const next = Math.min(1, availableW / contentW, availableH / contentH);
      setFitScale(Number.isFinite(next) && next > 0 ? next : 1);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(viewport);
    ro.observe(content);
    return () => ro.disconnect();
  }, [children]);

  const effectiveScale = fitScale * zoom;

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -STEP : STEP;
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));
  }

  return (
    <div
      className={cn(
        "relative flex min-h-[360px] w-full flex-col overflow-hidden rounded-xl border bg-muted/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      tabIndex={0}
      role="group"
      aria-label="Image preview. Use Ctrl or Cmd plus Plus, Minus, 0, or scroll to zoom."
      onMouseEnter={() => {
        isActiveRef.current = true;
      }}
      onMouseLeave={() => {
        isActiveRef.current = false;
      }}
      onFocus={() => {
        isActiveRef.current = true;
      }}
      onBlur={() => {
        isActiveRef.current = false;
      }}
    >
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-auto p-4",
          checkered &&
            "bg-[linear-gradient(45deg,hsl(var(--muted))25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]",
        )}
      >
        <div
          ref={contentRef}
          className="transition-transform duration-150 ease-out"
          style={{ transform: `scale(${effectiveScale})` }}
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
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out (Ctrl/Cmd + -)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="w-10 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in (Ctrl/Cmd + +)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setZoom(1)}
          disabled={zoom === 1}
          aria-label="Reset zoom"
          title="Reset zoom (Ctrl/Cmd + 0)"
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
