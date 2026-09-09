import React, { useCallback, useMemo, useState } from 'react';
import type { CometChatFilesBubbleProps } from './CometChatFilesBubble.types';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { CometChatDownloadButton } from '../base/CometChatDownloadButton/CometChatDownloadButton';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import {
  extractFileAttachments,
  extractFileCaption,
  formatFileSize,
} from './CometChatFilesBubble.utils';
import fileTypePdf from '../../assets/file_type_pdf.svg';
import fileTypeWord from '../../assets/file_type_word.svg';
import fileTypeXlsx from '../../assets/file_type_xlsx.svg';
import fileTypePpt from '../../assets/file_type_ppt.svg';
import fileTypeTxt from '../../assets/file_type_txt.svg';
import fileTypeZip from '../../assets/file_type_zip.svg';
import fileTypeMp3 from '../../assets/file_type_mp3.svg';
import fileTypeMov from '../../assets/file_type_mov.svg';
import fileTypeJpg from '../../assets/file_type_jpg.svg';
import fileTypeUnsupported from '../../assets/file_type_unsupported.svg';
import './CometChatFilesBubble.css';

/** Maximum files to show before requiring expand. */
const COLLAPSED_MAX = 3;

/** Map a filename's extension to a file-type icon asset (matches tray). */
function fileTypeIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'pdf':
      return fileTypePdf;
    case 'doc':
    case 'docx':
      return fileTypeWord;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return fileTypeXlsx;
    case 'ppt':
    case 'pptx':
      return fileTypePpt;
    case 'txt':
    case 'rtf':
      return fileTypeTxt;
    case 'zip':
    case 'rar':
    case '7z':
    case 'gz':
      return fileTypeZip;
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'aac':
    case 'ogg':
      return fileTypeMp3;
    case 'mov':
    case 'mp4':
    case 'avi':
    case 'mkv':
      return fileTypeMov;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'bmp':
    case 'svg':
    case 'heic':
    case 'heif':
      return fileTypeJpg;
    default:
      return fileTypeUnsupported;
  }
}

/** Extract the uppercased file extension for the meta label. */
function fileExtLabel(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return 'FILE';
  return (parts.pop() ?? '').toUpperCase();
}

/**
 * CometChatFilesBubble — renders file attachments matching the tray card UI.
 *
 * Each card: [file-type icon | filename + ext/size meta | download button].
 * When >1 files: wraps in a background container.
 * When >3 files: collapsed with "+N more" expander.
 */
export const CometChatFilesBubble: React.FC<CometChatFilesBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
}) => {
  const loggedInUser = useLoggedInUser();
  const { getLocalizedString } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  const variant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const isSentByMe = variant === 'outgoing';

  const attachments = useMemo(() => extractFileAttachments(message), [message]);
  const caption = useMemo(() => extractFileCaption(message), [message]);
  const hasMultiple = attachments.length > 1;

  const collapsedItems = useMemo(() => attachments.slice(0, COLLAPSED_MAX), [attachments]);
  const remainingCount = Math.max(0, attachments.length - COLLAPSED_MAX);
  const hasOverflow = remainingCount > 0;
  const visibleItems = isExpanded ? attachments : collapsedItems;

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const rootClasses = [
    'cometchat-files-bubble',
    variant === 'incoming'
      ? 'cometchat-files-bubble--incoming'
      : 'cometchat-files-bubble--outgoing',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div
        className={`cometchat-files-bubble__container${hasMultiple ? ' cometchat-files-bubble__container--multi' : ''}`}
      >
        {visibleItems.map((att, i) => (
          <div key={att.url || `file-${String(i)}`} className="cometchat-files-bubble__card">
            {/* File-type icon */}
            <div className="cometchat-files-bubble__card-icon">
              <img
                src={fileTypeIcon(att.name)}
                alt=""
                className="cometchat-files-bubble__card-icon-img"
                draggable={false}
              />
            </div>

            {/* Text: filename + meta */}
            <div className="cometchat-files-bubble__card-text">
              <span className="cometchat-files-bubble__card-name" title={att.name}>
                {att.name}
              </span>
              <span className="cometchat-files-bubble__card-meta">
                {fileExtLabel(att.name)}
                {att.size > 0 ? ` · ${formatFileSize(att.size)}` : ''}
              </span>
            </div>

            {/* Download button */}
            {att.url && <CometChatDownloadButton url={att.url} fileName={att.name} />}
          </div>
        ))}

        {/* Expand/collapse toggle for >3 files */}
        {hasOverflow && !isExpanded && (
          <button
            type="button"
            className="cometchat-files-bubble__toggle"
            onClick={toggleExpanded}
            aria-expanded={false}
            aria-label={`Show ${String(remainingCount)} more files`}
          >
            {(getLocalizedString('bubble_show_more') || 'Show {count} more').replace(
              '{count}',
              String(remainingCount)
            )}
            <svg
              className="cometchat-files-bubble__toggle-icon"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {hasOverflow && isExpanded && (
          <button
            type="button"
            className="cometchat-files-bubble__toggle"
            onClick={toggleExpanded}
            aria-expanded={true}
            aria-label="Show less"
          >
            {getLocalizedString('bubble_show_less') || 'Show less'}
            <svg
              className="cometchat-files-bubble__toggle-icon cometchat-files-bubble__toggle-icon--up"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="cometchat-files-bubble__caption">
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

CometChatFilesBubble.displayName = 'CometChatFilesBubble';
