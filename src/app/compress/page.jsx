"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { fallbackImage, formatFileSize } from "@/utils/helper";
import TitlePage from "@/components/TitlePage";

const getCompressionDescription = (percent) => {
  if (percent <= 20) return `${percent}% – Low Quality (More Compression)`;
  if (percent <= 40) return `${percent}% – Medium-Low Quality`;
  if (percent <= 60) return `${percent}% – Standard Quality`;
  if (percent <= 80) return `${percent}% – High Quality`;
  if (percent <= 100) return `${percent}% – Best Quality (Less Compression)`;
  return "";
};

export default function Compress() {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [compressionPercent, setCompressionPercent] = useState(50);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleImageUpload = (e) => {
    const image = e.target.files?.[0];
    if (image) {
      setOriginalImage(image);
      setCompressedImage(null);
    }
  };

  const handleCompress = async () => {
    if (!originalImage) return;
    setLoading(true);

    const safePercent = Math.max(compressionPercent, 10);
    const originalSizeMB = originalImage.size / 1024 / 1024;
    const maxSizeMB = (safePercent / 100) * originalSizeMB;

    const options = {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressed = await imageCompression(originalImage, options);
      setCompressedImage(compressed);
    } catch (err) {
      console.error("Compression error:", err);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setCompressionPercent(50);
    setLoading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const image = e.dataTransfer.files?.[0];
    if (image) {
      setOriginalImage(image);
      setCompressedImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl={"/"} title={"Image Compressor"} />

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
          disabled={loading}
        />
        <p className="text-gray-500">
          Click to upload or drag and drop an image
        </p>
      </div>

      {originalImage && (
        <>
          <div className="mt-3">
            <label className="block font-medium mb-2">
              Compression Level: {compressionPercent}%
            </label>

            <ul className="text-xs text-gray-600 list-disc list-inside max-w-md">
              <li>
                <strong>≤ 20%</strong>: Low Quality (More Compression)
              </li>
              <li>
                <strong>21% – 40%</strong>: Medium-Low Quality
              </li>
              <li>
                <strong>41% – 60%</strong>: Standard Quality
              </li>
              <li>
                <strong>61% – 80%</strong>: High Quality
              </li>
              <li>
                <strong>81% – 100%</strong>: Best Quality (Less Compression)
              </li>
            </ul>

            <p className="text-xs text-gray-500">Minimum: 10%, Maximum: 100%</p>

            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={compressionPercent}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), 10);
                setCompressionPercent(val);
              }}
              className="w-full accent-indigo-600"
              disabled={!!compressedImage}
            />

            <p className="mt-1 text-sm text-gray-600 italic text-center">
              {getCompressionDescription(compressionPercent)}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Original Image</h2>
              {originalImage ? (
                <>
                  <img
                    src={URL.createObjectURL(originalImage)}
                    alt="original"
                    className="mx-auto rounded max-h-60 object-contain"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Size: {formatFileSize(originalImage.size)}
                  </p>
                </>
              ) : (
                <img
                  src={fallbackImage("No original image")}
                  alt="No original"
                  className="mx-auto rounded max-h-60 object-contain opacity-50"
                />
              )}
            </div>

            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Compressed Image</h2>
              {compressedImage ? (
                <>
                  <img
                    src={URL.createObjectURL(compressedImage)}
                    alt="compressed"
                    className="mx-auto rounded max-h-60 object-contain"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Size: {formatFileSize(compressedImage.size)}
                  </p>
                  <a
                    href={URL.createObjectURL(compressedImage)}
                    download="compressed.jpg"
                    className="inline-block mt-2 px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-700"
                  >
                    Download
                  </a>
                </>
              ) : (
                <img
                  src={fallbackImage("No compressed image")}
                  alt="No compressed"
                  className="mx-auto rounded max-h-60 object-contain opacity-50"
                />
              )}
            </div>
          </div>
        </>
      )}
      {originalImage && (
        <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCompress}
            disabled={loading || !!compressedImage}
            className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Compressing..." : "Compress Image"}
          </button>

          {compressedImage && (
            <button
              onClick={handleReset}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset & Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
