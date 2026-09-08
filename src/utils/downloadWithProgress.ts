/**
 * Downloads a file using fetch + ReadableStream with progress tracking.
 * Falls back to window.open for browsers that don't support ReadableStream.
 */
export interface DownloadProgress {
  /** 0-100 percentage */
  progress: number;
  /** Whether download is in progress */
  isDownloading: boolean;
}

function isAllowedDownloadUrl(url: string): boolean {
  try {
    const base =
      typeof window !== 'undefined' ? window.location.href : 'https://localhost.invalid';
    const parsed = new URL(url, base);
    if (parsed.protocol === 'https:' || parsed.protocol === 'blob:') return true;
    if (parsed.protocol !== 'http:') return false;
    return ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function downloadWithProgress(
  url: string,
  fileName: string,
  onProgress: (progress: number) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    if (!isAllowedDownloadUrl(url)) {
      throw new Error('Blocked unsafe download URL');
    }

    const response = await fetch(url, signal ? { signal } : {});

    if (!response.ok) {
      throw new Error(`Download failed with status ${String(response.status)}`);
    }

    if (!response.body) {
      // Fallback: browser doesn't support ReadableStream
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
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

    // Create blob and trigger download
    const blob = new Blob(chunks);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      // Download was cancelled — do nothing
      return;
    }
    // Fallback: open in new tab
    if (isAllowedDownloadUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
