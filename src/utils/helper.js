export const formatFileSize = (sizeInBytes) => {
  if (sizeInBytes >= 1048576) {
    return (sizeInBytes / 1048576).toFixed(2) + " MB";
  } else {
    return (sizeInBytes / 1024).toFixed(2) + " KB";
  }
};

export const fallbackImage = (text) =>
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
    <rect width='100%' height='100%' fill='#e2e8f0'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#666' font-size='16'>
      ${text}
    </text>
  </svg>`);

export const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject("Canvas is empty");
        const fileUrl = URL.createObjectURL(blob);
        resolve(fileUrl);
      }, "image/png");
    };
    image.onerror = () => reject("Image load error");
  });
};
