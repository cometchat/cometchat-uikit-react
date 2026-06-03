import { CometChatFullScreenViewerRoot } from './CometChatFullScreenViewerRoot';
import { CometChatFullScreenViewerHeader } from './CometChatFullScreenViewerHeader';
import { CometChatFullScreenViewerBody } from './CometChatFullScreenViewerBody';
import { CometChatFullScreenViewerNavigation } from './CometChatFullScreenViewerNavigation';

/**
 * CometChatFullScreenViewer — compound component for full-screen media viewing.
 *
 * Supports images, videos, audio, and file previews in single or gallery mode.
 * The component is always visible when mounted — unmount it to close.
 *
 * Usage:
 * ```tsx
 * {showViewer && (
 *   <CometChatFullScreenViewer.Root
 *     onClose={() => setShowViewer(false)}
 *     url="https://example.com/photo.jpg"
 *     mediaType="image"
 *     senderName="John Doe"
 *   />
 * )}
 * ```
 */
export const CometChatFullScreenViewer = {
  Root: CometChatFullScreenViewerRoot,
  Header: CometChatFullScreenViewerHeader,
  Body: CometChatFullScreenViewerBody,
  Navigation: CometChatFullScreenViewerNavigation,
} as const;
