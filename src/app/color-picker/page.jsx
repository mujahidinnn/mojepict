"use client";

import TitlePage from "@/components/TitlePage";
import {
  CopyIcon,
  PipetteIcon,
  TrashIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

export default function ColorPickerFromImage() {
  const [imageFile, setImageFile] = useState(null);
  const [pickedColor, setPickedColor] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  const handleImageUpload = (file) => {
    if (!allowedTypes.includes(file.type)) {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP.");
      return;
    }

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const aspectRatio = img.width / img.height;
      const maxHeight = 500;
      const height = maxHeight;
      const width = height * aspectRatio;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      setZoom(1);
      setOffset({ x: 0, y: 0 });
      drawImage();
    };
    img.src = URL.createObjectURL(file);

    setImageFile(file);
    setPickedColor(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, 0, 0);

    const pixel = tempCtx.getImageData(x, y, 1, 1).data;
    const rgb = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    const hsl = rgbToHsl(pixel[0], pixel[1], pixel[2]);

    setPickedColor({ hex, rgb, hsl });
  };

  const rgbToHex = (r, g, b) =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h, s, l;
    l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(
      l * 100
    )}%)`;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const newZoom = e.deltaY < 0 ? zoom + zoomFactor : zoom - zoomFactor;
    setZoom(Math.min(Math.max(newZoom, 0.2), 5));
  };

  const handleMouseDown = (e) => {
    setIsPanning(true);
    setStartPan({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleReset = () => {
    setImageFile(null);
    setPickedColor(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    drawImage();
  }, [zoom, offset]);

  function copyToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Berhasil disalin ke clipboard!");
      });
    } else {
      // fallback kalau browser lama
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Berhasil disalin ke clipboard!");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="Color Picker from Image" />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-500 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={(e) =>
            e.target.files?.[0] && handleImageUpload(e.target.files[0])
          }
          className="hidden"
          ref={inputRef}
        />
        <p className="text-gray-500">
          Klik untuk upload atau drag-drop gambar (JPG, PNG, WEBP)
        </p>
      </div>

      {imageFile && (
        <>
          <div className="mt-4 p-4 bg-white rounded-xl shadow text-center">
            <h2 className="font-semibold mb-3">
              Klik pada gambar untuk ambil warna 🎯
            </h2>
            <canvas
              ref={canvasRef}
              className="mx-auto rounded shadow cursor-crosshair bg-gray-100"
              style={{ maxHeight: "500px" }}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
          </div>

          {pickedColor && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow text-center">
              <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                <PipetteIcon size={18} /> Warna Terpilih
              </h3>
              <div
                className="w-16 h-16 mx-auto rounded border"
                style={{ backgroundColor: pickedColor.hex }}
              ></div>
              <p className="mt-2 text-base text-gray-700 flex items-center justify-center gap-2">
                {pickedColor.hex}
                <CopyIcon
                  role="button"
                  className="cursor-pointer hover:text-gray-700"
                  onClick={() => copyToClipboard(pickedColor.hex)}
                  size={16}
                />
              </p>
              <p className="text-base text-gray-500 flex items-center justify-center gap-2">
                {pickedColor.rgb}
                <CopyIcon
                  role="button"
                  className="cursor-pointer hover:text-gray-700"
                  onClick={() => copyToClipboard(pickedColor.rgb)}
                  size={16}
                />
              </p>
              <p className="text-base text-gray-500 flex items-center justify-center gap-2">
                {pickedColor.hsl}
                <CopyIcon
                  role="button"
                  className="cursor-pointer hover:text-gray-700"
                  onClick={() => copyToClipboard(pickedColor.hsl)}
                  size={16}
                />
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.1, 5))}
              className="flex items-center gap-[2px] px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <ZoomIn size={18} /> Zoom In
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.2))}
              className="flex items-center gap-[2px] px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <ZoomOut size={18} /> Zoom Out
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-[2px] px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <TrashIcon size={18} /> Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
