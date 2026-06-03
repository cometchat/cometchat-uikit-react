import type { ReactNode } from 'react';

/** Size variants for the avatar. */
export type CometChatAvatarSize = 'small' | 'medium' | 'large';

/** Props for AvatarRoot. */
export interface CometChatAvatarRootProps {
  /** Name used for initials fallback and alt text. */
  name?: string;
  /** URL of the avatar image. */
  image?: string;
  /** Size variant. Defaults to 'medium'. */
  size?: CometChatAvatarSize;
  /** Optional custom className. */
  className?: string;
  children?: ReactNode;
}

/** Props for AvatarImage. */
export interface CometChatAvatarImageProps {
  /** Optional custom className. */
  className?: string;
}

/** Props for AvatarInitials. */
export interface CometChatAvatarInitialsProps {
  /** Optional custom className. */
  className?: string;
}

/** Status indicator state. */
export type CometChatAvatarStatus = 'online' | 'offline';

/** Props for AvatarStatusIndicator. */
export interface CometChatAvatarStatusIndicatorProps {
  /** Online/offline status. */
  status: CometChatAvatarStatus;
  /** Optional custom className. */
  className?: string;
}

/** Context value exposed by AvatarRoot. */
export interface CometChatAvatarContextValue {
  name: string;
  image: string;
  size: CometChatAvatarSize;
  /** Whether the image has loaded successfully. */
  imageLoaded: boolean;
  /** Whether the image failed to load. */
  imageError: boolean;
}
