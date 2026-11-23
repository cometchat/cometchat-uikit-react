import React, { useEffect, useState } from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { isSessionWideNotice, OfflineHub, type OfflineNotice } from '../../utils/offline/hub';
import { offlineNoticeText } from '../../utils/offline/notices';

/**
 * Offline support only: the notice shown when the Chat SDK's offline cache was
 * reset and unsent messages were or may have been lost (UIK-LIFE-02).
 * Announced politely to screen readers. Renders nothing until the hub raises
 * such a notice, so with offline off the list's output is unchanged.
 *
 * @internal
 */
export const CometChatConversationsOfflineNotices: React.FC = () => {
  const { getLocalizedString, language } = useLocale();
  const [notices, setNotices] = useState<OfflineNotice[]>([]);

  useEffect(() => {
    const hub = OfflineHub.getInstance();
    // A reset reported before this list mounted (during init or login).
    const replayed = hub.takeSessionNotices();
    if (replayed.length > 0) setNotices(previous => [...previous, ...replayed].slice(-2));
    const stopNotice = hub.notice.subscribe(notice => {
      if (!isSessionWideNotice(notice)) return;
      // Shown in one place: another mounted list may have taken it.
      if (!hub.claimSessionNotice(notice.id)) return;
      setNotices(previous => [...previous, notice].slice(-2));
    });
    const stopSession = hub.session.subscribe(gen => {
      setNotices(previous => previous.filter(n => n.gen >= gen));
    });
    return () => {
      stopNotice();
      stopSession();
    };
  }, []);

  if (notices.length === 0) return null;

  return (
    <div className={'cometchat-conversations__offline-notices'}>
      {notices.map(notice => (
        <div
          key={notice.id}
          className={'cometchat-conversations__offline-notice'}
          data-testid="offline-notice"
          data-cc="notice"
          data-cc-key={notice.kind}
          data-cc-count={notice.count !== undefined ? String(notice.count) : ''}
          role="status"
          aria-live="polite"
        >
          <span className={'cometchat-conversations__offline-notice-text'}>
            {offlineNoticeText(notice, getLocalizedString, language)}
          </span>
          <button
            type="button"
            className={'cometchat-conversations__offline-notice-close'}
            aria-label={getLocalizedString('close')}
            onClick={() => {
              setNotices(previous => previous.filter(n => n.id !== notice.id));
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

CometChatConversationsOfflineNotices.displayName = 'CometChatConversationsOfflineNotices';
