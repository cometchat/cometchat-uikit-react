import { useCometChatAvatarContext } from './CometChatAvatar.context';
import type { CometChatAvatarInitialsProps } from './CometChatAvatar.types';
import { getInitials } from './CometChatAvatar.utils';
import './CometChatAvatar.css';

export function CometChatAvatarInitials({ className }: CometChatAvatarInitialsProps) {
  const { name, image, imageLoaded, imageError } = useCometChatAvatarContext();

  // Hide initials when image loaded successfully
  if (image && imageLoaded && !imageError) return null;

  return (
    <span className={`cometchat-avatar__initials ${className ?? ''}`} aria-label={name}>
      {getInitials(name)}
    </span>
  );
}
