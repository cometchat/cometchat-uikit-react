import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatVideoBubbleProps,
  CometChatVideoBubbleAttachment,
  CometChatVideoBubbleLayoutType,
  CometChatVideoBubbleVariant,
} from './CometChatVideoBubble.types';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import type { CometChatMediaAttachment } from '../base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { useLocale } from '../../hooks/useLocale';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import {
  extractVideoAttachments,
  extractVideoCaption,
  extractVideoSenderName,
} from './CometChatVideoBubble.utils';
import './CometChatVideoBubble.css';

// Lazy-load the FullScreenViewer — only needed when user clicks to view fullscreen.
const LazyCometChatFullScreenViewer = lazy(
  () => import('../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy')
);

// --- Helpers ---

function determineLayout(count: number): {
  layoutType: CometChatVideoBubbleLayoutType;
  overflowCount: number;
} {
  if (count <= 1) return { layoutType: 'single', overflowCount: 0 };
  if (count <= 3) return { layoutType: 'grid', overflowCount: 0 };
  if (count === 4) return { layoutType: 'grid-2x2', overflowCount: 0 };
  return { layoutType: 'overflow', overflowCount: count - 4 };
}

function getDisplaySrc(attachment: CometChatVideoBubbleAttachment): string {
  return attachment.thumbnail ?? attachment.url;
}

function toViewerAttachments(
  attachments: CometChatVideoBubbleAttachment[]
): CometChatMediaAttachment[] {
  return attachments.map(att => {
    const result: CometChatMediaAttachment = {
      url: att.url,
      type: 'video' as const,
    };
    if (att.size != null) result.size = att.size;
    return result;
  });
}

/**
 * CometChatVideoBubble — renders video messages with inline playback (single),
 * thumbnail grids (multi), captions, and fullscreen viewer.
 *
 * Single video: inline <video> with native controls + poster thumbnail.
 * Multi-video: thumbnail <img> + play overlay per tile, click opens fullscreen viewer.
 */
export const CometChatVideoBubble: React.FC<CometChatVideoBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const IframeContext = useCometChatFrameContext();
  const loggedInUser = useLoggedInUser();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);
  const { getLocalizedString } = useLocale();

  // --- Self-extracted, message-derived data ---
  const variant: CometChatVideoBubbleVariant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const attachments = useMemo(() => extractVideoAttachments(message), [message]);
  const caption = useMemo(() => extractVideoCaption(message), [message]);
  const senderName = useMemo(() => extractVideoSenderName(message), [message]);

  const { layoutType, overflowCount } = useMemo(
    () => determineLayout(attachments.length),
    [attachments.length]
  );

  const viewerAttachments = useMemo(() => toViewerAttachments(attachments), [attachments]);
  const isSentByMe = variant === 'outgoing';

  // --- Fullscreen handling (v6 pattern) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      if (!getCurrentDocument().fullscreenElement) {
        // Exiting fullscreen — force reflow to fix sizing
        video.style.display = 'none';
        requestAnimationFrame(() => {
          video.style.display = 'block';
        });
        video.style.objectFit = 'cover';
      } else {
        video.style.objectFit = 'contain';
      }
    };

    video.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      video.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });

  const handleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (video && !getCurrentDocument().fullscreenElement) {
      video.requestFullscreen().catch(() => {
        /* ignore */
      });
    }
  }, [getCurrentDocument]);

  // --- Event handlers ---

  const handleTileClick = useCallback(
    (index: number) => {
      if (index < 0 || index >= attachments.length) return;
      setViewerStartIndex(index);
      setShowViewer(true);
    },
    [attachments.length]
  );

  const handleTileKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTileClick(index);
      }
    },
    [handleTileClick]
  );

  const handleCloseViewer = useCallback(() => {
    setShowViewer(false);
  }, []);

  // --- Accessibility ---

  const tileAriaLabel = 'Play video. Press Enter to open.';

  const overflowAriaLabel = `${String(overflowCount)} more videos. Press Enter to view all.`;

  // --- CSS classes ---

  const rootClasses = [
    'cometchat-video-bubble',
    variant === 'incoming'
      ? 'cometchat-video-bubble--incoming'
      : 'cometchat-video-bubble--outgoing',
    layoutType === 'single' ? 'cometchat-video-bubble--single' : '',
    layoutType === 'grid' ? 'cometchat-video-bubble--grid' : '',
    layoutType === 'grid-2x2' ? 'cometchat-video-bubble--grid-2x2' : '',
    layoutType === 'overflow' ? 'cometchat-video-bubble--overflow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render: grid tile (thumbnail + play overlay) ---

  const renderGridTile = (
    attachment: CometChatVideoBubbleAttachment,
    index: number
  ): React.ReactNode => (
    <div
      key={attachment.url || index}
      className={'cometchat-video-bubble__video-wrapper'}
      onClick={() => {
        handleTileClick(index);
      }}
      onKeyDown={e => {
        handleTileKeyDown(e, index);
      }}
      tabIndex={0}
      role="button"
      aria-label={tileAriaLabel}
    >
      <img
        className={'cometchat-video-bubble__thumbnail'}
        src={getDisplaySrc(attachment)}
        alt=""
        aria-hidden="true"
        // loading="lazy"
        decoding="async"
      />
      {/* Play overlay */}
      <div className={'cometchat-video-bubble__play-overlay'} aria-hidden="true">
        <div className={'cometchat-video-bubble__play-icon'} />
      </div>
    </div>
  );

  const renderOverflowTile = (): React.ReactNode => {
    const fourthAttachment = attachments[3];
    if (!fourthAttachment) return null;

    return (
      <div
        key="overflow-tile"
        className={'cometchat-video-bubble__overflow-tile'}
        onClick={() => {
          handleTileClick(3);
        }}
        onKeyDown={e => {
          handleTileKeyDown(e, 3);
        }}
        tabIndex={0}
        role="button"
        aria-label={overflowAriaLabel}
        style={{ backgroundImage: `url(${getDisplaySrc(fourthAttachment)})` }}
      >
        <div className={'cometchat-video-bubble__overflow-overlay'}>
          <span className={'cometchat-video-bubble__overflow-text'} aria-hidden="true">
            +{overflowCount}
          </span>
        </div>
      </div>
    );
  };

  // --- Layout rendering ---

  const renderContent = (): React.ReactNode => {
    if (attachments.length === 0) return null;

    // Single video — inline <video> that goes native fullscreen on play (like v6)
    if (layoutType === 'single') {
      const first = attachments[0];
      if (!first) return null;
      const isPlaceholder = (first as { isPlaceholder?: boolean }).isPlaceholder;

      if (isPlaceholder) {
        return (
          <div className={'cometchat-video-bubble__container'}>
            <video
              ref={videoRef}
              className={'cometchat-video-bubble__video'}
              src={first.url}
              preload="metadata"
              aria-label={
                senderName
                  ? `Video from ${senderName}`
                  : getLocalizedString('accessibility_video_message')
              }
            />
          </div>
        );
      }

      return (
        <div className={'cometchat-video-bubble__container'}>
          <video
            ref={videoRef}
            className={'cometchat-video-bubble__video'}
            src={first.url}
            poster={first.thumbnail ?? ''}
            controls
            preload="metadata"
            aria-label={
              senderName
                ? `Video from ${senderName}`
                : getLocalizedString('accessibility_video_message')
            }
            onPlay={handleVideoPlay}
          />
        </div>
      );
    }

    // Grid (2-3 videos)
    if (layoutType === 'grid') {
      const gridModifier =
        attachments.length === 2
          ? 'cometchat-video-bubble__grid--two-col'
          : 'cometchat-video-bubble__grid--three';

      return (
        <div className={'cometchat-video-bubble__container'}>
          <div className={['cometchat-video-bubble__grid', gridModifier].filter(Boolean).join(' ')}>
            {attachments.map((att, i) => renderGridTile(att, i))}
          </div>
        </div>
      );
    }

    // 2×2 grid (4 videos)
    if (layoutType === 'grid-2x2') {
      return (
        <div className={'cometchat-video-bubble__container'}>
          <div
            className={['cometchat-video-bubble__grid', 'cometchat-video-bubble__grid--2x2']
              .filter(Boolean)
              .join(' ')}
          >
            {attachments.map((att, i) => renderGridTile(att, i))}
          </div>
        </div>
      );
    }

    // Overflow (>4 videos)
    return (
      <div className={'cometchat-video-bubble__container'}>
        <div
          className={['cometchat-video-bubble__grid', 'cometchat-video-bubble__grid--overflow']
            .filter(Boolean)
            .join(' ')}
        >
          {attachments.slice(0, 3).map((att, i) => renderGridTile(att, i))}
          {renderOverflowTile()}
        </div>
      </div>
    );
  };

  return (
    <div className={rootClasses}>
      {renderContent()}

      {/* Caption */}
      {caption && (
        <div className={'cometchat-video-bubble__caption'}>
          <CometChatTextBubble
            text={caption}
            isSentByMe={isSentByMe}
            textFormatters={textFormatters}
            message={message}
          />
        </div>
      )}

      {/* Fullscreen Viewer (lazy-loaded) */}
      {showViewer && (
        <Suspense fallback={null}>
          <LazyCometChatFullScreenViewer
            onClose={handleCloseViewer}
            attachments={viewerAttachments}
            startIndex={viewerStartIndex}
            senderName={senderName}
            mediaType="video"
          />
        </Suspense>
      )}
    </div>
  );
};

CometChatVideoBubble.displayName = 'CometChatVideoBubble';
