import type { CometChatAvatarStatusIndicatorProps } from './CometChatAvatar.types';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatAvatar.css';

export function CometChatAvatarStatusIndicator({
  status,
  className,
}: CometChatAvatarStatusIndicatorProps) {
  const { getLocalizedString } = useLocale();
  return (
    <span
      className={`cometchat-avatar__status-indicator ${className ?? ''}`}
      data-status={status}
      role="status"
      aria-label={
        status === 'online'
          ? getLocalizedString('accessibility_online')
          : getLocalizedString('accessibility_offline')
      }
    />
  );
}
