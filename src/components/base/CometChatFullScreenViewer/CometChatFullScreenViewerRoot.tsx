import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatFullScreenViewerRootProps,
  CometChatFullScreenViewerContextValue,
} from './CometChatFullScreenViewer.types';
import { CometChatFullScreenViewerContext } from './CometChatFullScreenViewer.context';
import { CometChatFullScreenViewerHeader } from './CometChatFullScreenViewerHeader';
import { CometChatFullScreenViewerBody } from './CometChatFullScreenViewerBody';
import { CometChatFullScreenViewerNavigation } from './CometChatFullScreenViewerNavigation';
import { useCometChatFrameContext } from '../../../context/CometChatFrameContext';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatFullScreenViewer.css';

/**
 * Root overlay for the fullscreen viewer. Provides context, manages gallery state,
 * handles keyboard navigation, focus trap, and body scroll lock.
 *
 * The component is always visible when mounted — unmount it to close.
 */
export const CometChatFullScreenViewerRoot: React.FC<CometChatFullScreenViewerRootProps> = ({
  onClose,
  url = '',
  mediaType = 'image',
  fileName,
  fileSize,
  attachments = [],
  startIndex = 0,
  senderName,
  senderAvatar,
  senderStatus,
  sentAt,
  onIndexChange,
  onDownload,
  children,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);
  const { getLocalizedString } = useLocale();

  // Gallery state
  const isGalleryMode = attachments.length > 0;
  const clampedStart = Math.max(0, Math.min(startIndex, attachments.length - 1));
  const [currentIndex, setCurrentIndex] = useState(clampedStart);

  // Reset index when startIndex or attachments change
  useEffect(() => {
    if (isGalleryMode) {
      const clamped = Math.max(0, Math.min(startIndex, attachments.length - 1));
      setCurrentIndex(clamped);
    }
  }, [startIndex, attachments.length, isGalleryMode]);

  // Derived state
  const currentAttachment = isGalleryMode ? attachments[currentIndex] : undefined;
  const currentUrl = isGalleryMode ? (currentAttachment?.url ?? '') : url;
  const currentMediaType = isGalleryMode ? (currentAttachment?.type ?? 'image') : mediaType;
  const currentFileName = isGalleryMode ? (currentAttachment?.name ?? '') : (fileName ?? '');
  const currentFileSize = isGalleryMode ? currentAttachment?.size : fileSize;
  const canNavigatePrev = isGalleryMode && currentIndex > 0;
  const canNavigateNext = isGalleryMode && currentIndex < attachments.length - 1;

  const navigatePrev = useCallback(() => {
    if (!canNavigatePrev) return;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
    // Refocus container so arrow keys keep working after navigation
    requestAnimationFrame(() => containerRef.current?.focus());
  }, [canNavigatePrev, currentIndex, onIndexChange]);

  const navigateNext = useCallback(() => {
    if (!canNavigateNext) return;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
    // Refocus container so arrow keys keep working after navigation
    requestAnimationFrame(() => containerRef.current?.focus());
  }, [canNavigateNext, currentIndex, onIndexChange]);

  // Body scroll lock — runs on mount, restores on unmount
  useEffect(() => {
    const doc = getCurrentDocument();
    const original = doc.body.style.overflow;
    doc.body.style.overflow = 'hidden';
    return () => {
      doc.body.style.overflow = original;
    };
  }, [getCurrentDocument]);

  // Focus management — focus container on mount, restore on unmount
  useEffect(() => {
    previousFocusRef.current = getCurrentDocument().activeElement as HTMLElement;
    requestAnimationFrame(() => {
      containerRef.current?.focus();
    });
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [getCurrentDocument]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      // Gallery navigation — works for all media types.
      // Skip only when focus is on a <video> or <audio> element (arrows should seek there).
      if (isGalleryMode) {
        const activeTag = getCurrentDocument().activeElement?.tagName;
        const isFocusedOnMedia = activeTag === 'VIDEO' || activeTag === 'AUDIO';

        if (!isFocusedOnMedia) {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            navigatePrev();
            return;
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            navigateNext();
            return;
          }
        }
      }

      // Focus trap: Tab/Shift+Tab
      if (event.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;
        const focusable = container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), video, audio'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && getCurrentDocument().activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && getCurrentDocument().activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose, isGalleryMode, navigatePrev, navigateNext, getCurrentDocument]
  );

  // Context value
  const ctxValue = useMemo<CometChatFullScreenViewerContextValue>(
    () => ({
      onClose,
      mediaType: currentMediaType,
      currentUrl,
      currentIndex,
      attachments,
      isGalleryMode,
      canNavigatePrev,
      canNavigateNext,
      navigatePrev,
      navigateNext,
      senderName,
      senderAvatar,
      senderStatus,
      sentAt,
      fileName: currentFileName,
      fileSize: currentFileSize,
      onDownload,
    }),
    [
      onClose,
      currentMediaType,
      currentUrl,
      currentIndex,
      attachments,
      isGalleryMode,
      canNavigatePrev,
      canNavigateNext,
      navigatePrev,
      navigateNext,
      senderName,
      senderAvatar,
      senderStatus,
      sentAt,
      currentFileName,
      currentFileSize,
      onDownload,
    ]
  );

  const rootClasses = ['cometchat-fullscreen-viewer', className].filter(Boolean).join(' ');

  return (
    <CometChatFullScreenViewerContext.Provider value={ctxValue}>
      <div
        ref={containerRef}
        className={rootClasses}
        role="dialog"
        aria-modal="true"
        aria-label={getAriaLabel(currentMediaType, getLocalizedString)}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children ?? (
          <>
            <CometChatFullScreenViewerHeader />
            <CometChatFullScreenViewerBody />
            {isGalleryMode && <CometChatFullScreenViewerNavigation />}
          </>
        )}
      </div>
    </CometChatFullScreenViewerContext.Provider>
  );
};

function getAriaLabel(mediaType: string, getLocalizedString: (key: string) => string): string {
  switch (mediaType) {
    case 'video':
      return getLocalizedString('accessibility_full_screen_video');
    case 'audio':
      return getLocalizedString('accessibility_full_screen_audio');
    case 'file':
      return getLocalizedString('full_screen_viewer_file_viewer');
    default:
      return getLocalizedString('full_screen_viewer_image_viewer');
  }
}

CometChatFullScreenViewerRoot.displayName = 'CometChatFullScreenViewerRoot';
