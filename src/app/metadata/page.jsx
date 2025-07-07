"use client";

import TitlePage from "@/components/TitlePage";
import React, { useRef, useState } from "react";
import * as exifr from "exifr";

export default function ImageMetadataViewer() {
  const [imageFile, setImageFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const inputRef = useRef(null);

  const handleSelectFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(URL.createObjectURL(file));
      try {
        const result = await exifr.parse(file);
        setMetadata(result);
      } catch (err) {
        console.error("Failed to read metadata", err);
        setMetadata(null);
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImageFile(URL.createObjectURL(file));
      try {
        const result = await exifr.parse(file);
        setMetadata(result);
      } catch (err) {
        console.error("Failed to read metadata", err);
        setMetadata(null);
      }
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setMetadata(null);
  };

  const handleCopy = () => {
    if (!metadata) return;
    const text = JSON.stringify(metadata, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert("Metadata disalin ke clipboard.");
    });
  };

  const handleDownload = () => {
    if (!metadata) return;
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "metadata.json";
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl="/" title="Metadata Viewer" />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-indigo-500 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleSelectFile}
          ref={inputRef}
          className="hidden"
        />
        <p className="text-gray-500">
          Click to upload or drag and drop an image
        </p>
      </div>

      {imageFile && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Preview</h2>
              <img
                src={imageFile}
                alt="Preview"
                className="mx-auto rounded object-contain max-h-60"
              />
            </div>

            <div className="p-4 bg-white rounded-xl shadow text-left">
              <h2 className="font-semibold mb-2">Metadata</h2>
              {metadata ? (
                <div className="text-sm text-gray-700 space-y-1 max-h-60 overflow-auto">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}</strong>: {String(value)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  Tidak ada metadata yang terbaca.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Salin Metadata
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Metadata
            </button>
          </div>
        </>
      )}
    </div>
  );
}
