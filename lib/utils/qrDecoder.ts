import jsQR from 'jsqr';

export async function decodeQrFromImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Unable to create canvas context'));
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (!code?.data) {
        return reject(new Error('No QR code detected'));
      }
      resolve(code.data);
    };
    img.onerror = () => reject(new Error('Failed to load captured image'));
    img.src = dataUrl;
  });
}