"use client";

import TitlePage from "@/components/TitlePage";
import { useRef, useState, useEffect } from "react";
import {
  CameraIcon,
  DownloadIcon,
  Trash2,
  RefreshCw,
  FlipHorizontal2,
  Settings2Icon,
  BlendIcon,
  XIcon,
  RefreshCcwIcon,
} from "lucide-react";

export default function WebPhotoboxGrid() {
  const videoRef = useRef(null); // <video> sumber kamera (disembunyikan)
  const previewRef = useRef(null); // <canvas> untuk realtime preview
  const exportRef = useRef(null); // <canvas> untuk export grid
  const rafRef = useRef(0); // requestAnimationFrame id
  const streamRef = useRef(null); // simpan MediaStream biar bisa stop saat unmount

  // Foto yang sudah dicapture (dataURL)
  const [photos, setPhotos] = useState([]);

  // Controls (state untuk UI) + refs (agar loop pakai nilai terbaru tanpa restart)
  const [brightness, setBrightness] = useState(100);
  const brightRef = useRef(100);
  const [contrast, setContrast] = useState(100);
  const contrastRef = useRef(100);
  const [vignette, setVignette] = useState(0);
  const vignetteRef = useRef(0); // 0–100
  const [colorTemp, setColorTemp] = useState(0);
  const tempRef = useRef(0); // -100..100
  const [blur, setBlur] = useState(0);
  const blurRef = useRef(0); // 0..5 (px)
  const [mirror, setMirror] = useState(true);
  const mirrorRef = useRef(true); // flip horizontal?
  const [filter, setFilter] = useState("none");
  const filterRef = useRef("none");

  const [tab, setTab] = useState("custom");
  const tabRef = useRef(tab);

  // Grid (default 2x3)
  const [grid, setGrid] = useState({ cols: 2, rows: 3 });
  const [radius, setRadius] = useState(0);
  const radiusRef = useRef(0);

  // Frame
  const [frameColor, setFrameColor] = useState("white");
  const frameRef = useRef(frameColor);

  // === kamera depan/belakang ===
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"
  const [hasUserCam, setHasUserCam] = useState(false);
  const [hasEnvCam, setHasEnvCam] = useState(false);

  // Sinkronkan state -> ref (supaya loop tidak di-reinit tiap kali slider digeser)
  useEffect(() => {
    brightRef.current = Number(brightness);
  }, [brightness]);
  useEffect(() => {
    contrastRef.current = Number(contrast);
  }, [contrast]);
  useEffect(() => {
    vignetteRef.current = Number(vignette);
  }, [vignette]);
  useEffect(() => {
    tempRef.current = Number(colorTemp);
  }, [colorTemp]);
  useEffect(() => {
    blurRef.current = Number(blur);
  }, [blur]);
  useEffect(() => {
    mirrorRef.current = mirror;
  }, [mirror]);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);
  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);
  useEffect(() => {
    frameRef.current = frameColor;
  }, [frameColor]);

  // === helper start kamera sesuai facing ===
  async function startCameraWithFacing(facing = "user") {
    // stop stream lama
    const old = streamRef.current;
    if (old) {
      old.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // minta stream baru
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });
    streamRef.current = stream;
    const video = videoRef.current;
    video.srcObject = stream;
    video.muted = true; // iOS Safari
    await video.play();
  }

  // ===  cek ketersediaan kamera depan/belakang ===
  async function checkCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");

      // heuristik: kalau ada >=2 videoinput, anggap bisa switch
      // plus coba deteksi label (kalau permission sudah diberikan)
      let userOK = false;
      let envOK = false;

      if (videoInputs.length >= 2) {
        userOK = true;
        envOK = true;
      } else if (videoInputs.length === 1) {
        const label = (videoInputs[0].label || "").toLowerCase();
        if (label.includes("front") || label.includes("user")) userOK = true;
        if (
          label.includes("back") ||
          label.includes("rear") ||
          label.includes("environment")
        )
          envOK = true;
        // kalau label kosong (belum grant permission), minimal tandai ada satu kamera
        if (!label) userOK = true;
      }

      setHasUserCam(userOK);
      setHasEnvCam(envOK);
    } catch (err) {
      console.error("enumerateDevices failed:", err);
      // fallback konservatif
      setHasUserCam(true);
      setHasEnvCam(false);
    }
  }

  // Init camera + start render loop sekali
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await startCameraWithFacing(facingMode);
        if (!mounted) return;

        // start draw loop (sekali)
        rafRef.current = requestAnimationFrame(drawLoop);

        // setelah stream hidup, cek daftar device (label kebuka setelah permission)
        await checkCameras();
      } catch (err) {
        console.error("Camera access denied or failed:", err);
      }
    }

    init();

    // cleanup
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // kosong: hanya sekali saat mount
    // (kita gak taruh facingMode di deps, biar gak auto-reinit;
    //  switching dilakukan manual via tombol)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===  action switch kamera (tampil kalau dua-duanya ada) ===
  const canSwitchCamera = hasUserCam && hasEnvCam;
  const toggleCamera = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    try {
      await startCameraWithFacing(next);
      setFacingMode(next);
    } catch (e) {
      console.error("Switch camera failed:", e);
    }
  };

  // Loop render realtime ke canvas preview
  const drawLoop = () => {
    const video = videoRef.current;
    const canvas = previewRef.current;
    if (video && canvas && video.readyState >= 2) {
      const ctx = canvas.getContext("2d");
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;

      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;

      // ===== mirror transform =====
      ctx.save();
      if (mirrorRef.current) {
        ctx.translate(vw, 0);
        ctx.scale(-1, 1);
      }

      // ===== filter / custom =====
      const blurVal = Math.max(0, Math.min(10, blurRef.current));
      if (tabRef.current === "filter") {
        ctx.filter = filterRef.current;
      } else if (tabRef.current === "custom") {
        ctx.filter = `
        brightness(${brightRef.current}%)
        contrast(${contrastRef.current}%)
        blur(${blurVal}px)
      `;
      }

      // draw video
      ctx.drawImage(video, 0, 0, vw, vh);

      ctx.restore(); // restore mirror saja
      ctx.filter = "none"; // reset filter supaya overlay/vignette tidak ikut

      // ===== COLOR TEMPERATURE overlay =====
      const t = tempRef.current;
      if (t !== 0) {
        const alpha = Math.min(Math.abs(t) / 100, 1) * 0.4; // intensitas max 0.4
        ctx.fillStyle =
          t > 0
            ? `rgba(255, 180, 0, ${alpha})` // warm → kuning/orange
            : `rgba(0, 140, 255, ${alpha})`; // cool → biru
        ctx.fillRect(0, 0, vw, vh);
      }

      // ===== VIGNETTE =====
      const v = Math.max(0, Math.min(100, vignetteRef.current));
      if (v > 0) {
        const radiusInner = (Math.min(vw, vh) / 2) * 0.6;
        const radiusOuter = Math.min(vw, vh) / 2;
        const g = ctx.createRadialGradient(
          vw / 2,
          vh / 2,
          radiusInner,
          vw / 2,
          vh / 2,
          radiusOuter
        );
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, `rgba(0,0,0,${v / 100})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, vw, vh);
      }
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  };

  // Capture: ambil dataURL dari canvas preview (apa yang terlihat = yang tersimpan)
  const capturePhoto = () => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    setPhotos((prev) => [...prev, dataURL]);
  };

  // Hapus satu foto
  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Kosongkan semua
  const clearAll = () => setPhotos([]);

  // Download grid
  const downloadGrid = () => {
    if (photos.length === 0) return;
    const canvas = exportRef.current;
    const ctx = canvas.getContext("2d");
    const { cols, rows } = grid;
    const gap = 16;
    const pad = 16;

    // pakai ukuran preview sebagai dasar
    const cellW = previewRef.current.width;
    const cellH = previewRef.current.height;

    const totalW = pad * 2 + cols * cellW + gap * (cols - 1);
    const totalH = pad * 2 + rows * cellH + gap * (rows - 1);
    canvas.width = totalW;
    canvas.height = totalH;

    ctx.fillStyle = frameRef.current;
    ctx.fillRect(0, 0, totalW, totalH);

    const promises = photos.slice(0, cols * rows).map((src, i) => {
      return new Promise((res) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = pad + c * (cellW + gap);
          const y = pad + r * (cellH + gap);
          ctx.save();
          roundedRectPath(ctx, x, y, cellW, cellH, radiusRef.current);
          ctx.clip();
          ctx.drawImage(img, x, y, cellW, cellH);
          ctx.restore();
          res();
        };
      });
    });

    Promise.all(promises).then(() => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mojepict-photobox-grid.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    });
  };

  // helper: path rounded rect
  function roundedRectPath(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="Photobox" />

      <div className="mt-4 p-4 bg-white rounded-xl shadow">
        <h2 className="font-semibold mb-3">Ambil Foto</h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* PREVIEW AREA */}
          <div className="flex-1 flex flex-col items-center gap-3">
            {/* hidden video source */}
            <video ref={videoRef} className="hidden" playsInline />

            {/* canvas preview */}
            <canvas
              ref={previewRef}
              className="w-full max-w-xl border border-gray-200 shadow-sm bg-black"
              style={{ aspectRatio: "16 / 9", borderRadius: `${radius}px` }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={photos.length >= grid.cols * grid.rows}
                onClick={capturePhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all"
              >
                <CameraIcon size={18} /> Capture
              </button>
              <button
                onClick={downloadGrid}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-all"
              >
                <DownloadIcon size={18} /> Download Foto
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-all"
              >
                <Trash2 size={18} /> Clear
              </button>
              <button
                onClick={() => setMirror((m) => !m)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-all"
              >
                <FlipHorizontal2 size={18} /> {mirror ? "Unmirror" : "Mirror"}
              </button>

              {/* === NEW: tombol switch kamera, muncul hanya jika ada depan & belakang === */}
              {canSwitchCamera && (
                <button
                  onClick={toggleCamera}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                  title="Ganti kamera depan/belakang"
                >
                  <RefreshCcwIcon size={18} />
                </button>
              )}
            </div>

            {/* Thumbnail gallery */}
            <div
              className="grid mt-4 w-full max-w-sm shadow"
              style={{
                gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                backgroundColor: frameColor,
                gap: "16px",
                padding: "16px",
              }}
            >
              {photos.map((src, i) => (
                <div key={i} className="relative group p-0">
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    style={{
                      borderRadius: `${radius}px`,
                    }}
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition px-2 py-1 text-xs bg-red-500 text-white rounded"
                  >
                    <XIcon size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <div id="tab" className="flex gap-2">
              <button
                title="Sesuaikan"
                onClick={() => setTab("custom")}
                className={`p-2 text-white rounded-full flex items-center gap-2 h-10 w-10 transition-all ${
                  tab === "custom"
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <Settings2Icon />
              </button>
              <button
                title="Filter"
                onClick={() => setTab("filter")}
                className={`p-2 text-white rounded-full flex items-center gap-2 h-10 w-10 transition-all ${
                  tab === "filter"
                    ? "bg-gray-400 hover:bg-gray-500"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <BlendIcon />
              </button>
            </div>

            {tab === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Brightness
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {brightness}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contrast
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">{contrast}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vignette
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={vignette}
                    onChange={(e) => setVignette(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">{vignette}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Color Temperature
                  </label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={colorTemp}
                    onChange={(e) => setColorTemp(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {colorTemp < 0
                      ? "Cool "
                      : colorTemp > 0
                      ? "Warm "
                      : "Neutral "}
                    ({colorTemp})
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Blur
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={blur}
                    onChange={(e) => setBlur(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">{blur}px</div>
                </div>
              </>
            )}

            {tab === "filter" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Filter
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                  >
                    <option value="none">Tanpa Filter</option>
                    <option value="grayscale(100%)">Grayscale</option>
                    <option value="sepia(100%)">Sepia</option>
                    <option value="contrast(150%)">Kontras Tinggi</option>
                    <option value="brightness(120%)">Lebih Terang</option>
                    <option value="blur(1px)">Blur</option>
                    <option value="brightness(110%) contrast(90%) saturate(120%) blur(0.3px)">
                      Sweet Look
                    </option>
                    <option value="sepia(0.5) saturate(150%)">Warm Tone</option>
                    <option value="brightness(110%) contrast(120%) hue-rotate(180deg)">
                      Cold Tone
                    </option>
                    <option value="sepia(0.6) contrast(0.9) brightness(1.1)">
                      Vintage
                    </option>
                    <option value="contrast(200%) brightness(80%)">
                      Dramatic
                    </option>
                    <option value="brightness(120%) contrast(80%) saturate(80%)">
                      Washed Out
                    </option>
                    <option value="blur(0.5px) brightness(115%)">
                      Soft Glow
                    </option>
                    <option value="grayscale(100%) contrast(150%)">
                      B&amp;W High Contrast
                    </option>
                    <option value="sepia(0.4) brightness(110%) hue-rotate(-10deg)">
                      Golden Hour
                    </option>
                    <option value="brightness(70%) contrast(130%) hue-rotate(210deg)">
                      Midnight
                    </option>
                    <option value="invert(100%)">Inverted</option>
                    <option value="saturate(160%)">Saturate+</option>
                    <option value="contrast(140%) brightness(105%)">
                      Punchy
                    </option>
                    <option value="brightness(115%) contrast(90%) saturate(120%)">
                      Soft
                    </option>
                    <option value="brightness(105%) contrast(95%) saturate(120%) sepia(0.5) hue-rotate(-10deg)">
                      Retro 70s
                    </option>
                    <option value="brightness(110%) contrast(90%) saturate(85%) sepia(0.3) blur(0.4px)">
                      Retro 80s
                    </option>
                    <option value="brightness(95%) contrast(110%) saturate(110%) hue-rotate(10deg)">
                      Retro 90s
                    </option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Radius
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">{radius}px</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Grid
              </label>
              <select
                value={`${grid.cols}x${grid.rows}`}
                onChange={(e) => {
                  const [cols, rows] = e.target.value.split("x").map(Number);
                  setGrid({ cols, rows });
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="2x3">2×3</option>
                <option value="3x3">3×3</option>
                <option value="2x2">2×2</option>
                <option value="4x3">4×3</option>
                <option value="1x4">1×4 strip</option>
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Terisi {Math.min(photos.length, grid.cols * grid.rows)} /{" "}
                {grid.cols * grid.rows}
              </div>
            </div>

            {/* Frame Style */}
            <label className="block text-sm font-medium text-gray-700">
              Frame
              <select
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="white">Putih</option>
                <option value="black">Hitam</option>
                <option value="red">Merah</option>
                <option value="yellow">Kuning</option>
                <option value="green">Hijau</option>
                <option value="blue">Biru</option>
                <option value="purple">Ungu</option>
                <option value="pink">Pink</option>
              </select>
            </label>

            {/* Grid */}
            <label className="block text-sm font-medium text-gray-700">
              Jenis Grid
              <select
                value={`${grid.cols}x${grid.rows}`}
                onChange={(e) => {
                  const [cols, rows] = e.target.value.split("x").map(Number);
                  setGrid({ cols, rows });
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <option value="2x3">2x3</option>
                <option value="3x3">3x3</option>
                <option value="2x2">2x2</option>
                <option value="4x3">4x3</option>
              </select>
            </label>

            <div className="text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw size={14} />
              Preview di-render realtime via canvas; hasil capture = sama persis
              dengan preview.
            </div>
          </div>
        </div>

        {/* Canvas export tersembunyi */}
        <canvas ref={exportRef} className="hidden" />
      </div>
    </div>
  );
}
