/**
 * Downloads a file using fetch + ReadableStream with progress tracking.
 * Falls back to window.open for browsers/servers where fetch can't be used
 * (e.g. a cross-origin asset without CORS headers).
 */
export interface DownloadProgress {
  /** 0-100 percentage */
  progress: number;
  /** Whether download is in progress */
  isDownloading: boolean;
}

/** Common MIME type → file extension, used when the download name lacks one. */
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'weba',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'application/pdf': 'pdf',
};

/** True when the name already ends in a plausible file extension. */
function hasExtension(name: string): boolean {
  return /\.[a-z0-9]{1,8}$/i.test(name);
}

/** Pull an extension from a URL's path, ignoring query string and fragment. */
function extensionFromUrl(url: string): string | undefined {
  const path = url.split(/[?#]/)[0] ?? '';
  const match = /\.([a-z0-9]{1,8})$/i.exec(path);
  return match?.[1]?.toLowerCase();
}

/** Normalize a Content-Type header to a bare MIME type (drops any `; charset=…`). */
function normalizeMime(contentType: string | null): string | undefined {
  // A blank result is falsy, which downstream `mime ? …` / map-lookup checks treat
  // the same as "no type", so no explicit empty-string handling is needed.
  return contentType?.split(';')[0]?.trim().toLowerCase();
}

/**
 * Guarantee the download filename carries an extension. Keeps an existing one;
 * otherwise derives it from the URL path, then from the MIME type. This is what
 * stops files landing as extensionless blobs that browsers/OSes save as `.txt`.
 */
function ensureExtension(fileName: string, url: string, mime: string | undefined): string {
  if (hasExtension(fileName)) return fileName;
  const ext = extensionFromUrl(url) ?? (mime ? MIME_EXTENSION[mime] : undefined);
  return ext ? `${fileName}.${ext}` : fileName;
}

/** Trigger a browser "save" for a blob under the given filename. */
function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export async function downloadWithProgress(
  url: string,
  fileName: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(url, signal ? { signal } : {});

    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)}`);
    }

    const mime = normalizeMime(response.headers.get('Content-Type'));
    const downloadName = ensureExtension(fileName, url, mime);

    if (!response.body) {
      // Fallback: browser doesn't support ReadableStream — read as blob instead.
      // response.blob() already carries the response Content-Type.
      const blob = await response.blob();
      saveBlob(blob, downloadName);
      return;
    }

    const reader = response.body.getReader();
    const contentLength = Number(response.headers.get('Content-Length') ?? 0);
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ReadableStream loop
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      receivedLength += value.length;
      if (contentLength > 0) {
        onProgress(Math.floor((receivedLength / contentLength) * 100));
      }
    }

    // Type the blob from the response so the saved file has the right content type
    // (an untyped blob + extensionless name is what produces bogus `.txt` downloads).
    const blob = new Blob(chunks, mime ? { type: mime } : undefined);
    saveBlob(blob, downloadName);
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      // Download was cancelled — do nothing
      return;
    }
    // Fallback: try fetching as blob without signal/streaming.
    try {
      const resp = await fetch(url);
      const mime = normalizeMime(resp.headers.get('Content-Type'));
      const blob = await resp.blob();
      saveBlob(blob, ensureExtension(fileName, url, mime));
    } catch {
      // Last resort: open in a new tab (avoids navigating away from the app).
      // Reached when fetch itself fails, e.g. a cross-origin asset without CORS.
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
