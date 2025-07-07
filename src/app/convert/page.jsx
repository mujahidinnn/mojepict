"use client";

import TitlePage from "@/components/TitlePage";
import { useState, useRef } from "react";

export default function ImageConvert() {
  const [originalImage, setOriginalImage] = useState(null);
  const [convertedImageUrl, setConvertedImageUrl] = useState(null);
  const [outputFormat, setOutputFormat] = useState("image/jpeg");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Format tidak didukung. Hanya mendukung JPG, PNG, WEBP, dan SVG."
        );
        return;
      }
      setOriginalImage(file);
      setConvertedImageUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Format tidak didukung. Hanya mendukung JPG, PNG, WEBP, dan SVG."
        );
        return;
      }
      setOriginalImage(file);
      setConvertedImageUrl(null);
    }
  };

  const convertImage = () => {
    if (!originalImage) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const convertedUrl = canvas.toDataURL(outputFormat, 0.9);
          setConvertedImageUrl(convertedUrl);
        }
        setLoading(false);
      };
      img.onerror = () => {
        alert("Gagal memuat gambar.");
        setLoading(false);
      };

      // Jika SVG, gunakan data URI
      if (originalImage.type === "image/svg+xml") {
        const svgContent = reader.result;
        const encoded = encodeURIComponent(svgContent);
        img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
      } else {
        img.src = reader.result;
      }
    };

    // Baca sebagai text jika SVG, kalau bukan pakai dataURL
    if (originalImage.type === "image/svg+xml") {
      reader.readAsText(originalImage);
    } else {
      reader.readAsDataURL(originalImage);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setConvertedImageUrl(null);
    setLoading(false);
  };

  const getExtension = () => {
    switch (outputFormat) {
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "image/jpeg":
        return "jpg";
      default:
        return "img";
    }
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (sizeInBytes >= 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${sizeInBytes} bytes`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl={"/"} title={"Image Format Converter"} />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-indigo-500 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          ref={inputRef}
        />
        <p className="text-gray-500">
          Click to upload or drag and drop an image (JPG, PNG, WEBP, SVG)
        </p>
      </div>

      {originalImage && (
        <>
          <div className="mt-4 bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Convert To Format</h2>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mt-1 w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="image/jpeg">JPG (image/jpeg)</option>
              <option value="image/png">PNG (image/png)</option>
              <option value="image/webp">WEBP (image/webp)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Original Image</h2>
              <img
                src={URL.createObjectURL(originalImage)}
                alt="original"
                className="mx-auto rounded object-contain max-h-60"
              />
              <p className="mt-2 text-sm text-gray-600 font-medium">
                {originalImage.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(originalImage.size)} — {originalImage.type}
              </p>
            </div>

            {convertedImageUrl && (
              <div className="p-4 bg-white rounded-xl shadow text-center">
                <h2 className="font-semibold mb-2">Converted Image</h2>
                <img
                  src={convertedImageUrl}
                  alt="converted"
                  className="mx-auto rounded object-contain max-h-60"
                />
                <a
                  href={convertedImageUrl}
                  download={`converted.${getExtension()}`}
                  className="inline-block mt-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-800"
                >
                  Download as {getExtension().toUpperCase()}
                </a>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={convertImage}
              disabled={loading || !originalImage}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Converting..." : "Convert Image"}
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
