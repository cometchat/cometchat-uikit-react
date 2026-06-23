import React from 'react';
import { CometChatAvatarRoot } from './CometChatAvatarRoot';
import { CometChatAvatarImage } from './CometChatAvatarImage';
import { CometChatAvatarInitials } from './CometChatAvatarInitials';
import { CometChatAvatarStatusIndicator } from './CometChatAvatarStatusIndicator';
import type { CometChatAvatarRootProps, CometChatAvatarStatus } from './CometChatAvatar.types';

/**
 * Flat API props for CometChatAvatar.
 * Renders Root + Image + Initials + optional StatusIndicator in one call.
 */
export interface CometChatAvatarProps extends Omit<CometChatAvatarRootProps, 'children'> {
  /** Optional online/offline status indicator. Omit to hide. */
  status?: CometChatAvatarStatus;
}

/**
 * CometChatAvatar — Flat API component.
 *
 * Usage (flat):
 * ```tsx
 * <CometChatAvatar name="John Doe" image={url} size="medium" />
 * <CometChatAvatar name="Jane" image={url} size="large" status="online" />
 * ```
 *
 * Usage (compound):
 * ```tsx
 * <CometChatAvatar.Root name="John Doe" image={url} size="medium">
 *   <CometChatAvatar.Image />
 *   <CometChatAvatar.Initials />
 *   <CometChatAvatar.StatusIndicator status="online" />
 * </CometChatAvatar.Root>
 * ```
 */
const CometChatAvatarComponent: React.FC<CometChatAvatarProps> = ({ status, ...rootProps }) => {
  return (
    <CometChatAvatarRoot {...rootProps}>
      <CometChatAvatarImage />
      <CometChatAvatarInitials />
      {status && <CometChatAvatarStatusIndicator status={status} />}
    </CometChatAvatarRoot>
  );
};

CometChatAvatarComponent.displayName = 'CometChatAvatar';

export const CometChatAvatar = Object.assign(CometChatAvatarComponent, {
  Root: CometChatAvatarRoot,
  Image: CometChatAvatarImage,
  Initials: CometChatAvatarInitials,
  StatusIndicator: CometChatAvatarStatusIndicator,
});
