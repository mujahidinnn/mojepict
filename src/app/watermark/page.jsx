"use client";

import { useEffect, useRef, useState } from "react";
import { DeleteIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";
import TitlePage from "@/components/TitlePage";

export default function WatermarkPage() {
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const [bgImage, setBgImage] = useState(null);
  const [imageElement, setImageElement] = useState(null);

  const [watermarkText, setWatermarkText] = useState("\u00a9 mojepict");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [opacity, setOpacity] = useState(0.9);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [textPosition, setTextPosition] = useState("bottom-right");
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const [isDraggingText, setIsDraggingText] = useState(false);

  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkImgElement, setWatermarkImgElement] = useState(null);

  const [imgPos, setImgPos] = useState({ x: 50, y: 50 });
  const [imgSize, setImgSize] = useState({ width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && allowedTypes.includes(file.type)) {
      const url = URL.createObjectURL(file);
      setBgImage(url);

      const img = new Image();
      img.onload = () => setImageElement(img);
      img.src = url;
    } else {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP.");
    }
  };

  const handleWatermarkImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setWatermarkImage(url);

    const img = new Image();
    img.onload = () => {
      setWatermarkImgElement(img);
      setImgSize({
        width: img.width * 0.2,
        height: img.height * 0.2,
      });
    };
    img.src = url;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !imageElement) return;

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0);

    if (watermarkImgElement) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(
        watermarkImgElement,
        imgPos.x,
        imgPos.y,
        imgSize.width,
        imgSize.height
      );
      ctx.globalAlpha = 1;
    }

    if (watermarkText.trim() !== "") {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = textColor;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillText(watermarkText, textPos.x, textPos.y);
      ctx.globalAlpha = 1;
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [
    imageElement,
    watermarkImgElement,
    imgPos,
    imgSize,
    watermarkText,
    textColor,
    fontSize,
    opacity,
    fontFamily,
    textPos,
  ]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      watermarkImgElement &&
      x >= imgPos.x &&
      x <= imgPos.x + imgSize.width &&
      y >= imgPos.y &&
      y <= imgPos.y + imgSize.height
    ) {
      setIsDragging(true);
      dragOffset.current = {
        x: x - imgPos.x,
        y: y - imgPos.y,
      };
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(watermarkText).width;
    const textHeight = fontSize;

    if (
      x >= textPos.x &&
      x <= textPos.x + textWidth &&
      y >= textPos.y - textHeight &&
      y <= textPos.y
    ) {
      setIsDraggingText(true);
      dragOffset.current = {
        x: x - textPos.x,
        y: y - textPos.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      setImgPos({
        x: x - dragOffset.current.x,
        y: y - dragOffset.current.y,
      });
    } else if (isDraggingText) {
      setTextPos({
        x: x - dragOffset.current.x,
        y: y - dragOffset.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingText(false);
  };

  const handleWheel = (e) => {
    if (!canvasRef.current || !watermarkImgElement) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setImgSize((prev) => ({
      width: prev.width * (1 + delta),
      height: prev.height * (1 + delta),
    }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "mojepict-watermarked.png";
    link.click();
  };

  const handleReset = () => {
    setBgImage(null);
    setImageElement(null);
    setWatermarkImage(null);
    setWatermarkImgElement(null);
    setWatermarkText("\u00a9 mojepict");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="Watermark" />

      {!bgImage && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-gray-500 transition"
          onClick={() => inputRef.current?.click()}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
            ref={inputRef}
          />
          <p className="text-gray-500">
            Klik untuk mengunggah gambar (JPG, PNG, WEBP)
          </p>
        </div>
      )}

      {bgImage && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 block">
                Teks watermark
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                {watermarkText && (
                  <DeleteIcon
                    className="cursor-pointer absolute right-[7px] top-[7px] text-gray-600"
                    onClick={() => {
                      setWatermarkText("");
                    }}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Gambar/logo watermark
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWatermarkImageUpload}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />

                {watermarkImage && (
                  <DeleteIcon
                    className="cursor-pointer absolute right-[7px] top-[7px] text-gray-600"
                    onClick={() => {
                      setWatermarkImage(null);
                      setWatermarkImgElement(null);
                    }}
                  />
                )}
              </div>

              <p className="text-gray-500 text-xs">
                * Scroll pada gambar/logo watermak untuk menyesuaikan ukuran
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Warna teks watermark
              </label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Font teks watermark
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Ukuran Font teks watermark
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-gray-600"
              />
              <span className="ml-2 text-gray-600 text-sm">{fontSize}px</span>
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Transparansi teks watermak
              </label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.1}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-gray-600"
              />
              <span className="ml-2 text-gray-600 text-sm">
                {Math.round(opacity * 100)}%
              </span>
            </div>

            <div>
              <label className="text-sm text-gray-700 block">
                Posisi Teks watermak
              </label>
              <select
                value={textPosition}
                onChange={(e) => setTextPosition(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              >
                <option value="top-left">Kiri Atas</option>
                <option value="top-right">Kanan Atas</option>
                <option value="bottom-left">Kiri Bawah</option>
                <option value="bottom-right">Kanan Bawah</option>
              </select>
            </div>
          </div>

          <div className="my-6">
            <canvas
              ref={canvasRef}
              className="border mx-auto max-w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              <DownloadIcon size={18} /> Unduh
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              <RotateCcwIcon size={18} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
