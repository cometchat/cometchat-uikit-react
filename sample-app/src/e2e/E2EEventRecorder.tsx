import { useEffect } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit, useCometChatEvents } from '@cometchat/chat-uikit-react';

/**
 * Offline E2E only (`vite --mode offline-e2e`): records the kit's public send
 * and offline events on `window.__ccEvents` so the offline Playwright suite can
 * assert them (one ccMessageSent per transition, send-state-changed, cache
 * reset). Never mounted in any other mode.
 */
interface RecordedEvent {
  type: string;
  status?: string;
  state?: string;
  reason?: string;
  muid?: string;
  localMessageId?: string;
  id?: number;
  pendingMessagesLost?: number | null;
}

declare global {
  interface Window {
    __ccEvents?: RecordedEvent[];
    /** The kit's public static send, for UIT-SEND-15 (its Promise contract). */
    __ccKit?: { sendText: (uid: string, text: string) => Promise<unknown> };
  }
}

function describeMessage(message: unknown): Pick<RecordedEvent, 'muid' | 'localMessageId' | 'id'> {
  const m = message as {
    getMuid?: () => string;
    getId?: () => number;
    getLocalMessageId?: () => string;
    getData?: () => { localMessageId?: string } | undefined;
  };
  return {
    muid: m.getMuid?.() ?? '',
    id: Number(m.getId?.() ?? 0),
    localMessageId: m.getLocalMessageId?.() || m.getData?.()?.localMessageId || '',
  };
}

export function E2EEventRecorder(): null {
  useEffect(() => {
    window.__ccKit = {
      sendText: (uid, text) => {
        const message = new CometChat.TextMessage(uid, text, CometChat.RECEIVER_TYPE.USER);
        return CometChatUIKit.sendTextMessage(message);
      },
    };
    return () => {
      delete window.__ccKit;
    };
  }, []);
  useCometChatEvents(raw => {
    // Read loosely: the app also builds against a published kit (7.2.x) whose
    // event union has no offline members.
    const event = raw as unknown as {
      type: string;
      status?: string;
      state?: string;
      reason?: string;
      message?: unknown;
      pendingMessagesLost?: number | null;
    };
    const log = (window.__ccEvents ??= []);
    switch (event.type) {
      case 'ui:message/sent':
        log.push({
          type: event.type,
          ...(event.status !== undefined ? { status: event.status } : {}),
          ...describeMessage(event.message),
        });
        break;
      case 'ui:message/send-state-changed':
        log.push({
          type: event.type,
          ...(event.state !== undefined ? { state: event.state } : {}),
          ...(event.reason ? { reason: event.reason } : {}),
          ...describeMessage(event.message),
        });
        break;
      case 'ui:offline/cache-reset':
        log.push({
          type: event.type,
          ...(event.reason !== undefined ? { reason: event.reason } : {}),
          pendingMessagesLost: event.pendingMessagesLost ?? null,
        });
        break;
      default:
        break;
    }
  }, []);
  return null;
}
