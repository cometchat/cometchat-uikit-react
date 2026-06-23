import React, { useEffect, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatDate } from '../base/CometChatDate';
import type { CometChatDateFormatConfig } from '../base/CometChatDate/CometChatDate.types';
import './CometChatMessageList.css';

export interface CometChatMessageListFloatingDateProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  allMessages: CometChat.BaseMessage[];
  hideStickyDate?: boolean;
  hideDateSeparator?: boolean;
  stickyDateTimeFormat?: CometChatDateFormatConfig | undefined;
}

/**
 * CometChatMessageListFloatingDate — floating date header that tracks the
 * topmost visible message on scroll.
 *
 * Self-contained: manages its own scroll listener + RAF-throttled update.
 */
export const CometChatMessageListFloatingDate: React.FC<CometChatMessageListFloatingDateProps> = ({
  scrollContainerRef,
  allMessages,
  hideStickyDate,
  hideDateSeparator,
  stickyDateTimeFormat,
}) => {
  const [floatingTimestamp, setFloatingTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || allMessages.length === 0) return;

    // Build a lookup: message id -> sentAt (seconds).
    const idToSentAt = new Map<string, number>();
    for (const msg of allMessages) {
      const id = String(msg.getId() || msg.getMuid());
      idToSentAt.set(id, msg.getSentAt());
    }

    let rafId: number | null = null;

    const updateFloatingDate = () => {
      rafId = null;
      const root = scrollContainerRef.current;
      if (!root) return;

      const rootRect = root.getBoundingClientRect();
      // Look a bit below the top edge so the chip reflects the message that
      // is about to pass under it.
      const probeY = rootRect.top + 8;

      const items = root.querySelectorAll<HTMLElement>('[data-message-id]');
      let chosenId: string | null = null;
      for (const el of items) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom >= probeY) {
          chosenId = el.getAttribute('data-message-id');
          break;
        }
      }

      if (!chosenId) return;
      const ts = idToSentAt.get(chosenId);
      if (ts != null) {
        setFloatingTimestamp(prev => (prev === ts ? prev : ts));
      }
    };

    const onScroll = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(updateFloatingDate);
    };

    // Initial pick.
    updateFloatingDate();
    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [allMessages, scrollContainerRef]);

  if (hideDateSeparator || hideStickyDate || floatingTimestamp == null) {
    return null;
  }

  return (
    <div className={'cometchat-message-list__floating-date'} aria-hidden="true">
      <CometChatDate
        timestamp={floatingTimestamp}
        variant="separator"
        {...(stickyDateTimeFormat ? { formatConfig: stickyDateTimeFormat } : {})}
      />
    </div>
  );
};

CometChatMessageListFloatingDate.displayName = 'CometChatMessageListFloatingDate';
