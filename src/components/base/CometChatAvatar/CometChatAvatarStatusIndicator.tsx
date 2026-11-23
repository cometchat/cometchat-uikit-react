import type { CometChatAvatarStatusIndicatorProps } from './CometChatAvatar.types';
import { useLocale } from '../../../context/locale/LocaleContext';
import { usePresenceSuppressed } from '../../../utils/offline/presence';
import './CometChatAvatar.css';

export function CometChatAvatarStatusIndicator({
  status,
  className,
}: CometChatAvatarStatusIndicatorProps) {
  const { getLocalizedString } = useLocale();
  // Offline on and not connected: no presence anywhere in the kit.
  const presenceHidden = usePresenceSuppressed();
  if (presenceHidden) return null;
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
