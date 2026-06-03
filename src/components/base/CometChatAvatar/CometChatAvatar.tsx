import { CometChatAvatarRoot } from './CometChatAvatarRoot';
import { CometChatAvatarImage } from './CometChatAvatarImage';
import { CometChatAvatarInitials } from './CometChatAvatarInitials';
import { CometChatAvatarStatusIndicator } from './CometChatAvatarStatusIndicator';

/**
 * CometChatAvatar — compound component for user/group avatars.
 *
 * Usage:
 * ```tsx
 * <CometChatAvatar.Root name="John Doe" image={url} size="medium">
 *   <CometChatAvatar.Image />
 *   <CometChatAvatar.Initials />
 *   <CometChatAvatar.StatusIndicator status="online" />
 * </CometChatAvatar.Root>
 * ```
 */
export const CometChatAvatar = {
  Root: CometChatAvatarRoot,
  Image: CometChatAvatarImage,
  Initials: CometChatAvatarInitials,
  StatusIndicator: CometChatAvatarStatusIndicator,
} as const;
