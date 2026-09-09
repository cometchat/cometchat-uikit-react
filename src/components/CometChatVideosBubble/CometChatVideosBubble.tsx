import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CometChatVideosBubbleProps,
  CometChatVideosBubbleAttachment,
} from './CometChatVideosBubble.types';
import type { CometChatMediaAttachment } from '../base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { downloadWithProgress } from '../../utils/downloadWithProgress';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { getReceiptStatus } from '../../utils/MessageReceiptUtils';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useVideoMeta } from '../../hooks/useVideoMeta';
import {
  extractVideoAttachments,
  extractVideoCaption,
  determineLayout,
} from './CometChatVideosBubble.utils';
import unsupportedIcon from '../../assets/unsupported.svg';
import './CometChatVideosBubble.css';

// Lazy-load the FullScreenViewer — it's heavy and only needed on tile click.
const LazyCometChatFullScreenViewer = lazy(
  () => import('../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy')
);

/**
 * Convert video bubble attachments to fullscreen viewer attachments.
 */
function toViewerAttachments(
  attachments: CometChatVideosBubbleAttachment[]
): CometChatMediaAttachment[] {
  return attachments.map(att => {
    const result: CometChatMediaAttachment = {
      url: att.url,
      type: 'video' as const,
    };
    if (att.size != null) result.size = att.size;
    if (att.name) result.name = att.name;
    return result;
  });
}

/**
 * Format seconds into m:ss or h:mm:ss string.
 */
function formatDuration(seconds: number | undefined | null): string | null {
  if (seconds == null || !isFinite(seconds) || seconds <= 0) return null;
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h)}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m)}:${String(sec).padStart(2, '0')}`;
}

// --- VideoTile sub-component (uses useVideoMeta hook) ---

interface VideoTileProps {
  attachment: CometChatVideosBubbleAttachment;
  index: number;
  onClick: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  ariaLabel: string;
  /** True while the message is still sending — suppress the unsupported state. */
  isPending: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  attachment,
  index,
  onClick,
  onKeyDown,
  ariaLabel,
  isPending,
}) => {
  // Probe the URL to confirm it's a real, playable video (not an audio file, an
  // image, or a broken link) and to read its duration. Re-probe once the message
  // is confirmed (isPending → false), since a just-uploaded CDN URL can fail the
  // first probe while the send is still finishing.
  const { duration: computedDuration, status } = useVideoMeta(
    attachment.url || undefined,
    isPending
  );
  // While the message is still sending, a probe failure is treated as "still
  // loading" rather than unsupported — the upload often isn't fully reachable yet.
  const isInvalid = status === 'invalid' && !isPending;
  // Only show the thumbnail / duration once the media is confirmed to be a real
  // video. While the probe is still resolving we deliberately show neither — a
  // plain tile is better than briefly flashing an image thumbnail for a file
  // that turns out to be an image (or otherwise not a video).
  const hasThumbnail = !!attachment.thumbnail && status === 'valid';
  const displayDuration = status === 'valid' ? (attachment.duration ?? computedDuration) : null;

  // Preload the thumbnail and only mount the <img> once it has fully loaded.
  // Mounting an unloaded <img> makes a single-video tile momentarily size to the
  // image's min-dimensions before its natural size — an extra layout jump. By
  // holding the plain tile until the thumbnail is ready, the tile resizes just
  // once (loading box → natural thumbnail), matching the image bubble.
  const thumbnailUrl = attachment.thumbnail;
  const [thumbnailReady, setThumbnailReady] = useState(false);
  useEffect(() => {
    setThumbnailReady(false);
    if (!thumbnailUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setThumbnailReady(true);
    };
    img.src = thumbnailUrl;
    return () => {
      cancelled = true;
    };
  }, [thumbnailUrl]);
  const showThumbnail = hasThumbnail && thumbnailReady;

  if (!attachment.url) {
    return (
      <div
        className="cometchat-videos-bubble__tile"
        tabIndex={-1}
        role="button"
        aria-label="Uploading video..."
      >
        <div className="cometchat-videos-bubble__placeholder">
          <div className="cometchat-videos-bubble__play-icon" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Not a playable video — show the unsupported state. Still clickable so the
  // fullscreen viewer can offer a download.
  if (isInvalid) {
    return (
      <div
        className="cometchat-videos-bubble__tile cometchat-videos-bubble__tile--unsupported"
        onClick={() => {
          onClick(index);
        }}
        onKeyDown={e => {
          onKeyDown(e, index);
        }}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
      >
        <div className="cometchat-videos-bubble__unsupported">
          <img
            src={unsupportedIcon}
            alt=""
            aria-hidden="true"
            className="cometchat-videos-bubble__unsupported-icon"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="cometchat-videos-bubble__tile"
      onClick={() => {
        onClick(index);
      }}
      onKeyDown={e => {
        onKeyDown(e, index);
      }}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
    >
      {showThumbnail ? (
        <img
          src={attachment.thumbnail}
          alt=""
          decoding="async"
          className="cometchat-videos-bubble__thumbnail"
        />
      ) : null}
      <div className="cometchat-videos-bubble__play-icon" aria-hidden="true" />
      {formatDuration(displayDuration) && (
        <span className="cometchat-videos-bubble__duration" aria-hidden="true">
          {formatDuration(displayDuration)}
        </span>
      )}
    </div>
  );
};

/**
 * CometChatVideosBubble — renders video messages with single/multi-video grid layouts,
 * thumbnail posters from thumbnail-generation extension, play-over-black fallback,
 * click-to-fullscreen video pager, caption display, and overflow indicators.
 *
 * Takes the SDK message and extracts its attachments and caption itself; alignment
 * defaults to sender-vs-logged-in-user, so it can be used directly (no plugin).
 *
 * This is the batch-aware replacement for CometChatVideoBubble.
 */
export const CometChatVideosBubble: React.FC<CometChatVideosBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
  onVideoClicked,
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const loggedInUser = useLoggedInUser();

  // Self-extract everything message-derived.
  const attachments = useMemo(() => extractVideoAttachments(message), [message]);
  const caption = useMemo(() => extractVideoCaption(message), [message]);
  const variant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const senderName = useMemo(() => {
    try {
      return message.getSender().getName();
    } catch {
      return '';
    }
  }, [message]);

  // While the message is still being sent (no server id yet), a freshly-uploaded
  // CDN URL can momentarily fail to probe — don't flash the unsupported state then.
  const isPending = useMemo(() => {
    try {
      return getReceiptStatus(message) === 'wait';
    } catch {
      return false;
    }
  }, [message]);

  const { layoutType, overflowCount } = useMemo(
    () => determineLayout(attachments.length),
    [attachments.length]
  );

  const viewerAttachments = useMemo(() => toViewerAttachments(attachments), [attachments]);

  const isSentByMe = variant === 'outgoing';

  // --- Event handlers ---

  const handleTileClick = useCallback(
    (index: number) => {
      if (index < 0 || index >= attachments.length) return;
      const attachment = attachments[index];
      if (attachment && onVideoClicked) {
        onVideoClicked(attachment, index);
      }
      setViewerStartIndex(index);
      setShowViewer(true);
    },
    [attachments, onVideoClicked]
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

  const handleDownload = useCallback((attachment: CometChatMediaAttachment | string) => {
    const url = typeof attachment === 'string' ? attachment : attachment.url;
    // Prefer the real file name (carries the extension); the util fills in an
    // extension from the URL/MIME type when the name is generic.
    const name = typeof attachment === 'string' ? 'download' : (attachment.name ?? 'video');
    if (url) {
      void downloadWithProgress(url, name, () => {
        /* progress not surfaced here */
      });
    }
  }, []);

  // --- Accessibility ---

  const tileAriaLabel = caption
    ? `Video: ${caption}. Press Enter to play fullscreen.`
    : 'Video message. Press Enter to play fullscreen.';

  const overflowAriaLabel = `${String(overflowCount)} more videos. Press Enter to view all.`;

  // --- CSS classes ---

  const rootClasses = [
    'cometchat-videos-bubble',
    variant === 'incoming'
      ? 'cometchat-videos-bubble--incoming'
      : 'cometchat-videos-bubble--outgoing',
    layoutType === 'single' ? 'cometchat-videos-bubble--single' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render helpers ---

  const renderTile = (
    attachment: CometChatVideosBubbleAttachment,
    index: number
  ): React.ReactNode => {
    const key = attachment.url || `placeholder-${String(index)}`;
    return (
      <VideoTile
        key={key}
        attachment={attachment}
        index={index}
        onClick={handleTileClick}
        onKeyDown={handleTileKeyDown}
        ariaLabel={tileAriaLabel}
        isPending={isPending}
      />
    );
  };

  const renderOverflowTile = (): React.ReactNode => {
    const fourthAttachment = attachments[3];
    if (!fourthAttachment) return null;

    const hasThumbnail = !!fourthAttachment.thumbnail;

    return (
      <div
        key="overflow-tile"
        className={`cometchat-videos-bubble__overflow-tile${hasThumbnail ? ' cometchat-videos-bubble__overflow-thumbnail-tile' : ''}`}
        onClick={() => {
          handleTileClick(3);
        }}
        onKeyDown={e => {
          handleTileKeyDown(e, 3);
        }}
        tabIndex={0}
        role="button"
        aria-label={overflowAriaLabel}
        style={
          hasThumbnail ? { backgroundImage: `url(${fourthAttachment.thumbnail ?? ''})` } : undefined
        }
      >
        <div className="cometchat-videos-bubble__overflow-overlay">
          <span className="cometchat-videos-bubble__overflow-text" aria-hidden="true">
            +{overflowCount}
          </span>
        </div>
      </div>
    );
  };

  // --- Layout rendering ---

  const renderContent = (): React.ReactNode => {
    if (attachments.length === 0) return null;

    // Single video
    if (layoutType === 'single') {
      const firstAttachment = attachments[0];
      if (!firstAttachment) return null;
      return (
        <div className="cometchat-videos-bubble__container">{renderTile(firstAttachment, 0)}</div>
      );
    }

    // Grid (2-3 videos)
    if (layoutType === 'grid') {
      const gridModifier =
        attachments.length === 2
          ? 'cometchat-videos-bubble__grid--two-col'
          : 'cometchat-videos-bubble__grid--three';

      return (
        <div className="cometchat-videos-bubble__container">
          <div className={['cometchat-videos-bubble__grid', gridModifier].join(' ')}>
            {attachments.map((att, i) => renderTile(att, i))}
          </div>
        </div>
      );
    }

    // 2x2 grid (4 videos)
    if (layoutType === 'grid-2x2') {
      return (
        <div className="cometchat-videos-bubble__container">
          <div className="cometchat-videos-bubble__grid cometchat-videos-bubble__grid--2x2">
            {attachments.map((att, i) => renderTile(att, i))}
          </div>
        </div>
      );
    }

    // Overflow (>4 videos)
    return (
      <div className="cometchat-videos-bubble__container">
        <div className="cometchat-videos-bubble__grid cometchat-videos-bubble__grid--overflow">
          {attachments.slice(0, 3).map((att, i) => renderTile(att, i))}
          {renderOverflowTile()}
        </div>
      </div>
    );
  };

  return (
    <div className={rootClasses}>
      {renderContent()}

      {/* Caption rendered via CometChatTextBubble */}
      {caption && (
        <div className="cometchat-videos-bubble__caption">
          <CometChatTextBubble
            text={caption}
            isSentByMe={isSentByMe}
            textFormatters={textFormatters}
            message={message}
          />
        </div>
      )}

      {/* Fullscreen Video Viewer (lazy-loaded) */}
      {showViewer && (
        <Suspense fallback={null}>
          <LazyCometChatFullScreenViewer
            onClose={handleCloseViewer}
            attachments={viewerAttachments}
            startIndex={viewerStartIndex}
            senderName={senderName}
            senderAvatar={message.getSender().getAvatar() || undefined}
            sentAt={new Date(message.getSentAt() * 1000).toLocaleString()}
            onDownload={handleDownload}
            mediaType="video"
          />
        </Suspense>
      )}
    </div>
  );
};

CometChatVideosBubble.displayName = 'CometChatVideosBubble';
