import { useState, useEffect } from 'react';
import { CometChat } from "@cometchat/chat-sdk-javascript";

export interface UseSecureMediaResult {
  resolvedUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Checks whether the given URL requires secure presigned access.
 */
export function requiresSecureMediaAccess(url: string): boolean {
  const isHeaderMode = CometChat.CometChatHelper?.isHeaderModeEnabled?.() ?? false;
  const requiresSecure = CometChat.CometChatHelper?.requiresSecureAccess?.(url) ?? false;
  return isHeaderMode && requiresSecure;
}

/**
 * Resolves a media URL to a presigned URL if secure access is required, else returns as-is.
 * For imperative/non-hook contexts (downloads, WaveSurfer load, etc.).
 */
export async function resolveSecureUrl(url: string): Promise<string> {
  if (!requiresSecureMediaAccess(url)) {
    return url;
  }
  return CometChat.fetchPresignedUrl(url);
}

/**
 * React hook that resolves a media URL to a presigned URL if secure access is required.
 * Handles cancellation on unmount/url change.
 */
export function useSecureMedia(url: string | null): UseSecureMediaResult {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setResolvedUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!requiresSecureMediaAccess(url)) {
      setResolvedUrl(url);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setResolvedUrl(null);

    CometChat.fetchPresignedUrl(url)
      .then((signedUrl: string) => {
        if (!cancelled) {
          setResolvedUrl(signedUrl);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setResolvedUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { resolvedUrl, isLoading, error };
}
