import { useCometChatAvatarContext } from './CometChatAvatar.context';
import { useLocale } from '../../../context/locale/LocaleContext';
import type { CometChatAvatarImageProps } from './CometChatAvatar.types';
import './CometChatAvatar.css';

export function CometChatAvatarImage({ className }: CometChatAvatarImageProps) {
  const { image, name, imageError } = useCometChatAvatarContext();
  const { getLocalizedString } = useLocale();

  if (!image || imageError) return null;

  return (
    <img
      src={image}
      alt={name || getLocalizedString('accessibility_avatar')}
      loading="lazy"
      decoding="async"
      className={`cometchat-avatar__image ${className ?? ''}`}
    />
  );
}
