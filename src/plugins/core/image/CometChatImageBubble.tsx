import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CometChatImageBubbleProps,
  CometChatImageBubbleAttachment,
  CometChatImageBubbleLayoutType,
} from './CometChatImageBubble.types';
import type { CometChatMediaAttachment } from '../../../components/base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import { CometChatTextBubble } from '../text/CometChatTextBubble';
import { downloadWithProgress } from '../../../utils/downloadWithProgress';
import './CometChatImageBubble.css';

// Lazy-load the FullScreenViewer — it's heavy and only needed on image click.
const LazyCometChatFullScreenViewer = lazy(
  () => import('../../../components/base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy')
);

// --- Layout helpers ---

/**
 * Determine layout type and overflow count from attachment count.
 */
function determineLayout(count: number): {
  layoutType: CometChatImageBubbleLayoutType;
  overflowCount: number;
} {
  if (count <= 1) return { layoutType: 'single', overflowCount: 0 };
  if (count <= 3) return { layoutType: 'grid', overflowCount: 0 };
  if (count === 4) return { layoutType: 'grid-2x2', overflowCount: 0 };
  return { layoutType: 'overflow', overflowCount: count - 4 };
}

/**
 * Convert image bubble attachments to fullscreen viewer attachments.
 */
function toViewerAttachments(
  attachments: CometChatImageBubbleAttachment[]
): CometChatMediaAttachment[] {
  return attachments.map(att => {
    const result: CometChatMediaAttachment = {
      url: att.url,
      type: 'image' as const,
    };
    if (att.size != null) result.size = att.size;
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
}: {
  src: string;
  alt: string;
  placeholderImage?: string;
  className: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  ariaLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLoaded(true);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div
      className={className}
      onClick={loaded ? onClick : undefined}
      onKeyDown={loaded ? onKeyDown : undefined}
      tabIndex={loaded ? 0 : -1}
      role="button"
      aria-label={ariaLabel}
    >
      {loaded && (
        <img src={src} alt={alt} decoding="async" className={'cometchat-image-bubble__image'} />
      )}
      {!loaded &&
        (placeholderImage ? (
          <img src={placeholderImage} alt="" className={'cometchat-image-bubble__placeholder'} />
        ) : (
          <div className={'cometchat-image-bubble__placeholder'} />
        ))}
    </div>
  );
}

/**
 * CometChatImageBubble — renders image messages with single/multi-image layouts,
 * click-to-fullscreen gallery, caption display, and overflow indicators.
 *
 * This is the inner content component. The outer wrapper (avatar, sender name,
 * timestamp, receipts, thread view) is handled by CometChatMessageBubble.
 */
export const CometChatImageBubble: React.FC<CometChatImageBubbleProps> = ({
  attachments,
  variant,
  caption,
  message,
  senderName,
  textFormatters = [],
  className,
  placeholderImage,
  onImageClicked,
}) => {
  const [showGalleryViewer, setShowGalleryViewer] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

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
    const name = typeof attachment === 'string' ? 'download' : 'image';
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
    'cometchat-image-bubble',
    variant === 'incoming'
      ? 'cometchat-image-bubble--incoming'
      : 'cometchat-image-bubble--outgoing',
    layoutType === 'single' ? 'cometchat-image-bubble--single' : '',
    layoutType === 'grid' ? 'cometchat-image-bubble--grid' : '',
    layoutType === 'grid-2x2' ? 'cometchat-image-bubble--grid-2x2' : '',
    layoutType === 'overflow' ? 'cometchat-image-bubble--overflow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render helpers ---

  const renderImageWrapper = (
    attachment: CometChatImageBubbleAttachment,
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
    } = {
      src: attachment.url,
      alt: altText,
      className: 'cometchat-image-bubble__image-wrapper',
      onClick: () => {
        handleImageClick(index);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleImageKeyDown(e, index);
      },
      ariaLabel: !attachment.url ? 'Uploading image...' : imageAriaLabel,
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
        className={'cometchat-image-bubble__overflow-tile'}
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
        <div className={'cometchat-image-bubble__overflow-overlay'}>
          <span className={'cometchat-image-bubble__overflow-text'} aria-hidden="true">
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
        <div className={'cometchat-image-bubble__container'}>
          {renderImageWrapper(firstAttachment, 0)}
        </div>
      );
    }

    // Grid (2-3 images)
    if (layoutType === 'grid') {
      const gridModifier =
        attachments.length === 2
          ? 'cometchat-image-bubble__grid--two-col'
          : 'cometchat-image-bubble__grid--three';

      return (
        <div className={'cometchat-image-bubble__container'}>
          <div className={['cometchat-image-bubble__grid', gridModifier].filter(Boolean).join(' ')}>
            {attachments.map((att, i) => renderImageWrapper(att, i))}
          </div>
        </div>
      );
    }

    // 2×2 grid (4 images)
    if (layoutType === 'grid-2x2') {
      return (
        <div className={'cometchat-image-bubble__container'}>
          <div
            className={['cometchat-image-bubble__grid', 'cometchat-image-bubble__grid--2x2']
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
      <div className={'cometchat-image-bubble__container'}>
        <div
          className={['cometchat-image-bubble__grid', 'cometchat-image-bubble__grid--overflow']
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
        <div className={'cometchat-image-bubble__caption'}>
          <CometChatTextBubble
            text={caption}
            isSentByMe={isSentByMe}
            textFormatters={textFormatters}
            message={message as never}
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
            senderName={senderName ?? ''}
            {...(message ? { sentAt: new Date(message.getSentAt() * 1000).toLocaleString() } : {})}
            onDownload={handleDownload}
            mediaType="image"
          />
        </Suspense>
      )}
    </div>
  );
};

CometChatImageBubble.displayName = 'CometChatImageBubble';
