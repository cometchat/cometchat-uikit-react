import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import './OfflineMediaUnavailable.css';

/**
 * Offline support only: "Available when online" on a media bubble whose bytes
 * the SDK has not cached, shown while the device is offline (UIK-MEDIA-01).
 * A tap asks the SDK to download the media; the bubble re-resolves when the
 * SDK reports it cached. Rendered only when `useCachedMedia` says so, so with
 * offline off the bubble's output is unchanged.
 *
 * @internal
 */
export const OfflineMediaUnavailable: React.FC<{ onDownload: () => void }> = ({ onDownload }) => {
  const { getLocalizedString } = useLocale();
  return (
    <button
      type="button"
      className={'cometchat-offline-media-unavailable'}
      data-testid="offline-media-unavailable"
      onClick={event => {
        event.stopPropagation();
        onDownload();
      }}
    >
      {getLocalizedString('message_bubble_media_available_when_online')}
    </button>
  );
};

OfflineMediaUnavailable.displayName = 'OfflineMediaUnavailable';
