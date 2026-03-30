export const ARTICLE_IMAGES_BUCKET = process.env.SUPABASE_ARTICLE_IMAGES_BUCKET || 'article-images';

const STORAGE_PATH_MARKERS = [
  `/storage/v1/object/public/${ARTICLE_IMAGES_BUCKET}/`,
  `/storage/v1/object/sign/${ARTICLE_IMAGES_BUCKET}/`,
  `/storage/v1/object/authenticated/${ARTICLE_IMAGES_BUCKET}/`,
];

const extractUrlsFromMarkdown = (content) => {
  if (!content) return [];

  const urls = [];
  const markdownImageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

  let markdownMatch;
  while ((markdownMatch = markdownImageRegex.exec(content)) !== null) {
    const raw = markdownMatch[1].trim();
    const withoutTitle = raw.split(/\s+/)[0];
    urls.push(withoutTitle.replace(/^<|>$/g, ''));
  }

  let htmlMatch;
  while ((htmlMatch = htmlImageRegex.exec(content)) !== null) {
    urls.push(htmlMatch[1].trim());
  }

  return urls;
};

export const extractStoragePathFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  for (const marker of STORAGE_PATH_MARKERS) {
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) continue;

    const start = markerIndex + marker.length;
    const rawPath = url.slice(start).split('?')[0];
    if (!rawPath) return null;

    try {
      return decodeURIComponent(rawPath);
    } catch {
      return rawPath;
    }
  }

  return null;
};

export const extractStoragePathsFromContent = (content) => {
  const paths = extractUrlsFromMarkdown(content)
    .map((url) => extractStoragePathFromUrl(url))
    .filter(Boolean);

  return [...new Set(paths)];
};

export const filterPathsOwnedByUser = (paths, userId) => {
  if (!Array.isArray(paths) || !userId) return [];

  const prefix = `${userId}/`;
  return [...new Set(paths.filter((path) => typeof path === 'string' && path.startsWith(prefix)))];
};
