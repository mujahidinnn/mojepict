"use client";

import TitlePage from "@/components/TitlePage";
import { useState, useRef } from "react";

export default function ImageResize() {
  const MAX_WIDTH = 2480;
  const MAX_HEIGHT = 3508;

  const [originalImage, setOriginalImage] = useState(null);
  const [resizedImageUrl, setResizedImageUrl] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleImageUpload = (e) => {
    const img = e.target.files?.[0];
    if (img) {
      const imageObject = new Image();
      imageObject.onload = () => {
        setOriginalSize({
          width: imageObject.width,
          height: imageObject.height,
        });
        setWidth(imageObject.width);
        setHeight(imageObject.height);
      };
      imageObject.src = URL.createObjectURL(img);

      setOriginalImage(img);
      setResizedImageUrl(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const img = e.dataTransfer.files?.[0];
    if (img) {
      const imageObject = new Image();
      imageObject.onload = () => {
        setOriginalSize({
          width: imageObject.width,
          height: imageObject.height,
        });
        setWidth(imageObject.width);
        setHeight(imageObject.height);
      };
      imageObject.src = URL.createObjectURL(img);

      setOriginalImage(img);
      setResizedImageUrl(null);
    }
  };

  const resizeImage = () => {
    if (!originalImage) return;
    setLoading(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedUrl = canvas.toDataURL("image/jpeg", 0.9);
        setResizedImageUrl(resizedUrl);
      }

      setLoading(false);
    };
    img.src = URL.createObjectURL(originalImage);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResizedImageUrl(null);
    setOriginalSize({ width: 0, height: 0 });
    setWidth(800);
    setHeight(600);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl={"/"} title={"Image Resizer"} />

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
          Click to upload or drag and drop an image
        </p>
      </div>

      {originalImage && (
        <>
          <div className="mt-4 bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Resize Settings</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={MAX_WIDTH}
                  value={width}
                  onChange={(e) =>
                    setWidth(Math.min(Number(e.target.value), MAX_WIDTH))
                  }
                  className="mt-1 w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {width > MAX_WIDTH && (
                  <p className="text-sm text-red-500">
                    Max width is {MAX_WIDTH}px
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={MAX_HEIGHT}
                  value={height}
                  onChange={(e) =>
                    setHeight(Math.min(Number(e.target.value), MAX_HEIGHT))
                  }
                  className="mt-1 w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {height > MAX_HEIGHT && (
                  <p className="text-sm text-red-500">
                    Max height is {MAX_HEIGHT}px
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Original Image</h2>
              <img
                src={URL.createObjectURL(originalImage)}
                alt="original"
                className="mx-auto rounded object-contain max-h-60"
              />
              <p>
                Ukuran original: {originalSize.width} x {originalSize.height}
              </p>
            </div>

            {resizedImageUrl && (
              <div className="p-4 bg-white rounded-xl shadow text-center">
                <h2 className="font-semibold mb-2">Resized Image</h2>
                <img
                  src={resizedImageUrl}
                  alt="resized"
                  className="mx-auto rounded max-h-60 object-contain"
                />
                <a
                  href={resizedImageUrl}
                  download="resized-image.jpg"
                  className="inline-block mt-2 px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-700"
                >
                  Download
                </a>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resizeImage}
              disabled={loading || !originalImage}
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Resizing..." : "Resize Image"}
            </button>

            {(resizedImageUrl || originalImage) && (
              <button
                onClick={handleReset}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reset
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
