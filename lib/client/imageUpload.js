const TARGET_IMAGE_SIZE_BYTES = 100 * 1024;
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileNameToBase = (name = 'image') => name.replace(/\.[^/.]+$/, '') || 'image';

const readImageElement = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像データの読み込みに失敗しました。'));
    };

    img.src = url;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('画像の圧縮に失敗しました。'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

export const compressImageTo100KB = async (file) => {
  if (!file) {
    throw new Error('画像ファイルが指定されていません。');
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error('JPEG/PNG/WebP形式の画像のみ対応しています。');
  }

  const image = await readImageElement(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('画像処理コンテキストの初期化に失敗しました。');
  }

  let scale = 1;
  const maxDimension = 1920;
  const longestSide = Math.max(image.width, image.height);
  if (longestSide > maxDimension) {
    scale = maxDimension / longestSide;
  }

  let bestSize = Number.MAX_SAFE_INTEGER;

  for (let resizeStep = 0; resizeStep < 7; resizeStep += 1) {
    const width = Math.max(1, Math.floor(image.width * scale));
    const height = Math.max(1, Math.floor(image.height * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    for (let quality = 0.9; quality >= 0.45; quality -= 0.08) {
      const blob = await canvasToBlob(canvas, 'image/webp', Number(quality.toFixed(2)));

      if (blob.size < bestSize) {
        bestSize = blob.size;
      }

      if (blob.size <= TARGET_IMAGE_SIZE_BYTES) {
        const compressedFile = new File([blob], `${fileNameToBase(file.name)}.webp`, {
          type: 'image/webp',
          lastModified: Date.now(),
        });

        return {
          file: compressedFile,
          originalSize: file.size,
          compressedSize: blob.size,
          targetSize: TARGET_IMAGE_SIZE_BYTES,
        };
      }
    }

    scale *= 0.85;
  }

  throw new Error('100KB以下に圧縮できませんでした。解像度の低い画像をお試しください。');
};

export const uploadCompressedImage = async ({ file, userId, purpose = 'inline' }) => {
  if (!userId) {
    throw new Error('画像アップロードにはログインが必要です。');
  }

  const compressed = await compressImageTo100KB(file);
  const formData = new FormData();
  formData.append('file', compressed.file);
  formData.append('userId', userId);
  formData.append('purpose', purpose);

  const res = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '画像のアップロードに失敗しました。');
  }

  return {
    ...data,
    compression: {
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      targetSize: compressed.targetSize,
    },
  };
};
