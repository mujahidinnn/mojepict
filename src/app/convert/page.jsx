"use client";

import TitlePage from "@/components/TitlePage";
import { DownloadIcon, FileCogIcon, TrashIcon } from "lucide-react";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

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
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP, SVG.");
      return;
    }
    setOriginalImage(file);
    setConvertedImageUrl(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      alert("Format tidak didukung. Hanya JPG, PNG, WEBP, SVG.");
      return;
    }
    setOriginalImage(file);
    setConvertedImageUrl(null);
  };

  const convertImage = () => {
    if (!originalImage) return;
    setLoading(true);

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = img.width || 800;
        const height = img.height || 600;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          alert("Canvas tidak didukung.");
          setLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (outputFormat === "pdf") {
          const pdf = new jsPDF();
          const ratio = width / height;
          const pdfWidth = 210;
          const pdfHeight = pdfWidth / ratio;
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

          const pdfBlob = pdf.output("blob");
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setConvertedImageUrl(pdfUrl);
        } else {
          const convertedUrl = canvas.toDataURL(outputFormat, 0.9);
          setConvertedImageUrl(convertedUrl);
        }

        setLoading(false);
      };

      img.onerror = () => {
        alert("Gagal memuat gambar.");
        setLoading(false);
      };

      if (originalImage.type === "image/svg+xml") {
        const svgContent = reader.result;
        const encoded = encodeURIComponent(svgContent);
        img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;
      } else {
        img.src = reader.result;
      }
    };

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
      case "pdf":
        return "pdf";
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
      <TitlePage backUrl="/" title="Image Format Converter" />

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
          Klik untuk upload atau drag-drop gambar (JPG, PNG, WEBP, SVG)
        </p>
      </div>

      {originalImage && (
        <>
          <div className="mt-4 bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Convert Ke Format</h2>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mt-1 w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              <option value="image/jpeg">JPG (image/jpeg)</option>
              <option value="image/png">PNG (image/png)</option>
              <option value="image/webp">WEBP (image/webp)</option>
              <option value="pdf">PDF (application/pdf)</option>
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

            {convertedImageUrl && outputFormat !== "pdf" && (
              <div className="p-4 bg-white rounded-xl shadow text-center">
                <h2 className="font-semibold mb-2">Converted Image Preview</h2>
                <img
                  src={convertedImageUrl}
                  alt="converted"
                  className="mx-auto rounded object-contain max-h-60"
                />
                <p>{`${
                  originalImage.name.split(".")[0]
                }-converted.${getExtension()}`}</p>
                <a
                  href={convertedImageUrl}
                  download={`${
                    originalImage.name.split(".")[0]
                  }-converted.${getExtension()}`}
                  className="flex items-center gap-[2px] px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-max m-auto mt-3"
                >
                  <DownloadIcon size={18} /> Download{" "}
                  {getExtension().toUpperCase()}
                </a>
              </div>
            )}

            {convertedImageUrl && outputFormat === "pdf" && (
              <div className="p-4 bg-white rounded-xl shadow text-center">
                <h2 className="font-semibold mb-2">Preview PDF</h2>
                <div className="w-[300px] aspect-[100/141] mx-auto">
                  <iframe
                    src={convertedImageUrl}
                    className="w-full h-full border rounded overflow-hidden"
                    title="PDF Preview"
                  />
                </div>
                <a
                  href={convertedImageUrl}
                  download={`${originalImage.name.split(".")[0]}-converted.pdf`}
                  className="flex items-center gap-[2px] px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-max m-auto mt-3"
                >
                  <DownloadIcon size={18} /> Download PDF
                </a>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={convertImage}
              disabled={loading || !originalImage}
              className="flex items-center gap-[2px] px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              <FileCogIcon size={18} />{" "}
              {loading
                ? "Converting..."
                : `Convert to ${getExtension().toUpperCase()}`}
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
