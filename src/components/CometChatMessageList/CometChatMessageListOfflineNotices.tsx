import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { useLocale } from '../../context/locale/LocaleContext';
import { isSessionWideNotice, OfflineHub, type OfflineNotice } from '../../utils/offline/hub';
import { offlineNoticeText } from '../../utils/offline/notices';
import { isMessageForConversation } from './CometChatMessageList.utils';
import { listKeyOf } from './messageListOffline';

/** At most this many notices are shown at once; the newest win. */
const MAX_VISIBLE = 3;

/**
 * How long the short "Sending… try again in a moment" notice stays (R162). It
 * answers one tap, so it goes by itself; a newer one replaces it.
 */
export const SEND_IN_FLIGHT_NOTICE_MS = 4_000;

/**
 * How long the "Too many messages waiting to send" notice stays. It answers one
 * refused send, so it goes by itself, as in the other kits, and a drained
 * queue never leaves it behind.
 */
export const QUEUE_FULL_NOTICE_MS = 5_000;

/** How long a notice stays before it goes by itself; none for the others. */
function autoDismissMs(notice: OfflineNotice): number | undefined {
  if (notice.kind === 'send_in_flight') return SEND_IN_FLIGHT_NOTICE_MS;
  if (notice.kind === 'queue_full') return QUEUE_FULL_NOTICE_MS;
  return undefined;
}

function addNotice(previous: OfflineNotice[], notice: OfflineNotice): OfflineNotice[] {
  const kept =
    notice.kind === 'send_in_flight' ? previous.filter(n => n.kind !== 'send_in_flight') : previous;
  return [...kept, notice].slice(-MAX_VISIBLE);
}

export interface CometChatMessageListOfflineNoticesProps {
  user: CometChat.User | undefined;
  group: CometChat.Group | undefined;
  parentMessageId: number | undefined;
  loggedInUser: CometChat.User;
}

function textOf(message: CometChat.BaseMessage | undefined): string {
  if (message?.getType() !== 'text') return '';
  try {
    return (message as CometChat.TextMessage).getText();
  } catch {
    return '';
  }
}

/**
 * Offline support only: one-line notices about unsent messages for this list
 * (a removed unsent message, with Copy for text; a full queue, which goes by itself; a file too large
 * to send offline; messages not sent after offline was switched off; unsent
 * messages lost in a cache reset). Announced politely to screen readers.
 *
 * Renders nothing until the hub raises a notice, so with offline off the list's
 * output is unchanged.
 *
 * @internal
 */
export const CometChatMessageListOfflineNotices: React.FC<
  CometChatMessageListOfflineNoticesProps
> = ({ user, group, parentMessageId, loggedInUser }) => {
  const { getLocalizedString, language } = useLocale();
  const [notices, setNotices] = useState<OfflineNotice[]>([]);
  const uid = loggedInUser.getUid();
  const userId = user?.getUid();
  const groupId = group?.getGuid();

  useEffect(() => {
    // Another chat (or user): the previous chat's notices are not this one's.
    setNotices(previous => (previous.length === 0 ? previous : []));
    const hub = OfflineHub.getInstance();
    const key = listKeyOf({ user, group, parentMessageId });
    const isForThisList = (notice: OfflineNotice): boolean => {
      if (notice.listKey) return notice.listKey === key;
      if (notice.message) {
        try {
          return isMessageForConversation(notice.message, user, group, parentMessageId, uid, {
            excludeSender: false,
          });
        } catch {
          return false;
        }
      }
      // A session-wide notice (cache reset): the main list shows it.
      return !parentMessageId;
    };
    // A reset reported before any list mounted (during init or login); the
    // main list takes it, a thread list never does.
    if (!parentMessageId) {
      const replayed = hub.takeSessionNotices();
      if (replayed.length > 0) {
        setNotices(previous => [...previous, ...replayed].slice(-MAX_VISIBLE));
      }
    }
    const stopNotice = hub.notice.subscribe(notice => {
      if (!isForThisList(notice)) return;
      // A session-wide notice is shown in one place only.
      if (isSessionWideNotice(notice) && !hub.claimSessionNotice(notice.id)) return;
      setNotices(previous => addNotice(previous, notice));
    });
    const stopSession = hub.session.subscribe(gen => {
      setNotices(previous => previous.filter(n => n.gen >= gen));
    });
    return () => {
      stopNotice();
      stopSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, groupId, parentMessageId, uid]);

  const dismiss = useCallback((id: number) => {
    setNotices(previous => previous.filter(n => n.id !== id));
  }, []);

  // The short in-flight and queue-full notices dismiss themselves.
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = timersRef.current;
    for (const notice of notices) {
      const ms = autoDismissMs(notice);
      if (ms === undefined || timers.has(notice.id)) continue;
      timers.set(
        notice.id,
        setTimeout(() => {
          timers.delete(notice.id);
          dismiss(notice.id);
        }, ms)
      );
    }
  }, [notices, dismiss]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => {
        clearTimeout(timer);
      });
      timers.clear();
    };
  }, []);

  const copy = useCallback(
    (notice: OfflineNotice) => {
      const text = textOf(notice.message);
      // No Clipboard API (insecure context, older browser): Copy only closes it.
      if (text) void (navigator as Partial<Navigator>).clipboard?.writeText(text).catch(() => undefined);
      dismiss(notice.id);
    },
    [dismiss]
  );

  if (notices.length === 0) return null;

  return (
    <div className={'cometchat-message-list__offline-notices'} data-testid="offline-notices">
      {notices.map(notice => (
        <div
          key={notice.id}
          className={'cometchat-message-list__offline-notice'}
          data-testid="offline-notice"
          data-cc="notice"
          data-cc-key={notice.kind}
          data-cc-count={notice.count !== undefined ? String(notice.count) : ''}
          role="status"
          aria-live="polite"
        >
          <span className={'cometchat-message-list__offline-notice-text'}>
            {offlineNoticeText(notice, getLocalizedString, language)}
          </span>
          {notice.kind === 'unsent_message_removed' && textOf(notice.message) !== '' && (
            <button
              type="button"
              className={'cometchat-message-list__offline-notice-action'}
              onClick={() => {
                copy(notice);
              }}
            >
              {getLocalizedString('message_list_option_copy')}
            </button>
          )}
          <button
            type="button"
            className={'cometchat-message-list__offline-notice-close'}
            aria-label={getLocalizedString('close')}
            onClick={() => {
              dismiss(notice.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

CometChatMessageListOfflineNotices.displayName = 'CometChatMessageListOfflineNotices';
