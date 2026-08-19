"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pipette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  hexToRgb,
  hsvToRgb,
  isValidHex,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  hslToHex,
} from "@/lib/color";

interface ColorPickerPanelProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

const HUE_TRACK =
  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";

export function ColorPickerPanel({ value, onChange, className }: ColorPickerPanelProps) {
  const [format, setFormat] = useState<"hex" | "rgb" | "hsl">("hex");
  const squareRef = useRef<HTMLDivElement>(null);

  const { r, g, b } = hexToRgb(value);
  const { h, s, v } = useMemo(() => rgbToHsv(r, g, b), [r, g, b]);

  const emit = (nh: number, ns: number, nv: number) => {
    const { r, g, b } = hsvToRgb(nh, ns, nv);
    onChange(rgbToHex(r, g, b));
  };

  const svFromPoint = (clientX: number, clientY: number) => {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    return { s: (x / rect.width) * 100, v: 100 - (y / rect.height) * 100 };
  };

  const handleSquarePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const sv = svFromPoint(e.clientX, e.clientY);
    if (sv) emit(h, sv.s, sv.v);

    const onMove = (ev: PointerEvent) => {
      const sv = svFromPoint(ev.clientX, ev.clientY);
      if (sv) emit(h, sv.s, sv.v);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-4">
        <div
          ref={squareRef}
          className="relative w-full aspect-[5/3] rounded-lg touch-none select-none cursor-crosshair overflow-hidden border"
          style={{
            backgroundColor: `hsl(${h}, 100%, 50%)`,
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          }}
          onPointerDown={handleSquarePointerDown}
        >
          <div
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/20 pointer-events-none"
            style={{ left: `${s}%`, top: `${100 - v}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <Slider
            value={[h]}
            min={0}
            max={360}
            step={1}
            onValueChange={([nh]) => emit(nh, s, v)}
            trackClassName="!bg-transparent"
            trackStyle={{ backgroundImage: HUE_TRACK }}
            className="flex-1"
          />
          <button
            type="button"
            title="System color picker"
            aria-label="Open system color picker"
            className="relative h-9 w-9 shrink-0 rounded-md border overflow-hidden flex items-center justify-center"
          >
            <Pipette className="h-4 w-4 pointer-events-none" />
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </button>
        </div>

        <Tabs value={format} onValueChange={(v) => setFormat(v as typeof format)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="hex">Hex</TabsTrigger>
            <TabsTrigger value="rgb">RGB</TabsTrigger>
            <TabsTrigger value="hsl">HSL</TabsTrigger>
          </TabsList>
          <TabsContent value="hex">
            <HexField hex={value} onCommit={onChange} />
          </TabsContent>
          <TabsContent value="rgb">
            <RgbFields r={r} g={g} b={b} onCommit={onChange} />
          </TabsContent>
          <TabsContent value="hsl">
            <HslFields hex={value} onCommit={onChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HexField({ hex, onCommit }: { hex: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(hex.toUpperCase());
  useEffect(() => setDraft(hex.toUpperCase()), [hex]);

  const commit = () => {
    const normalized = draft.startsWith("#") ? draft : `#${draft}`;
    if (isValidHex(normalized)) onCommit(normalized);
    else setDraft(hex.toUpperCase());
  };

  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="font-mono"
      maxLength={7}
    />
  );
}

function RgbFields({
  r,
  g,
  b,
  onCommit,
}: {
  r: number;
  g: number;
  b: number;
  onCommit: (hex: string) => void;
}) {
  const [draft, setDraft] = useState({ r, g, b });
  useEffect(() => setDraft({ r, g, b }), [r, g, b]);

  const commit = (next: { r: number; g: number; b: number }) => {
    setDraft(next);
    onCommit(rgbToHex(next.r, next.g, next.b));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {(["r", "g", "b"] as const).map((key) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-muted-foreground text-center">{key}</label>
          <Input
            type="number"
            min={0}
            max={255}
            value={draft[key]}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))
            }
            onBlur={() =>
              commit({
                ...draft,
                [key]: Math.max(0, Math.min(255, Math.round(draft[key] || 0))),
              })
            }
            className="font-mono text-center"
          />
        </div>
      ))}
    </div>
  );
}

function HslFields({ hex, onCommit }: { hex: string; onCommit: (hex: string) => void }) {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const [draft, setDraft] = useState({ h, s, l });
  useEffect(() => setDraft({ h, s, l }), [h, s, l]);

  const commit = (next: { h: number; s: number; l: number }) => {
    setDraft(next);
    onCommit(hslToHex(next.h, next.s, next.l));
  };

  const fields: { key: "h" | "s" | "l"; max: number }[] = [
    { key: "h", max: 360 },
    { key: "s", max: 100 },
    { key: "l", max: 100 },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {fields.map(({ key, max }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-[10px] uppercase text-muted-foreground text-center">{key}</label>
          <Input
            type="number"
            min={0}
            max={max}
            value={draft[key]}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))
            }
            onBlur={() =>
              commit({
                ...draft,
                [key]: Math.max(0, Math.min(max, Math.round(draft[key] || 0))),
              })
            }
            className="font-mono text-center"
          />
        </div>
      ))}
    </div>
  );
}
