import type { ReactNode } from 'react';

/** Media type supported by the fullscreen viewer. */
export type CometChatFullScreenViewerMediaType = 'image' | 'video' | 'audio' | 'file';

/** A single media attachment for gallery mode. */
export interface CometChatMediaAttachment {
  /** Media URL. */
  url: string;
  /** Type of media. */
  type: CometChatFullScreenViewerMediaType;
  /** File name (displayed in header and file preview). */
  name?: string;
  /** File size in bytes (displayed in header and file preview). */
  size?: number;
}

/** Props for CometChatFullScreenViewer.Root. */
export interface CometChatFullScreenViewerRootProps {
  /** Callback when the viewer requests to close. */
  onClose: () => void;
  /** Media URL (single mode). */
  url?: string;
  /** Media type (single mode). Defaults to 'image'. */
  mediaType?: CometChatFullScreenViewerMediaType;
  /** File name (single mode). */
  fileName?: string;
  /** File size in bytes (single mode). */
  fileSize?: number;
  /** Array of media attachments (gallery mode). */
  attachments?: CometChatMediaAttachment[];
  /** Starting index for gallery mode. Defaults to 0. */
  startIndex?: number;
  /** Sender name displayed in header. */
  senderName?: string;
  /** Sender avatar URL displayed in header. */
  senderAvatar?: string;
  /** Sender status text. */
  senderStatus?: string;
  /** Formatted timestamp string displayed in header. */
  sentAt?: string;
  /** Callback when the gallery index changes. */
  onIndexChange?: (index: number) => void;
  /** Callback when the download button is clicked. */
  onDownload?: (attachment: CometChatMediaAttachment | string) => void;
  /** Children (sub-components or custom content). */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFullScreenViewer.Header. */
export interface CometChatFullScreenViewerHeaderProps {
  /** Override default header content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFullScreenViewer.Body. */
export interface CometChatFullScreenViewerBodyProps {
  /** Override default body content. */
  children?: ReactNode;
  /** Optional custom className. */
  className?: string;
}

/** Props for CometChatFullScreenViewer.Navigation. */
export interface CometChatFullScreenViewerNavigationProps {
  /** Optional custom className. */
  className?: string;
}

/** Context value for CometChatFullScreenViewer. */
export interface CometChatFullScreenViewerContextValue {
  onClose: () => void;
  mediaType: CometChatFullScreenViewerMediaType;
  currentUrl: string;
  currentIndex: number;
  attachments: CometChatMediaAttachment[];
  isGalleryMode: boolean;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  navigatePrev: () => void;
  navigateNext: () => void;
  senderName: string | undefined;
  senderAvatar: string | undefined;
  senderStatus: string | undefined;
  sentAt: string | undefined;
  fileName: string | undefined;
  fileSize: number | undefined;
  onDownload: ((attachment: CometChatMediaAttachment | string) => void) | undefined;
}
