import { useCometChatAvatarContext } from './CometChatAvatar.context';
import type { CometChatAvatarImageProps } from './CometChatAvatar.types';
import './CometChatAvatar.css';

export function CometChatAvatarImage({ className }: CometChatAvatarImageProps) {
  const { image, name, imageError } = useCometChatAvatarContext();

  if (!image || imageError) return null;

  return (
    <img
      src={image}
      alt={name || 'Avatar'}
      loading="lazy"
      decoding="async"
      className={`cometchat-avatar__image ${className ?? ''}`}
    />
  );
}
