const urlCache = new Map();
const API_URL = import.meta.env.VITE_API_URL || 'https://asc-marker.onrender.com';

let imageVersion = 0;

export const getCorrectImageUrl = (url, forceRefresh = false) => {
  if (!url) return '';

  if (forceRefresh) {
    imageVersion++;
  }

  const cacheKey = `${url}_v${imageVersion}`;

  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey);
  }

  let result = '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    result = url;
  } else {
    let cleanPath = url.replace(/^\/+/, '');
    if (cleanPath.startsWith('static/')) {
      cleanPath = cleanPath.replace('static/', 'storage/');
    }
    if (cleanPath.startsWith('storage/')) {
      result = `${API_URL}/${cleanPath}`;
    } else {
      result = `${API_URL}/storage/processed/${cleanPath}`;
    }
  }

  if (forceRefresh) {
    const separator = result.includes('?') ? '&' : '?';
    result = `${result}${separator}v=${Date.now()}`;
  }

  urlCache.set(cacheKey, result);
  return result;
};

export const invalidateImageCache = () => {
  imageVersion++;
  urlCache.clear();
  console.log('🔄 Image cache invalidated, new version:', imageVersion);
};