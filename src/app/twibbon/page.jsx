"use client";

import { useRef, useState, useEffect } from "react";
import { DownloadIcon } from "lucide-react";
import TitlePage from "@/components/TitlePage";

export default function TwibbonPage() {
  const canvasRef = useRef(null);
  const [photoElement, setPhotoElement] = useState(null);
  const [twibbonElement, setTwibbonElement] = useState(null);

  const [photoPos, setPhotoPos] = useState({ x: 100, y: 100 });
  const [photoSize, setPhotoSize] = useState({ width: 300, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [photoFilter, setPhotoFilter] = useState("none");

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setPhotoElement(img);
    img.src = url;
  };

  const handleTwibbonUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      alert("Twibbon harus berupa file PNG dengan latar transparan.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setTwibbonElement(img);
    img.src = url;
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (photoElement) {
      ctx.save();
      ctx.filter = photoFilter;
      ctx.drawImage(
        photoElement,
        photoPos.x,
        photoPos.y,
        photoSize.width,
        photoSize.height
      );
      ctx.restore();
    }

    if (twibbonElement) {
      ctx.drawImage(twibbonElement, 0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [photoElement, twibbonElement, photoPos, photoSize, photoFilter]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / canvasRef.current.clientWidth;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    if (
      x >= photoPos.x &&
      x <= photoPos.x + photoSize.width &&
      y >= photoPos.y &&
      y <= photoPos.y + photoSize.height
    ) {
      setIsDragging(true);
      dragOffset.current = {
        x: x - photoPos.x,
        y: y - photoPos.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = canvasRef.current.width / canvasRef.current.clientWidth;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;

    setPhotoPos({
      x: x - dragOffset.current.x,
      y: y - dragOffset.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setPhotoSize((prev) => ({
      width: prev.width * (1 + delta),
      height: prev.height * (1 + delta),
    }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "twibboned.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <TitlePage backUrl="/" title="Twibbon" />

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="flex-1 space-y-4">
          <div>
            <label className="block mb-1">Unggah Twibbon (PNG)</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleTwibbonUpload}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div>
            <label className="block mb-1">Unggah Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div>
            <label className="block mb-1">Filter Foto</label>
            <select
              value={photoFilter}
              onChange={(e) => setPhotoFilter(e.target.value)}
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
              <option value="contrast(200%) brightness(80%)">Dramatic</option>
              <option value="brightness(120%) contrast(80%) saturate(80%)">
                Washed Out
              </option>
              <option value="blur(0.5px) brightness(115%)">Soft Glow</option>
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
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={!photoElement || !twibbonElement}
            className="inline-flex items-center mt-4 px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="w-4 h-4 mr-2" /> Download
          </button>
        </div>

        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={1080}
            height={1080}
            className="mx-auto bg-white border border-gray-200 rounded shadow-md"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ width: "540px", height: "540px" }}
          />
        </div>
      </div>
    </div>
  );
}
