import React, { useCallback, useMemo, useState } from 'react';
import type {
  CometChatFileBubbleProps,
  CometChatFileBubbleAttachment,
} from './CometChatFileBubble.types';
import { extractFileAttachments, extractFileCaption } from './CometChatFileBubble.utils';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { CometChatDownloadButton } from '../base/CometChatDownloadButton';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../hooks/useLocale';
import './CometChatFileBubble.css';

// --- File type icon imports ---
import iconPdf from '../../assets/file_type_pdf.png';
import iconWord from '../../assets/file_type_word.png';
import iconXlsx from '../../assets/file_type_xlsx.png';
import iconPpt from '../../assets/file_type_ppt.png';
import iconTxt from '../../assets/file_type_txt.png';
import iconJpg from '../../assets/file_type_jpg.png';
import iconMp3 from '../../assets/file_type_mp3.png';
import iconMov from '../../assets/file_type_mov.png';
import iconZip from '../../assets/file_type_zip.png';
import iconDefault from '../../assets/file_type_unsupported.png';

// --- Helpers ---

/** Max files shown in collapsed view before +N indicator. */
const COLLAPSED_MAX = 3;

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: iconPdf,
  doc: iconWord,
  docx: iconWord,
  txt: iconTxt,
  xls: iconXlsx,
  xlsx: iconXlsx,
  csv: iconXlsx,
  ppt: iconPpt,
  pptx: iconPpt,
  js: iconTxt,
  ts: iconTxt,
  html: iconTxt,
  css: iconTxt,
  json: iconTxt,
  zip: iconZip,
  rar: iconZip,
  tar: iconZip,
  gz: iconZip,
  jpg: iconJpg,
  jpeg: iconJpg,
  png: iconJpg,
  gif: iconJpg,
  mp3: iconMp3,
  wav: iconMp3,
  mp4: iconMov,
  mov: iconMov,
  avi: iconMov,
};

function getFileIcon(extension: string, mimeType: string): string {
  const ext = extension.toLowerCase();
  if (FILE_TYPE_ICONS[ext]) return FILE_TYPE_ICONS[ext];

  const mime = mimeType.toLowerCase();
  if (mime.includes('pdf')) return iconPdf;
  if (mime.includes('word') || mime.includes('document')) return iconWord;
  if (mime.includes('sheet') || mime.includes('excel')) return iconXlsx;
  if (mime.includes('presentation') || mime.includes('powerpoint')) return iconPpt;
  if (mime.includes('zip') || mime.includes('compressed')) return iconZip;
  if (mime.includes('image')) return iconJpg;
  if (mime.includes('audio')) return iconMp3;
  if (mime.includes('video')) return iconMov;

  return iconDefault;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/**
 * CometChatFileBubble — renders file messages with icon, filename, size,
 * download button, multi-file expand/collapse, and caption support.
 *
 * Takes the SDK message and extracts the attachments and caption from it itself;
 * localization comes from hooks, so it can be used directly (no plugin).
 *
 * Collapsed: shows up to 3 files + "Show more +N" on the right.
 * Expanded: shows all files + "Show less" on the right.
 *
 * @deprecated Use {@link CometChatFilesBubble} instead. This legacy
 * single-attachment bubble is retained for backward compatibility and is no
 * longer the default renderer for file messages.
 */
export const CometChatFileBubble: React.FC<CometChatFileBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const loggedInUser = useLoggedInUser();
  const [isExpanded, setIsExpanded] = useState(false);

  const attachments = useMemo(() => extractFileAttachments(message), [message]);
  const caption = useMemo(() => extractFileCaption(message), [message]);

  const variant: 'incoming' | 'outgoing' =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const isSentByMe = variant === 'outgoing';

  const collapsedFiles = useMemo(() => attachments.slice(0, COLLAPSED_MAX), [attachments]);
  const remainingCount = Math.max(0, attachments.length - COLLAPSED_MAX);
  const hasOverflow = remainingCount > 0;

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // --- CSS classes ---

  const rootClasses = [
    'cometchat-file-bubble',
    variant === 'incoming' ? 'cometchat-file-bubble--receiver' : 'cometchat-file-bubble--sender',
    isExpanded ? 'cometchat-file-bubble--expanded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // --- Render a single file item ---

  const renderFileItem = (
    attachment: CometChatFileBubbleAttachment,
    index: number
  ): React.ReactNode => {
    const icon = getFileIcon(attachment.extension, attachment.mimeType);
    const sizeText =
      formatFileSize(attachment.size) || getLocalizedString('file_bubble_unknown_size');

    return (
      <div
        key={attachment.url || index}
        className={'cometchat-file-bubble__file-item'}
        aria-label={`${attachment.name}, ${sizeText}`}
      >
        <img
          src={icon}
          className={'cometchat-file-bubble__icon'}
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <div className={'cometchat-file-bubble__metadata'} aria-hidden="true">
          <span className={'cometchat-file-bubble__filename'}>{attachment.name}</span>
          <span className={'cometchat-file-bubble__filesize'}>{sizeText}</span>
        </div>
        {attachment.url && (
          <CometChatDownloadButton
            url={attachment.url}
            fileName={attachment.name}
            className="cometchat-file-bubble__download"
          />
        )}
      </div>
    );
  };

  // --- Visible files ---
  const visibleFiles = isExpanded ? attachments : collapsedFiles;

  return (
    <div className={rootClasses}>
      {/* File container */}
      <div className={'cometchat-file-bubble__container'}>
        {/* File items */}
        {visibleFiles.map((att, i) => renderFileItem(att, i))}

        {/* Show more / Show less — right-aligned */}
        {hasOverflow && !isExpanded && (
          <button
            type="button"
            className={'cometchat-file-bubble__toggle-control'}
            onClick={toggleExpanded}
            aria-label={getLocalizedString('accessibility_show_more_files').replace(
              '{count}',
              String(remainingCount)
            )}
            aria-expanded={false}
          >
            Show more{' '}
            <span className={'cometchat-file-bubble__toggle-count'}>+{remainingCount}</span>
          </button>
        )}

        {hasOverflow && isExpanded && (
          <button
            type="button"
            className={'cometchat-file-bubble__toggle-control'}
            onClick={toggleExpanded}
            aria-label={getLocalizedString('text_message_show_less')}
            aria-expanded={true}
          >
            Show less
          </button>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className={'cometchat-file-bubble__caption'}>
          <CometChatTextBubble
            text={caption}
            message={message}
            textFormatters={textFormatters}
            isSentByMe={isSentByMe}
          />
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-deprecated -- setting displayName on the deprecated component itself
CometChatFileBubble.displayName = 'CometChatFileBubble';
