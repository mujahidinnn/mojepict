"use client";

import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/context";
import {
  Camera,
  Contrast as ContrastIcon,
  Download,
  Eye,
  FlipHorizontal,
  Fullscreen,
  Grid3X3,
  Palette,
  RefreshCcw,
  Settings2,
  Sparkles,
  Sun,
  Thermometer,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const DECORATIVE_FRAMES = [
  { id: "none", name: "Classic", icon: "🔳" },
  { id: "stars", name: "Starry", icon: "⭐" },
  { id: "fruits", name: "Fruits", icon: "🍓" },
  { id: "neon", name: "Neon", icon: "🌈" },
  { id: "dots", name: "Dots", icon: "⚪" },
  { id: "hearts", name: "Hearts", icon: "💖" },
  { id: "retro", name: "Retro TV", icon: "📺" },
  { id: "cyber", name: "Cyber", icon: "👾" },
  { id: "emoji", name: "Emoji Blast", icon: "✨" },
  { id: "checker", name: "Racing", icon: "🏁" },
  { id: "bubble", name: "Bubbles", icon: "🫧" },
];

export default function PhotoBoothPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [vignette, setVignette] = useState(0);
  const [colorTemp, setColorTemp] = useState(0);
  const [blur, setBlur] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [filter, setFilter] = useState("none");
  const [grid, setGrid] = useState({ cols: 2, rows: 3 });
  const [radius, setRadius] = useState(0);
  const [frameColor, setFrameColor] = useState("white");
  const [selectedFrame, setSelectedFrame] = useState("none");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const refs = useRef({
    brightness,
    contrast,
    vignette,
    colorTemp,
    blur,
    mirror,
    filter,
    radius,
    frameColor,
    selectedFrame,
  });

  useEffect(() => {
    refs.current = {
      brightness,
      contrast,
      vignette,
      colorTemp,
      blur,
      mirror,
      filter,
      radius,
      frameColor,
      selectedFrame,
    };
  }, [
    brightness,
    contrast,
    vignette,
    colorTemp,
    blur,
    mirror,
    filter,
    radius,
    frameColor,
    selectedFrame,
  ]);

  const renderDecoration = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    frameId: string,
  ) => {
    if (frameId === "none") return;
    ctx.save();
    switch (frameId) {
      case "stars":
        ctx.fillStyle = "rgba(255, 223, 0, 0.6)";
        ctx.font = `${w / 15}px serif`;
        for (let i = 0; i < 15; i++) {
          ctx.fillText(
            "⭐",
            Math.abs(Math.sin(i)) * w,
            Math.abs(Math.cos(i * 2)) * h,
          );
        }
        break;
      case "fruits":
        ctx.font = `${w / 18}px serif`;
        const f = ["🍓", "🍉", "🍍", "🍒"];
        for (let i = 0; i < 12; i++) {
          ctx.fillText(f[i % 4], (i * (w / 10)) % w, (i * (h / 8)) % h);
        }
        break;
      case "neon":
        ctx.strokeStyle = "#00f2ff";
        ctx.lineWidth = w * 0.02;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f2ff";
        ctx.strokeRect(
          ctx.lineWidth / 2,
          ctx.lineWidth / 2,
          w - ctx.lineWidth,
          h - ctx.lineWidth,
        );
        break;
      case "dots":
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < 40; i++) {
          ctx.beginPath();
          ctx.arc((i * 77) % w, (i * 123) % h, w * 0.015, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "hearts":
        ctx.font = `${w / 15}px serif`;
        for (let i = 0; i < 10; i++) {
          ctx.fillText("💖", (i * 150) % w, (i * 200) % h);
        }
        break;
      case "retro":
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for (let i = 0; i < h; i += 8) {
          ctx.fillRect(0, i, w, 2);
        }
        break;
      case "cyber":
        ctx.strokeStyle = "#ff00ff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w / 4, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, h / 4);
        ctx.moveTo(w, h);
        ctx.lineTo(w - w / 4, h);
        ctx.moveTo(w, h);
        ctx.lineTo(w, h - h / 4);
        ctx.stroke();
        break;
      case "emoji":
        ctx.font = `${w / 12}px serif`;
        ctx.fillText("✨", w * 0.1, h * 0.1);
        ctx.fillText("🌈", w * 0.8, h * 0.2);
        ctx.fillText("🔥", w * 0.2, h * 0.8);
        ctx.fillText("🍭", w * 0.7, h * 0.7);
        break;
      case "checker":
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        const s = w / 20;
        for (let x = 0; x < w; x += s * 2) {
          ctx.fillRect(x, 0, s, s);
          ctx.fillRect(x + s, h - s, s, s);
        }
        break;
      case "bubble":
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          ctx.arc((i * 110) % w, (i * 90) % h, w * 0.03, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }
    ctx.restore();
  };

  const startCamera = async (mode: "user" | "environment") => {
    if (streamRef.current)
      streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      toast({
        variant: "destructive",
        description: t("tool.photobooth.hint.camera"),
      });
    }
  };

  const drawLoop = () => {
    const video = videoRef.current;
    const canvas = previewRef.current;
    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;

      ctx.save();
      if (refs.current.mirror) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }

      ctx.filter =
        refs.current.filter !== "none"
          ? refs.current.filter
          : `brightness(${refs.current.brightness}%) contrast(${refs.current.contrast}%) blur(${refs.current.blur}px)`;

      ctx.drawImage(video, 0, 0, vw, vh);
      ctx.restore();

      if (refs.current.colorTemp !== 0) {
        ctx.fillStyle =
          refs.current.colorTemp > 0
            ? `rgba(255, 180, 0, ${Math.abs(refs.current.colorTemp) / 500})`
            : `rgba(0, 140, 255, ${Math.abs(refs.current.colorTemp) / 500})`;
        ctx.fillRect(0, 0, vw, vh);
      }

      if (refs.current.vignette > 0) {
        const g = ctx.createRadialGradient(
          vw / 2,
          vh / 2,
          vh * 0.3,
          vw / 2,
          vh / 2,
          vh * 0.7,
        );
        g.addColorStop(0, "transparent");
        g.addColorStop(1, `rgba(0,0,0,${refs.current.vignette / 100})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, vw, vh);
      }

      renderDecoration(ctx, vw, vh, refs.current.selectedFrame);
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  };

  useEffect(() => {
    startCamera(facingMode);
    rafRef.current = requestAnimationFrame(drawLoop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturePhoto = () => {
    if (photos.length >= grid.cols * grid.rows) return;
    const canvas = previewRef.current;
    if (canvas) setPhotos([...photos, canvas.toDataURL("image/png")]);
  };

  const downloadGrid = () => {
    const canvas = exportRef.current;
    if (!canvas || !previewRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gap = 20,
      pad = 30;
    const cellW = previewRef.current.width;
    const cellH = previewRef.current.height;
    canvas.width = pad * 2 + grid.cols * cellW + gap * (grid.cols - 1);
    canvas.height = pad * 2 + grid.rows * cellH + gap * (grid.rows - 1);

    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loadedCount = 0;
    photos.forEach((src, i) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        const x = pad + (i % grid.cols) * (cellW + gap);
        const y = pad + Math.floor(i / grid.cols) * (cellH + gap);
        ctx.drawImage(img, x, y, cellW, cellH);
        loadedCount++;
        if (loadedCount === photos.length) {
          renderDecoration(ctx, canvas.width, canvas.height, selectedFrame);
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "photobooth-mojepict.png";
          link.click();
          toast({
            title: t("common.success"),
            description: t("toast.success.downloaded"),
          });
        }
      };
    });
  };

  return (
    <ToolShell
      title={t("tool.photobooth.name")}
      description={t("tool.photobooth.description")}
    >
      <ToolWorkspace
        sidebar={
          <>
            <Tabs defaultValue="adjust" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="adjust" className="flex-1 gap-1 text-[11px]">
                  <Settings2 className="h-3 w-3" /> Adjust
                </TabsTrigger>
                <TabsTrigger value="filter" className="flex-1 gap-1 text-[11px]">
                  <Palette className="h-3 w-3" /> Filter
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex-1 gap-1 text-[11px]">
                  <Grid3X3 className="h-3 w-3" /> Layout
                </TabsTrigger>
                <TabsTrigger value="frames" className="flex-1 gap-1 text-[11px]">
                  <Sparkles className="h-3 w-3" /> Frames
                </TabsTrigger>
              </TabsList>

              <TabsContent value="adjust" className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Sun className="h-3 w-3" /> Brightness ({brightness}%)
                  </Label>
                  <Slider
                    value={[brightness]}
                    min={50}
                    max={150}
                    onValueChange={(v) => setBrightness(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <ContrastIcon className="h-3 w-3" /> Contrast ({contrast}%)
                  </Label>
                  <Slider
                    value={[contrast]}
                    min={50}
                    max={150}
                    onValueChange={(v) => setContrast(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Thermometer className="h-3 w-3" /> Temp (Warm/Cold)
                  </Label>
                  <Slider
                    value={[colorTemp]}
                    min={-100}
                    max={100}
                    onValueChange={(v) => setColorTemp(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Vignette ({vignette}%)
                  </Label>
                  <Slider
                    value={[vignette]}
                    min={0}
                    max={100}
                    onValueChange={(v) => setVignette(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Blur ({blur}px)
                  </Label>
                  <Slider
                    value={[blur]}
                    min={0}
                    max={10}
                    step={0.1}
                    onValueChange={(v) => setBlur(v[0])}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Fullscreen className="h-3 w-3" />{" "}
                    {t("tool.photobooth.label.radius")} ({radius}
                    px)
                  </Label>
                  <Slider
                    value={[radius]}
                    min={0}
                    max={50}
                    onValueChange={(v) => setRadius(v[0])}
                  />
                </div>
              </TabsContent>

              <TabsContent value="filter" className="pt-4">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (Clean)</SelectItem>
                    <SelectItem value="brightness(110%) contrast(90%) saturate(120%) blur(0.3px)">
                      Sweet Look ✨
                    </SelectItem>
                    <SelectItem value="sepia(0.4) brightness(110%) hue-rotate(-10deg)">
                      Golden Hour ☀️
                    </SelectItem>
                    <SelectItem value="sepia(0.6) contrast(0.9) brightness(1.1)">
                      Vintage 🎞️
                    </SelectItem>
                    <SelectItem value="brightness(110%) contrast(120%) hue-rotate(180deg)">
                      Cold Tone ❄️
                    </SelectItem>
                    <SelectItem value="grayscale(100%)">Classic B&W</SelectItem>
                    <SelectItem value="grayscale(100%) contrast(150%)">
                      High Contrast B&W
                    </SelectItem>
                    <SelectItem value="brightness(105%) contrast(95%) saturate(120%) sepia(0.5) hue-rotate(-10deg)">
                      Retro 70s
                    </SelectItem>
                    <SelectItem value="brightness(110%) contrast(90%) saturate(85%) sepia(0.3) blur(0.4px)">
                      Retro 80s
                    </SelectItem>
                    <SelectItem value="brightness(70%) contrast(130%) hue-rotate(210deg)">
                      Midnight 🌙
                    </SelectItem>
                    <SelectItem value="contrast(200%) brightness(80%)">
                      Dramatic
                    </SelectItem>
                    <SelectItem value="blur(0.5px) brightness(115%)">
                      Soft Glow
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-4 text-[10px] text-muted-foreground">
                  * Filters override Manual Adjustments (Brightness/Contrast/Blur)
                </p>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("tool.photobooth.label.grid")}
                  </Label>
                  <Select
                    value={`${grid.cols}x${grid.rows}`}
                    onValueChange={(v) => {
                      const [c, r] = v.split("x").map(Number);
                      setGrid({ cols: c, rows: r });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2x3">2 x 3 Grid</SelectItem>
                      <SelectItem value="2x4">2 x 4 Grid</SelectItem>
                      <SelectItem value="3x3">3 x 3 Grid</SelectItem>
                      <SelectItem value="1x4">4 Strip</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t("tool.photobooth.label.frame")}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "white",
                      "black",
                      "#ff0000",
                      "#00ff00",
                      "#0000ff",
                      "#ffe4e1",
                      "#f0f8ff",
                    ].map((c) => (
                      <div
                        key={c}
                        className={`h-7 w-7 rounded-full border cursor-pointer ${frameColor === c ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFrameColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="frames" className="space-y-4 pt-4">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">
                  Decorative Overlay
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {DECORATIVE_FRAMES.map((f) => (
                    <Button
                      key={f.id}
                      variant={selectedFrame === f.id ? "default" : "outline"}
                      className="h-14 flex flex-col items-center justify-center gap-1 p-1"
                      onClick={() => setSelectedFrame(f.id)}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-[9px] truncate w-full text-center">
                        {f.name}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <ToolActionBar
              primaryLabel={t("action.capture")}
              primaryIcon={<Camera className="h-4 w-4" />}
              onPrimary={capturePhoto}
              primaryDisabled={photos.length >= grid.cols * grid.rows}
              onReset={() => setPhotos([])}
              resetLabel={t("action.clearAll")}
              resetDisabled={photos.length === 0}
            >
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={downloadGrid}
                disabled={photos.length === 0}
              >
                <Download className="h-4 w-4" /> {t("action.download")}
              </Button>
            </ToolActionBar>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl group">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas
              ref={previewRef}
              className="w-full h-full object-cover"
              style={{ borderRadius: `${radius}px` }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setMirror(!mirror)}
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  const next = facingMode === "user" ? "environment" : "user";
                  setFacingMode(next);
                  startCamera(next);
                }}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="grid gap-4 rounded-xl shadow-lg border"
            style={{
              gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
              backgroundColor: frameColor,
              padding: "24px",
              gap: "12px",
            }}
          >
            {Array.from({ length: grid.cols * grid.rows }).map((_, i) => (
              <div
                key={i}
                className="aspect-video bg-muted/20 rounded-sm overflow-hidden relative group border border-white/10"
              >
                {photos[i] ? (
                  <>
                    <Image
                      src={photos[i]}
                      alt="Captured"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                      onClick={() =>
                        setPhotos(photos.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 border-2 border-dashed border-muted-foreground">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ToolWorkspace>
      <canvas ref={exportRef} className="hidden" />
    </ToolShell>
  );
}
