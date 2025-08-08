"use client";

import TitlePage from "@/components/TitlePage";
import {
  DownloadIcon,
  EraserIcon,
  RotateCcwIcon,
  Undo2Icon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

const CanvasDraw = dynamic(() => import("react-canvas-draw"), { ssr: false });

export default function DrawPage() {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const [bgImage, setBgImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 500 }); // default
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(4);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && allowedTypes.includes(file.type)) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setBgImage(url);
      };
      img.src = url;
    } else {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP, SVG.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && allowedTypes.includes(file.type)) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        setBgImage(url);
      };
      img.src = url;
    } else {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP, SVG.");
    }
  };

  const handleSave = () => {
    const drawingCanvas = canvasRef.current.canvas.drawing;
    const drawingDataUrl = drawingCanvas.toDataURL("image/png");

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = imageSize.width;
      finalCanvas.height = imageSize.height;
      const ctx = finalCanvas.getContext("2d");

      ctx.drawImage(image, 0, 0, imageSize.width, imageSize.height);

      const drawingImg = new Image();
      drawingImg.onload = () => {
        ctx.drawImage(drawingImg, 0, 0, imageSize.width, imageSize.height);
        const finalDataURL = finalCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = finalDataURL;
        link.download = "drawing.png";
        link.click();
      };
      drawingImg.src = drawingDataUrl;
    };
    image.src = bgImage;
  };

  const handleReset = () => {
    setBgImage(null);
    canvasRef.current.clear();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="Draw on Image" />

      {!bgImage && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-500 transition"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.svg"
            onChange={handleImageUpload}
            className="hidden"
            ref={inputRef}
          />
          <p className="text-gray-500">
            Click to upload or drag and drop an image (JPG, PNG, WEBP, SVG)
          </p>
        </div>
      )}

      {bgImage && (
        <>
          <div className="mt-6 p-4 bg-white rounded-xl shadow">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Warna:</span>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Ukuran:</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={brushRadius}
                  onChange={(e) => setBrushRadius(parseInt(e.target.value))}
                  className="w-full accent-gray-600"
                />
                <span className="text-sm text-gray-600">{brushRadius}</span>
              </label>

              <button
                onClick={() => canvasRef.current.undo()}
                className="flex items-center gap-[2px] bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 transition-all"
              >
                <Undo2Icon size={18} /> Undo
              </button>

              <button
                onClick={() => canvasRef.current.clear()}
                className="flex items-center gap-[2px] bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-all"
              >
                <EraserIcon size={18} /> Clear
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-[2px] bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-all"
              >
                <DownloadIcon size={18} /> Simpan Gambar
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-[2px] bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-all"
              >
                <RotateCcwIcon size={18} /> Ganti Gambar
              </button>
            </div>

            <div
              className="relative mx-auto border shadow"
              style={{ width: imageSize.width, height: imageSize.height }}
            >
              <CanvasDraw
                ref={canvasRef}
                imgSrc={bgImage}
                brushColor={brushColor}
                brushRadius={brushRadius}
                canvasWidth={imageSize.width}
                canvasHeight={imageSize.height}
                lazyRadius={0}
                hideGrid
                immediateLoading
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
