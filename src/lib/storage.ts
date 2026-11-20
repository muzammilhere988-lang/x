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

/**
 * Resizes oversized photos client-side (max 1200px wide) and compresses to WebP/JPEG
 * so mobile customers on ordinary connections get fast loading times.
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension = 1200,
  quality = 0.85
): Promise<{blob: Blob; extension: string; contentType: string}> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to read selected image file.'));
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
      // Fallback to original file if canvas conversion fails
      const origExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      return {blob: file, extension: origExt, contentType: file.type};
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

  const validation = validateImageFile(file);
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

export async function deleteMenuImage(imagePath: string | null | undefined): Promise<void> {
  if (!supabase || !imagePath) return;

  const {error} = await supabase.storage.from(MENU_IMAGES_BUCKET).remove([imagePath]);
  if (error) {
    console.warn('Could not delete old image from storage:', error.message);
  }
}
