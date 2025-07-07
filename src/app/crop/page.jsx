"use client";

import TitlePage from "@/components/TitlePage";
import React, { useState, useRef, useCallback } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function ImageCropper() {
  const [upImg, setUpImg] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 50,
    aspect: undefined,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const inputRef = useRef(null);

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUpImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onAspectChange = (e) => {
    const val = e.target.value;
    setCrop((c) => ({
      ...c,
      aspect: val === "custom" ? undefined : Number(val),
    }));
  };

  const onImageLoad = useCallback((img) => {
    imgRef.current = img;
  }, []);

  const generateCrop = () => {
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    if (!crop || !canvas || !image) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  };

  const downloadCroppedImage = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "cropped-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setUpImg(null);
    setCompletedCrop(null);
    imgRef.current = null;
    previewCanvasRef.current?.getContext("2d")?.clearRect(0, 0, 9999, 9999);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <TitlePage backUrl={"/"} title={"Image Cropper"} />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-indigo-500 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={onSelectFile}
          ref={inputRef}
          className="hidden"
        />
        <p className="text-gray-500">
          Click to upload or drag and drop an image
        </p>
      </div>

      {upImg && (
        <>
          <div className="mt-4 bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Crop Settings</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aspect Ratio
                </label>
                <select
                  onChange={onAspectChange}
                  defaultValue="custom"
                  className="mt-1 w-40 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="custom">Custom</option>
                  <option value="1">1:1 (Square)</option>
                  <option value={(4 / 3).toFixed(2)}>4:3</option>
                  <option value={(16 / 9).toFixed(2)}>16:9</option>
                </select>
              </div>
              <div className="flex-1 mt-4 sm:mt-0">
                <ReactCrop
                  crop={crop}
                  onChange={setCrop}
                  onComplete={setCompletedCrop}
                  keepSelection
                >
                  <img
                    ref={imgRef}
                    src={upImg}
                    onLoad={(e) => onImageLoad(e.currentTarget)}
                    className="max-h-[300px] mx-auto rounded"
                  />
                </ReactCrop>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="p-4 bg-white rounded-xl shadow text-center">
              <h2 className="font-semibold mb-2">Cropped Preview</h2>
              <canvas
                ref={previewCanvasRef}
                className="mx-auto border rounded max-h-60"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={generateCrop}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Crop & Preview
            </button>
            <button
              onClick={downloadCroppedImage}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset
            </button>
          </div>
        </>
      )}
    </div>
  );
}
