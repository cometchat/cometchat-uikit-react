import { useState, useEffect } from 'react';

export interface UseCometChatAvatarOptions {
  image: string;
}

export interface UseCometChatAvatarReturn {
  imageLoaded: boolean;
  imageError: boolean;
}

/**
 * Manages image loading state.
 * Tracks loaded/error states and resets when image URL changes.
 * SSR-safe — Image constructor is only used inside useEffect.
 */
export function useCometChatAvatar({ image }: UseCometChatAvatarOptions): UseCometChatAvatarReturn {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!image) {
      setImageLoaded(false);
      setImageError(false);
      return;
    }

    let cancelled = false;
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    img.onload = () => {
      if (!cancelled) setImageLoaded(true);
    };
    img.onerror = () => {
      if (!cancelled) setImageError(true);
    };
    img.src = image;

    return () => {
      cancelled = true;
    };
  }, [image]);

  return { imageLoaded, imageError };
}
