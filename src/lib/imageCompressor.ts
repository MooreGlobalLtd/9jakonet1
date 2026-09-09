/**
 * Utility to compress image files and data URLs using HTML5 Canvas.
 * Solves the Firestore 1MB document size limit by resizing mobile camera photos
 * (which are often 3MB - 12MB) down to 50KB - 120KB without losing visual clarity.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

/**
 * Compresses an image File (e.g. from file input) into a base64 Data URL.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 900,
    quality = 0.72,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const src = reader.result as string;
      compressDataUrl(src, { maxDimension, quality, mimeType })
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 Data URL (e.g. from camera capture or FileReader)
 */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 900,
    quality = 0.72,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve) => {
    // 3-second safety timer so image compression can NEVER hang or block execution
    const timer = setTimeout(() => {
      resolve(dataUrl);
    }, 3000);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => {
      clearTimeout(timer);
      resolve(dataUrl);
    };

    img.onload = () => {
      clearTimeout(timer);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          resolve(dataUrl);
          return;
        }

        // Scale down proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Fill background white in case of transparent PNG/WebP turning into JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        let compressed = canvas.toDataURL(mimeType, quality);

        // Extra safeguard: if still > 350KB, compress further to 0.5 quality
        if (compressed.length > 350000) {
          compressed = canvas.toDataURL(mimeType, 0.5);
        }

        resolve(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        resolve(dataUrl);
      }
    };

    img.src = dataUrl;
  });
}
