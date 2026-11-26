import {getFriendlyErrorMessage, supabase} from './supabase';

export const MENU_IMAGES_BUCKET = 'menu-images';
const MAX_RAW_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface UploadedImageResult {
  path: string;
  publicUrl: string;
}

export function validateImageFile(file: File): {valid: boolean; error?: string} {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please choose a JPG, PNG, or WebP photograph.',
    };
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    return {
      valid: false,
      error: 'Image file is larger than 5 MB. Please select a smaller photograph.',
    };
  }
  return {valid: true};
}

export async function validateImageFileBytes(file: File): Promise<{valid: boolean; error?: string}> {
  const basic = validateImageFile(file);
  if (!basic.valid) return basic;

  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isPng =
      header.length >= 8 &&
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47 &&
      header[4] === 0x0d &&
      header[5] === 0x0a &&
      header[6] === 0x1a &&
      header[7] === 0x0a;
    const isWebp =
      header.length >= 12 &&
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      return {
        valid: false,
        error: 'The selected file does not match a valid JPG, PNG, or WebP image signature.',
      };
    }

    return {valid: true};
  } catch {
    return {valid: false, error: 'Unable to verify image file contents.'};
  }
}

/**
 * Resizes oversized photos client-side (max 1200px wide) and re-encodes via canvas
 * to WebP/PNG so mobile customers get fast loading times and EXIF/polyglot data is stripped.
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<{blob: Blob; extension: 'png' | 'webp'; contentType: 'image/png' | 'image/webp'}> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to decode selected image file.'));
      image.src = bitmapUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Image processing is not supported in this browser.');
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Prefer WebP for smaller payloads; preserve PNG transparency for logos if needed
    const preferPng = file.type === 'image/png' && maxDimension <= 600;
    const outputType = preferPng ? 'image/png' : 'image/webp';
    const extension = preferPng ? 'png' : 'webp';

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), outputType, quality)
    );

    if (!blob) {
      throw new Error('Could not safely re-encode image for upload.');
    }

    return {blob, extension, contentType: outputType};
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export async function uploadMenuImage(
  file: File,
  folder: 'products' | 'logos',
  onProgress?: (percent: number, stage: string) => void
): Promise<UploadedImageResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const validation = await validateImageFileBytes(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.(20, 'Optimizing image...');
  const maxDim = folder === 'logos' ? 512 : 1200;
  const optimized = await optimizeImageForUpload(file, maxDim, 0.86);

  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const filePath = `${folder}/${uniqueId}.${optimized.extension}`;

  onProgress?.(55, 'Uploading to Supabase Storage...');
  const {error: uploadError} = await supabase.storage
    .from(MENU_IMAGES_BUCKET)
    .upload(filePath, optimized.blob, {
      contentType: optimized.contentType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(getFriendlyErrorMessage(uploadError, 'Image upload failed.'));
  }

  onProgress?.(90, 'Finalizing image URL...');
  const {data} = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error('Image uploaded, but public URL could not be resolved.');
  }

  onProgress?.(100, 'Complete');
  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
}

const SAFE_STORAGE_PATH_REGEX = /^(products|logos)\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/;

export async function deleteMenuImage(imagePath: string | null | undefined): Promise<void> {
  if (!supabase || !imagePath || imagePath === 'no-image' || imagePath === 'external-url') return;
  if (!SAFE_STORAGE_PATH_REGEX.test(imagePath)) return;

  const {error} = await supabase.storage.from(MENU_IMAGES_BUCKET).remove([imagePath]);
  if (error) {
    console.warn('Could not delete old image from storage.');
  }
}
