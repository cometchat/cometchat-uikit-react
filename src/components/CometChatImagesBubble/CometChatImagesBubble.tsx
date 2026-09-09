import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CometChatImagesBubbleProps,
  CometChatImagesBubbleAttachment,
} from './CometChatImagesBubble.types';
import type { CometChatMediaAttachment } from '../base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { downloadWithProgress } from '../../utils/downloadWithProgress';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { getReceiptStatus } from '../../utils/MessageReceiptUtils';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import {
  extractImageAttachments,
  extractCaption,
  determineLayout,
} from './CometChatImagesBubble.utils';
import unsupportedIcon from '../../assets/unsupported.svg';
import './CometChatImagesBubble.css';

// Lazy-load the FullScreenViewer — it's heavy and only needed on image click.
const LazyCometChatFullScreenViewer = lazy(
  () => import('../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy')
);

/**
 * Convert image bubble attachments to fullscreen viewer attachments.
 */
function toViewerAttachments(
  attachments: CometChatImagesBubbleAttachment[]
): CometChatMediaAttachment[] {
  return attachments.map(att => {
    const result: CometChatMediaAttachment = {
      url: att.url,
      type: 'image' as const,
    };
    if (att.size != null) result.size = att.size;
    if (att.name) result.name = att.name;
    return result;
  });
}

// --- ImageTile component ---

/**
 * ImageTile — renders a single image with a placeholder shown until the image loads.
 * Uses JS-based Image preloading — only renders <img> after the image is fully loaded.
 */
function ImageTile({
  src,
  alt,
  placeholderImage,
  className,
  onClick,
  onKeyDown,
  ariaLabel,
  isPending,
}: {
  src: string;
  alt: string;
  placeholderImage?: string;
  className: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
  /** True while the message is still sending — suppress the unsupported state. */
  isPending: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'errored'>('loading');

  useEffect(() => {
    setStatus('loading');
    // Empty URL = pending/optimistic upload; keep the loading placeholder.
    if (!src) return;

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setStatus('loaded');
    };
    img.onerror = () => {
      // Broken URL or non-image content — treat as unsupported.
      if (!cancelled) setStatus('errored');
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
    // `isPending` is a dependency so the load is re-attempted once the message is
    // confirmed — a just-uploaded CDN URL can fail the first probe, and we don't
    // want that transient failure to stick as "unsupported".
  }, [src, isPending]);

  // While the message is still sending, a load failure is treated as "still
  // loading" (not unsupported) — the send often hasn't finished making the URL
  // reachable yet.
  const showUnsupported = status === 'errored' && !isPending;
  const showLoading = status === 'loading' || (status === 'errored' && isPending);

  // A loaded image and a genuinely-unsupported tile open the fullscreen viewer.
  const interactive = status === 'loaded' || showUnsupported;

  return (
    <div
      className={className}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? onKeyDown : undefined}
      tabIndex={interactive ? 0 : -1}
      role="button"
      aria-label={ariaLabel}
    >
      {status === 'loaded' && (
        <img src={src} alt={alt} decoding="async" className={'cometchat-images-bubble__image'} />
      )}
      {showUnsupported && (
        <div
          className={'cometchat-images-bubble__placeholder cometchat-images-bubble__unsupported'}
        >
          <img
            src={unsupportedIcon}
            alt=""
            aria-hidden="true"
            className={'cometchat-images-bubble__unsupported-icon'}
          />
        </div>
      )}
      {showLoading &&
        (placeholderImage ? (
          <img src={placeholderImage} alt="" className={'cometchat-images-bubble__placeholder'} />
        ) : (
          <div className={'cometchat-images-bubble__placeholder'} />
        ))}
    </div>
  );
}

/**
 * CometChatImagesBubble — renders image messages with single/multi-image layouts,
 * click-to-fullscreen gallery, caption display, and overflow indicators.
 *
 * Takes the SDK message and extracts its attachments and caption itself; alignment
 * defaults to sender-vs-logged-in-user, so it can be used directly (no plugin).
 *
 * This is the batch-aware replacement for CometChatImageBubble.
 *
 * This is the inner content component. The outer wrapper (avatar, sender name,
 * timestamp, receipts, thread view) is handled by CometChatMessageBubble.
 */
export const CometChatImagesBubble: React.FC<CometChatImagesBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
  placeholderImage,
  onImageClicked,
}) => {
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const loggedInUser = useLoggedInUser();

  // Self-extract everything message-derived.
  const attachments = useMemo(() => extractImageAttachments(message), [message]);
  const caption = useMemo(() => extractCaption(message), [message]);
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
  // CDN URL can momentarily fail to load — don't flash the unsupported state then.
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

  const handleImageClick = useCallback(
    (index: number) => {
      if (index < 0 || index >= attachments.length) return;
      const attachment = attachments[index];
      if (attachment && onImageClicked) {
        onImageClicked(attachment, index);
      }
      setGalleryStartIndex(index);
      setShowGalleryViewer(true);
    },
    [attachments, onImageClicked]
  );

  const handleImageKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleImageClick(index);
      }
    },
    [handleImageClick]
  );

  const handleCloseViewer = useCallback(() => {
    setShowGalleryViewer(false);
  }, []);

  const handleDownload = useCallback((attachment: CometChatMediaAttachment | string) => {
    const url = typeof attachment === 'string' ? attachment : attachment.url;
    // Prefer the real file name (carries the extension); the util fills in an
    // extension from the URL/MIME type when the name is generic.
    const name = typeof attachment === 'string' ? 'download' : (attachment.name ?? 'image');
    if (url) {
      void downloadWithProgress(url, name, () => {
        /* progress not shown in viewer header currently */
      });
    }
  }, []);

  // --- Accessibility ---

  const imageAriaLabel = caption
    ? `Image: ${caption}. Press Enter to view fullscreen.`
    : 'Image message. Press Enter to view fullscreen.';

  const overflowAriaLabel = `${String(overflowCount)} more images. Press Enter to view all.`;

  const altText = senderName ? `Photo from ${senderName}` : 'Photo';

  // --- CSS classes ---

  const rootClasses = [
    'cometchat-images-bubble',
    variant === 'incoming'
      ? 'cometchat-images-bubble--incoming'
      : 'cometchat-images-bubble--outgoing',
    layoutType === 'single' ? 'cometchat-images-bubble--single' : '',
    layoutType === 'grid' ? 'cometchat-images-bubble--grid' : '',
    layoutType === 'grid-2x2' ? 'cometchat-images-bubble--grid-2x2' : '',
    layoutType === 'overflow' ? 'cometchat-images-bubble--overflow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render helpers ---

  const renderImageWrapper = (
    attachment: CometChatImagesBubbleAttachment,
    index: number
  ): React.ReactNode => {
    const key = attachment.url || `placeholder-${String(index)}`;
    const tileProps: {
      src: string;
      alt: string;
      placeholderImage?: string;
      className: string;
      onClick: () => void;
      onKeyDown: (e: React.KeyboardEvent) => void;
      ariaLabel: string;
      isPending: boolean;
    } = {
      src: attachment.url,
      alt: altText,
      className: 'cometchat-images-bubble__image-wrapper',
      onClick: () => {
        handleImageClick(index);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleImageKeyDown(e, index);
      },
      ariaLabel: !attachment.url ? 'Uploading image...' : imageAriaLabel,
      isPending,
    };
    if (placeholderImage) {
      tileProps.placeholderImage = placeholderImage;
    }
    return <ImageTile key={key} {...tileProps} />;
  };

  const renderOverflowTile = (): React.ReactNode => {
    const fourthAttachment = attachments[3];
    if (!fourthAttachment) return null;

    return (
      <div
        key="overflow-tile"
        className={'cometchat-images-bubble__overflow-tile'}
        onClick={() => {
          handleImageClick(3);
        }}
        onKeyDown={e => {
          handleImageKeyDown(e, 3);
        }}
        tabIndex={0}
        role="button"
        aria-label={overflowAriaLabel}
        style={{ backgroundImage: `url(${fourthAttachment.url})` }}
      >
        <div className={'cometchat-images-bubble__overflow-overlay'}>
          <span className={'cometchat-images-bubble__overflow-text'} aria-hidden="true">
            +{overflowCount}
          </span>
        </div>
      </div>
    );
  };

  // --- Layout rendering ---

  const renderContent = (): React.ReactNode => {
    if (attachments.length === 0) return null;

    // Single image
    if (layoutType === 'single') {
      const firstAttachment = attachments[0];
      if (!firstAttachment) return null;
      return (
        <div className={'cometchat-images-bubble__container'}>
          {renderImageWrapper(firstAttachment, 0)}
        </div>
      );
    }

    // Grid (2-3 images)
    if (layoutType === 'grid') {
      const gridModifier =
        attachments.length === 2
          ? 'cometchat-images-bubble__grid--two-col'
          : 'cometchat-images-bubble__grid--three';

      return (
        <div className={'cometchat-images-bubble__container'}>
          <div
            className={['cometchat-images-bubble__grid', gridModifier].filter(Boolean).join(' ')}
          >
            {attachments.map((att, i) => renderImageWrapper(att, i))}
          </div>
        </div>
      );
    }

    // 2x2 grid (4 images)
    if (layoutType === 'grid-2x2') {
      return (
        <div className={'cometchat-images-bubble__container'}>
          <div
            className={['cometchat-images-bubble__grid', 'cometchat-images-bubble__grid--2x2']
              .filter(Boolean)
              .join(' ')}
          >
            {attachments.map((att, i) => renderImageWrapper(att, i))}
          </div>
        </div>
      );
    }

    // Overflow (>4 images)
    return (
      <div className={'cometchat-images-bubble__container'}>
        <div
          className={['cometchat-images-bubble__grid', 'cometchat-images-bubble__grid--overflow']
            .filter(Boolean)
            .join(' ')}
        >
          {attachments.slice(0, 3).map((att, i) => renderImageWrapper(att, i))}
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
        <div className={'cometchat-images-bubble__caption'}>
          <CometChatTextBubble
            text={caption}
            isSentByMe={isSentByMe}
            textFormatters={textFormatters}
            message={message}
          />
        </div>
      )}

      {/* Fullscreen Gallery Viewer (lazy-loaded) */}
      {showGalleryViewer && (
        <Suspense fallback={null}>
          <LazyCometChatFullScreenViewer
            onClose={handleCloseViewer}
            attachments={viewerAttachments}
            startIndex={galleryStartIndex}
            senderName={senderName}
            senderAvatar={message.getSender().getAvatar() || undefined}
            sentAt={new Date(message.getSentAt() * 1000).toLocaleString()}
            onDownload={handleDownload}
            mediaType="image"
          />
        </Suspense>
      )}
    </div>
  );
};

CometChatImagesBubble.displayName = 'CometChatImagesBubble';
