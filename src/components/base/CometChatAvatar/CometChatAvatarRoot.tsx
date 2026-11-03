import type { CometChatAvatarRootProps } from './CometChatAvatar.types';
import { CometChatAvatarContext } from './CometChatAvatar.context';
import { useCometChatAvatar } from './useCometChatAvatar';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatAvatar.css';

export function CometChatAvatarRoot({
  name = '',
  image = '',
  size = 'medium',
  className,
  children,
}: CometChatAvatarRootProps) {
  const { imageLoaded, imageError } = useCometChatAvatar({ image });
  const { getLocalizedString } = useLocale();

  const contextValue = { name, image, size, imageLoaded, imageError };

  return (
    <CometChatAvatarContext.Provider value={contextValue}>
      <div
        className={`cometchat-avatar ${className ?? ''}`}
        data-size={size}
        role="img"
        aria-label={name || getLocalizedString('accessibility_avatar')}
      >
        {children}
      </div>
    </CometChatAvatarContext.Provider>
  );
}
