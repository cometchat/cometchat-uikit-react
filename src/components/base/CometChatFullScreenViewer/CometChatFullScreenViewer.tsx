import React from 'react';
import { CometChatFullScreenViewerRoot } from './CometChatFullScreenViewerRoot';
import { CometChatFullScreenViewerHeader } from './CometChatFullScreenViewerHeader';
import { CometChatFullScreenViewerBody } from './CometChatFullScreenViewerBody';
import { CometChatFullScreenViewerNavigation } from './CometChatFullScreenViewerNavigation';
import type { CometChatFullScreenViewerRootProps } from './CometChatFullScreenViewer.types';

/**
 * Flat API props for CometChatFullScreenViewer.
 * Same as Root props but without children (always renders default layout).
 */
export type CometChatFullScreenViewerProps = Omit<CometChatFullScreenViewerRootProps, 'children'>;

/**
 * CometChatFullScreenViewer — Flat API component.
 *
 * Renders the full-screen viewer with default Header + Body + Navigation layout.
 * Mount/unmount to show/hide.
 *
 * Usage (flat):
 * ```tsx
 * {showViewer && (
 *   <CometChatFullScreenViewer
 *     onClose={() => setShowViewer(false)}
 *     url="https://example.com/photo.jpg"
 *     mediaType="image"
 *     senderName="John Doe"
 *   />
 * )}
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatFullScreenViewer.Root onClose={handleClose} url={url}>
 *   <CometChatFullScreenViewer.Header />
 *   <CometChatFullScreenViewer.Body />
 * </CometChatFullScreenViewer.Root>
 * ```
 */
const CometChatFullScreenViewerComponent: React.FC<CometChatFullScreenViewerProps> = props => {
  return <CometChatFullScreenViewerRoot {...props} />;
};

CometChatFullScreenViewerComponent.displayName = 'CometChatFullScreenViewer';

export const CometChatFullScreenViewer = Object.assign(CometChatFullScreenViewerComponent, {
  Root: CometChatFullScreenViewerRoot,
  Header: CometChatFullScreenViewerHeader,
  Body: CometChatFullScreenViewerBody,
  Navigation: CometChatFullScreenViewerNavigation,
});
