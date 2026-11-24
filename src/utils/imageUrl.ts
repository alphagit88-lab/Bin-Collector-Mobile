import { BASE_URL } from '../config/api';

/**
 * Returns full URL for an image/attachment path.
 * Handles relative paths, leading slashes, and already-full URLs.
 */
export const getFullImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${BASE_URL}${cleanPath}`;
};

/**
 * Parses and compiles all unique attachment URLs into full URLs.
 * Handles attachment_url, additional_images (as JSON string or array), and delivery_photo_url.
 */
export const parseAllImages = (
  attachmentUrl?: string | null,
  additionalImages?: any,
  deliveryPhotoUrl?: string | null
): string[] => {
  const images: string[] = [];

  const addImage = (path?: string | null) => {
    if (!path || typeof path !== 'string') return;
    const full = getFullImageUrl(path);
    if (full && !images.includes(full)) {
      images.push(full);
    }
  };

  addImage(attachmentUrl);

  if (additionalImages) {
    let parsed: any[] = [];
    if (Array.isArray(additionalImages)) {
      parsed = additionalImages;
    } else if (typeof additionalImages === 'string') {
      try {
        const json = JSON.parse(additionalImages);
        if (Array.isArray(json)) parsed = json;
        else if (typeof json === 'string') parsed = [json];
      } catch {
        if (additionalImages.trim().length > 0) {
          parsed = [additionalImages];
        }
      }
    }

    if (Array.isArray(parsed)) {
      parsed.forEach(item => {
        if (typeof item === 'string') {
          addImage(item);
        }
      });
    }
  }

  addImage(deliveryPhotoUrl);

  return images;
};
