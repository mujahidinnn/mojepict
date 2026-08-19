"use client";

import { CSSProperties, ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Download, Image as ImageIcon } from "lucide-react";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Dropzone } from "@/components/tools/Dropzone";
import { ImageZoomPreview } from "@/components/tools/ImageZoomPreview";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { CopyImageButton } from "@/components/tools/CopyImageButton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

const DEVICES = [
  { id: "iphone", label: "Phone (iOS)" },
  { id: "android", label: "Phone (Android)" },
  { id: "tablet", label: "Tablet" },
  { id: "laptop", label: "Laptop" },
  { id: "browser", label: "Browser Window" },
  { id: "monitor", label: "Desktop Monitor" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

const LAYOUTS = [
  { id: "single", label: "Single Device" },
  { id: "combo", label: "Device Combo" },
] as const;

type LayoutId = (typeof LAYOUTS)[number]["id"];

interface ComboItem {
  device: DeviceId;
  style: CSSProperties;
  z: number;
  dim?: boolean;
}

const COMBOS = [
  {
    id: "two-phones",
    label: "Two Phones",
    width: 600,
    height: 540,
    items: [
      { device: "iphone", style: { left: 30, top: 70, transform: "scale(0.82) rotate(-6deg)" }, z: 1, dim: true },
      { device: "iphone", style: { right: 20, top: 0, transform: "scale(0.94) rotate(5deg)" }, z: 2 },
    ] as ComboItem[],
  },
  {
    id: "phone-laptop",
    label: "Phone + Laptop",
    width: 600,
    height: 480,
    items: [
      { device: "laptop", style: { left: 0, top: 40, transform: "scale(0.68)", transformOrigin: "top left" }, z: 1, dim: true },
      { device: "iphone", style: { right: 0, bottom: 0, transform: "scale(0.46)", transformOrigin: "bottom right" }, z: 2 },
    ] as ComboItem[],
  },
  {
    id: "phone-tablet",
    label: "Phone + Tablet",
    width: 600,
    height: 540,
    items: [
      { device: "tablet", style: { left: 10, top: 30, transform: "scale(0.86)", transformOrigin: "top left" }, z: 1, dim: true },
      { device: "iphone", style: { right: 0, bottom: 0, transform: "scale(0.54)", transformOrigin: "bottom right" }, z: 2 },
    ] as ComboItem[],
  },
] as const;

type ComboId = (typeof COMBOS)[number]["id"];

const FRAME_COLORS = [
  { id: "black", label: "Black", value: "linear-gradient(160deg,#3a3a3c,#141416)" },
  { id: "graphite", label: "Graphite", value: "linear-gradient(160deg,#5b5b60,#26262a)" },
  { id: "silver", label: "Silver", value: "linear-gradient(160deg,#f4f4f5,#c8c8cc)" },
  { id: "white", label: "White", value: "linear-gradient(160deg,#ffffff,#e2e2e5)" },
  { id: "gold", label: "Gold", value: "linear-gradient(160deg,#f3e0c4,#c9a978)" },
  { id: "rose-gold", label: "Rose Gold", value: "linear-gradient(160deg,#f4cfc6,#c98f83)" },
  { id: "midnight", label: "Midnight Blue", value: "linear-gradient(160deg,#3b4a6b,#151b2e)" },
  { id: "ocean", label: "Ocean Blue", value: "linear-gradient(160deg,#5b8def,#1e3a72)" },
  { id: "forest", label: "Forest Green", value: "linear-gradient(160deg,#4f7a5c,#1c3624)" },
  { id: "crimson", label: "Crimson", value: "linear-gradient(160deg,#e0596a,#7d1723)" },
] as const;

/** Lightens (positive) or darkens (negative) a #rrggbb color by a fraction of the 0-255 range. */
function shadeHex(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + Math.round(255 * percent));
  const g = clamp(((num >> 8) & 0xff) + Math.round(255 * percent));
  const b = clamp((num & 0xff) + Math.round(255 * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function customFrameGradient(hex: string): string {
  return `linear-gradient(160deg,${shadeHex(hex, 0.16)},${shadeHex(hex, -0.28)})`;
}

const BACKGROUNDS = [
  { id: "sunset", label: "Sunset", value: "linear-gradient(135deg, #f97316, #db2777)" },
  { id: "ocean", label: "Ocean", value: "linear-gradient(135deg, #0ea5e9, #6366f1)" },
  { id: "purple", label: "Purple Dream", value: "linear-gradient(135deg, #a855f7, #ec4899)" },
  { id: "mint", label: "Mint", value: "linear-gradient(135deg, #34d399, #059669)" },
  { id: "midnight", label: "Midnight", value: "linear-gradient(135deg, #1e293b, #0f172a)" },
  { id: "light", label: "Light", value: "#f1f5f9" },
  { id: "dark", label: "Dark", value: "#18181b" },
  { id: "transparent", label: "Transparent", value: "transparent" },
] as const;

function ScreenContent({
  screenshotUrl,
  radius,
  emptyLabel,
}: {
  screenshotUrl: string | null;
  radius: number;
  emptyLabel: string;
}) {
  if (screenshotUrl) {
    return (
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          backgroundImage: `url(${screenshotUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center"
      style={{ borderRadius: radius, background: "linear-gradient(135deg,#312e81,#1e293b)" }}
    >
      <ImageIcon className="h-6 w-6 text-white/40" />
      <span className="px-6 text-[11px] font-medium leading-snug text-white/50">
        {emptyLabel}
      </span>
    </div>
  );
}

interface DeviceProps {
  bezel: string;
  screenshotUrl: string | null;
  emptyLabel: string;
  browserUrl: string;
}

/**
 * Gives a flat rounded-rect face real volume under the rotateX/Y/Z preview:
 * a stack of darkening copies pushed back along Z, so tilting the device
 * reveals a solid-looking edge instead of a paper-thin cutout.
 */
function DepthBody({
  radius,
  bezel,
  depth = 16,
  layers = 18,
  children,
}: {
  radius: string | number;
  bezel: string;
  depth?: number;
  layers?: number;
  children: ReactNode;
}) {
  const step = depth / layers;
  return (
    <div className="relative" style={{ transformStyle: "preserve-3d" }}>
      {Array.from({ length: layers }, (_, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            borderRadius: radius,
            background: bezel,
            filter: `brightness(${1 - ((i + 1) / layers) * 0.6})`,
            transform: `translateZ(-${(step * (i + 1)).toFixed(2)}px)`,
          }}
        />
      ))}
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
}

function PhoneIOS({ bezel, screenshotUrl, emptyLabel }: DeviceProps) {
  return (
    <div className="relative mx-auto" style={{ width: 260, transformStyle: "preserve-3d" }}>
      <DepthBody radius={46} bezel={bezel} depth={28}>
        <div className="relative shadow-2xl" style={{ background: bezel, borderRadius: 46, padding: 12 }}>
          <div className="relative overflow-hidden bg-black" style={{ borderRadius: 34, aspectRatio: "9 / 19.5" }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={34} emptyLabel={emptyLabel} />
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 bg-black"
              style={{ width: 96, height: 24, borderRadius: 14 }}
            />
          </div>
          <div className="absolute bg-black/50" style={{ left: -3, top: 90, width: 3, height: 30, borderRadius: 2 }} />
          <div className="absolute bg-black/50" style={{ left: -3, top: 130, width: 3, height: 50, borderRadius: 2 }} />
          <div className="absolute bg-black/50" style={{ right: -3, top: 110, width: 3, height: 60, borderRadius: 2 }} />
        </div>
      </DepthBody>
    </div>
  );
}

function PhoneAndroid({ bezel, screenshotUrl, emptyLabel }: DeviceProps) {
  return (
    <div className="relative mx-auto" style={{ width: 260, transformStyle: "preserve-3d" }}>
      <DepthBody radius={34} bezel={bezel} depth={26}>
        <div className="shadow-2xl" style={{ background: bezel, borderRadius: 34, padding: 6 }}>
          <div className="relative overflow-hidden bg-black" style={{ borderRadius: 28, aspectRatio: "9 / 19.5" }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={28} emptyLabel={emptyLabel} />
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black"
              style={{ width: 10, height: 10 }}
            />
          </div>
        </div>
      </DepthBody>
    </div>
  );
}

function TabletDevice({ bezel, screenshotUrl, emptyLabel }: DeviceProps) {
  return (
    <div className="relative mx-auto" style={{ width: 320, transformStyle: "preserve-3d" }}>
      <DepthBody radius={32} bezel={bezel} depth={24}>
        <div className="relative shadow-2xl" style={{ background: bezel, borderRadius: 32, padding: 18 }}>
          <div
            className="absolute left-1/2 top-2.5 -translate-x-1/2 rounded-full bg-black/60"
            style={{ width: 6, height: 6 }}
          />
          <div className="relative overflow-hidden bg-black" style={{ borderRadius: 16, aspectRatio: "3 / 4" }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={16} emptyLabel={emptyLabel} />
          </div>
        </div>
      </DepthBody>
    </div>
  );
}

function LaptopDevice({ bezel, screenshotUrl, emptyLabel }: DeviceProps) {
  return (
    <div
      className="relative mx-auto flex flex-col items-center"
      style={{ width: 588, transformStyle: "preserve-3d" }}
    >
      <DepthBody radius="18px 18px 6px 6px" bezel={bezel} depth={18}>
        <div
          className="relative shadow-2xl"
          style={{ background: bezel, borderRadius: "18px 18px 6px 6px", padding: "14px 14px 20px", width: 588 }}
        >
          <div
            className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-black/40"
            style={{ width: 6, height: 6 }}
          />
          <div className="overflow-hidden bg-black" style={{ width: 560, height: 350, borderRadius: 6 }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={6} emptyLabel={emptyLabel} />
          </div>
        </div>
      </DepthBody>
      <div
        className="shadow-lg"
        style={{ background: bezel, width: 620, height: 16, borderRadius: "0 0 10px 10px", marginTop: -2 }}
      />
      <div style={{ width: 150, height: 6, background: bezel, opacity: 0.8, borderRadius: "0 0 8px 8px" }} />
    </div>
  );
}

function BrowserDevice({ bezel, screenshotUrl, emptyLabel, browserUrl }: DeviceProps) {
  return (
    <div className="relative mx-auto" style={{ width: 560, transformStyle: "preserve-3d" }}>
      <DepthBody radius={14} bezel={bezel} depth={16}>
        <div className="overflow-hidden shadow-2xl" style={{ width: 560, borderRadius: 14 }}>
          <div className="flex items-center gap-2 px-4" style={{ background: bezel, height: 40 }}>
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: "#ff5f56" }} />
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: "#ffbd2e" }} />
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: "#27c93f" }} />
            <div
              className="ml-3 flex-1 truncate rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: "rgba(255,255,255,0.92)", color: "#111827" }}
            >
              {browserUrl || "yourwebsite.com"}
            </div>
          </div>
          <div className="relative bg-black" style={{ width: 560, height: 350 }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={0} emptyLabel={emptyLabel} />
          </div>
        </div>
      </DepthBody>
    </div>
  );
}

function MonitorDevice({ bezel, screenshotUrl, emptyLabel }: DeviceProps) {
  return (
    <div className="relative mx-auto flex flex-col items-center" style={{ transformStyle: "preserve-3d" }}>
      <DepthBody radius={16} bezel={bezel} depth={20}>
        <div className="shadow-2xl" style={{ background: bezel, borderRadius: 16, padding: 14 }}>
          <div className="relative overflow-hidden bg-black" style={{ width: 560, height: 350, borderRadius: 4 }}>
            <ScreenContent screenshotUrl={screenshotUrl} radius={4} emptyLabel={emptyLabel} />
          </div>
        </div>
      </DepthBody>
      <div className="shadow-md" style={{ width: 26, height: 46, background: bezel }} />
      <div className="shadow-lg" style={{ width: 200, height: 14, background: bezel, borderRadius: 8 }} />
    </div>
  );
}

const DEVICE_RENDERERS: Record<DeviceId, (props: DeviceProps) => JSX.Element> = {
  iphone: PhoneIOS,
  android: PhoneAndroid,
  tablet: TabletDevice,
  laptop: LaptopDevice,
  browser: BrowserDevice,
  monitor: MonitorDevice,
};

export default function DeviceMockupPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const cardRef = useRef<HTMLDivElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutId>("single");
  const [device, setDevice] = useState<DeviceId>("iphone");
  const [comboId, setComboId] = useState<ComboId>(COMBOS[0].id);
  const [frameColorId, setFrameColorId] = useState<(typeof FRAME_COLORS)[number]["id"] | "custom">(
    FRAME_COLORS[0].id,
  );
  const [customColor, setCustomColor] = useState("#6d28d9");
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]>(BACKGROUNDS[0]);
  const [padding, setPadding] = useState(64);
  const [browserUrl, setBrowserUrl] = useState("yourwebsite.com");
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);

  const emptyLabel = t("tool.device-mockup.empty") || "Upload a screenshot to preview";

  const handleUpload = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setScreenshotUrl(url);
  };

  const handleReset = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setScreenshotUrl(null);
  };

  const getExportBlob = useCallback(async () => {
    if (!cardRef.current) return null;
    return toBlob(cardRef.current, { pixelRatio: 3, backgroundColor: undefined });
  }, []);

  const handleDownload = async () => {
    const blob = await getExportBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mojepict-${layout === "combo" ? comboId : device}-mockup.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("common.success"), description: t("toast.success.downloaded") });
  };

  const bezel =
    frameColorId === "custom"
      ? customFrameGradient(customColor)
      : FRAME_COLORS.find((c) => c.id === frameColorId)?.value ?? FRAME_COLORS[0].value;
  const deviceProps: DeviceProps = { bezel, screenshotUrl, emptyLabel, browserUrl };
  const activeCombo = COMBOS.find((c) => c.id === comboId) ?? COMBOS[0];

  function renderPreview() {
    if (layout === "single") {
      return DEVICE_RENDERERS[device](deviceProps);
    }
    return (
      <div
        className="relative mx-auto"
        style={{ width: activeCombo.width, height: activeCombo.height, transformStyle: "preserve-3d" }}
      >
        {activeCombo.items.map((item, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              ...item.style,
              zIndex: item.z,
              filter: item.dim ? "brightness(0.85)" : undefined,
              transformStyle: "preserve-3d",
            }}
          >
            {DEVICE_RENDERERS[item.device](deviceProps)}
          </div>
        ))}
      </div>
    );
  }

  // Miniature copy of the exact same preview tree, scaled down for the
  // Slider's touch-drag magnifier bubble (see components/ui/slider.tsx) -
  // memoized so dragging one slider doesn't re-render this 3D DOM tree on
  // every other page re-render, only when something it actually shows changes.
  const loupePreview = useMemo(
    () => (
      <div style={{ transform: "scale(0.16)", transformOrigin: "center" }}>
        <div style={{ padding, background: background.value }}>
          <div style={{ perspective: 1600 }}>
            <div
              style={{
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, device, comboId, bezel, screenshotUrl, browserUrl, background, padding, rotateX, rotateY, rotateZ],
  );

  return (
    <ToolShell
      title={t("tool.device-mockup.name") || "Device Mockup Generator"}
      description={
        t("tool.device-mockup.description") ||
        "Frame your screenshot inside a phone, tablet, laptop, browser, or monitor."
      }
    >
      <ToolWorkspace
        sidebar={
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Screenshot
                </Label>
                <Dropzone
                  onFile={handleUpload}
                  accept="image/*"
                  title={screenshotUrl ? "Change Screenshot" : "Upload Screenshot"}
                  subtitle={t("common.upload-drag")}
                  className="min-h-[140px] p-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Layout
                </Label>
                <Select value={layout} onValueChange={(v) => setLayout(v as LayoutId)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {layout === "single" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Device
                  </Label>
                  <Select value={device} onValueChange={(v) => setDevice(v as DeviceId)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICES.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Combination
                  </Label>
                  <Select value={comboId} onValueChange={(v) => setComboId(v as ComboId)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMBOS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {layout === "single" && device === "browser" && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Address bar text</Label>
                  <Input
                    value={browserUrl}
                    onChange={(e) => setBrowserUrl(e.target.value)}
                    placeholder="yourwebsite.com"
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Frame Color
                </Label>
                <div className="flex flex-wrap gap-2">
                  {FRAME_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() => setFrameColorId(c.id)}
                      className={cn(
                        "h-8 w-8 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                        frameColorId === c.id &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      )}
                      style={{ background: c.value }}
                    />
                  ))}
                  <label
                    className={cn(
                      "relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                      frameColorId === "custom" &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    style={{
                      background: "conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)",
                    }}
                  >
                    <input
                      type="color"
                      value={customColor}
                      aria-label="Custom frame color"
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setFrameColorId("custom");
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
                {frameColorId === "custom" && (
                  <Input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#6d28d9"
                    className="h-8 font-mono text-xs"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Background
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      title={bg.label}
                      onClick={() => setBackground(bg)}
                      className={cn(
                        "h-8 w-8 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10",
                        background.id === bg.id &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      )}
                      style={{
                        background:
                          bg.id === "transparent"
                            ? "repeating-conic-gradient(#94a3b8 0% 25%, #cbd5e1 0% 50%) 50% / 10px 10px"
                            : bg.value,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-medium">Padding</Label>
                  <span className="text-xs font-mono">{padding}px</span>
                </div>
                <Slider
                  value={[padding]}
                  min={0}
                  max={160}
                  step={4}
                  onValueChange={(v: number[]) => setPadding(v[0])}
                  previewContent={loupePreview}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3D Rotation
                  </Label>
                  {(rotateX !== 0 || rotateY !== 0 || rotateZ !== 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRotateX(0);
                        setRotateY(0);
                        setRotateZ(0);
                      }}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium">Rotate X</Label>
                    <span className="text-xs font-mono">{rotateX}°</span>
                  </div>
                  <Slider
                    value={[rotateX]}
                    min={-60}
                    max={60}
                    step={1}
                    onValueChange={(v: number[]) => setRotateX(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium">Rotate Y</Label>
                    <span className="text-xs font-mono">{rotateY}°</span>
                  </div>
                  <Slider
                    value={[rotateY]}
                    min={-60}
                    max={60}
                    step={1}
                    onValueChange={(v: number[]) => setRotateY(v[0])}
                    previewContent={loupePreview}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-xs font-medium">Rotate Z</Label>
                    <span className="text-xs font-mono">{rotateZ}°</span>
                  </div>
                  <Slider
                    value={[rotateZ]}
                    min={-45}
                    max={45}
                    step={1}
                    onValueChange={(v: number[]) => setRotateZ(v[0])}
                    previewContent={loupePreview}
                  />
                </div>
              </div>
            </div>

            <ToolActionBar
              primaryLabel={t("action.download")}
              primaryIcon={<Download className="h-4 w-4" />}
              onPrimary={handleDownload}
              primaryDisabled={!screenshotUrl}
              onReset={screenshotUrl ? handleReset : undefined}
            >
              <CopyImageButton getBlob={getExportBlob} disabled={!screenshotUrl} />
            </ToolActionBar>
          </>
        }
      >
        <ImageZoomPreview checkered>
          <div ref={cardRef} className="inline-block" style={{ padding, background: background.value }}>
            <div style={{ perspective: 1600 }}>
              <div
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {renderPreview()}
              </div>
            </div>
          </div>
        </ImageZoomPreview>
      </ToolWorkspace>
    </ToolShell>
  );
}
