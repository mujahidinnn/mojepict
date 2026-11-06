"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormGroup } from "@/components/tools/ToolTemplates";
import { useI18n } from "@/lib/i18n/context";
import { Download, Eraser } from "lucide-react";

const W = 800;
const H = 300;

export default function SignatureMaker() {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const bounds = useRef({ x0: W, y0: H, x1: 0, y1: 0 });
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(3);
  const [empty, setEmpty] = useState(true);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
  };
  const ctx = () => {
    const c = canvas.current!.getContext("2d")!;
    c.lineCap = c.lineJoin = "round";
    c.strokeStyle = color;
    c.lineWidth = size;
    return c;
  };
  const grow = (x: number, y: number) => {
    const b = bounds.current;
    const p = size / 2 + 1;
    b.x0 = Math.min(b.x0, x - p); b.y0 = Math.min(b.y0, y - p);
    b.x1 = Math.max(b.x1, x + p); b.y1 = Math.max(b.y1, y + p);
  };

  const down = (e: React.PointerEvent) => {
    canvas.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    const c = ctx();
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 0.01, y); // a tap leaves a dot
    c.stroke();
    grow(x, y);
    setEmpty(false);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const c = ctx();
    c.lineTo(x, y);
    c.stroke();
    grow(x, y);
  };
  const up = () => (drawing.current = false);

  const clear = () => {
    canvas.current!.getContext("2d")!.clearRect(0, 0, W, H);
    bounds.current = { x0: W, y0: H, x1: 0, y1: 0 };
    setEmpty(true);
  };

  // Crop to the ink so the PNG drops cleanly onto a document.
  const download = () => {
    const { x0, y0, x1, y1 } = bounds.current;
    const x = Math.max(0, x0), y = Math.max(0, y0);
    const w = Math.min(W, x1) - x, h = Math.min(H, y1) - y;
    const out = document.createElement("canvas");
    out.width = w; out.height = h;
    out.getContext("2d")!.drawImage(canvas.current!, x, y, w, h, 0, 0, w, h);
    out.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "signature.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    // Stops touch scrolling while signing (React's onTouchMove is passive).
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  return (
    <div className="max-w-screen-lg flex flex-col gap-6">
      <canvas
        ref={canvas}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label={t("tool.signature-maker.name")}
        className="w-full touch-none cursor-crosshair rounded-lg border bg-white"
        style={{ aspectRatio: `${W}/${H}` }}
      />
      <div className="flex flex-wrap items-end gap-6">
        <FormGroup label={t("tool.signature-maker.color")}>
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 p-1" />
        </FormGroup>
        <FormGroup label={t("tool.signature-maker.thickness")}>
          <input type="range" min={1} max={10} value={size} onChange={(e) => setSize(+e.target.value)} className="w-40" />
        </FormGroup>
        <Button variant="outline" onClick={clear} disabled={empty}>
          <Eraser className="h-4 w-4 mr-2" />
          {t("action.clear")}
        </Button>
        <Button onClick={download} disabled={empty}>
          <Download className="h-4 w-4 mr-2" />
          {t("tool.signature-maker.download")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("tool.signature-maker.hint")}</p>
    </div>
  );
}
