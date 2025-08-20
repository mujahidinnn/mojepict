"use client";

import TitlePage from "@/components/TitlePage";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { DownloadIcon } from "lucide-react";

export default function QrGenerator() {
  const [text, setText] = useState("");
  const [qrColor, setQrColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(256);
  const [logo, setLogo] = useState(null);
  const [logoSize, setLogoSize] = useState(60);
  const [logoRadius, setLogoRadius] = useState(6);

  const canvasRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "mojepict-qr-code.png";
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="QR Code Generator" />

      <div className="mt-4 p-4 bg-white rounded-xl shadow">
        <h2 className="font-semibold mb-3">Buat QR Code</h2>

        <div className="flex flex-col gap-4">
          {/* Input text/link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teks / Link
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Masukkan teks atau link"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Warna QR */}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warna QR
              </label>
              <input
                type="color"
                value={qrColor}
                onChange={(e) => setQrColor(e.target.value)}
                className="cursor-pointer w-12 h-10 p-1 rounded-md border border-gray-300 bg-white text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warna Latar
              </label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="cursor-pointer w-12 h-10 p-1 rounded-md border border-gray-300 bg-white text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>
          </div>

          {/* Ukuran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ukuran QR (px)
            </label>
            <input
              type="number"
              value={size}
              min={128}
              max={512}
              step={16}
              onChange={(e) => setSize(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Upload Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo di tengah (opsional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>

          {/* Kontrol Logo */}
          {logo && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ukuran Logo (px)
                </label>
                <input
                  type="range"
                  min={30}
                  max={size / 2}
                  value={logoSize}
                  onChange={(e) => setLogoSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius Logo (px)
                </label>
                <input
                  type="range"
                  min={0}
                  max={logoSize / 2}
                  value={logoRadius}
                  onChange={(e) => setLogoRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {text && (
        <div className="mt-6 p-4 bg-white rounded-xl shadow text-center">
          <h3 className="font-semibold mb-3">QR Code Preview 👇</h3>
          <div className="relative inline-block">
            <QRCodeCanvas
              ref={canvasRef}
              value={text}
              size={size}
              fgColor={qrColor}
              bgColor={bgColor}
              level="H"
              includeMargin={true}
            />
            {logo && (
              <img
                src={logo}
                alt="logo"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: `${logoSize}px`,
                  height: `${logoSize}px`,
                  borderRadius: `${logoRadius}px`,
                }}
              />
            )}
          </div>

          <button
            onClick={handleDownload}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <DownloadIcon size={18} /> Download QR
          </button>
        </div>
      )}
    </div>
  );
}
