import React, { useCallback, useMemo } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatCardView,
  type CometChatCardThemeMode,
  type CometChatCardThemeOverride,
  type CometChatCardAction,
  type CometChatCardActionEvent,
} from '@cometchat/cards-react';
import { usePublishEvent } from '../../../hooks/usePublishEvent';
import { useLocale } from '../../../context/locale/LocaleContext';
import './CometChatCardBubble.css';

/**
 * Props for {@link CometChatCardBubble}.
 */
export interface CometChatCardBubbleProps {
  /** The developer card message (`category: "card"`). */
  message: CometChat.CardMessage;
  /** Theme mode forwarded to the renderer. Defaults to `"auto"`. */
  themeMode?: CometChatCardThemeMode;
  /** Optional theme overrides forwarded to the renderer. */
  themeOverride?: CometChatCardThemeOverride;
  /**
   * Optional direct callback for card actions. Fired in addition to the
   * `ui:card/action` UI event so an app embedding the bubble directly can
   * receive actions without subscribing to the event bus.
   */
  onCardAction?: (message: CometChat.BaseMessage, action: CometChatCardAction) => void;
}

/**
 * Render-only bubble for developer cards (`category: "card"`).
 *
 * Mirrors `CometChatTextBubble`: the kit performs zero transformation — it
 * stringifies the raw card payload from `getCard()` and hands it to the prebuilt
 * `CometChatCardView` renderer, then forwards user actions back to the app.
 * It never parses or mutates the card body, and never performs an action itself.
 *
 * When `getCard()` is absent/empty the renderer is not invoked; the bubble falls
 * back to `getFallbackText()` → `getText()` → localized "Card Message".
 */
export const CometChatCardBubble: React.FC<CometChatCardBubbleProps> = ({
  message,
  themeMode = 'auto',
  themeOverride,
  onCardAction,
}) => {
  const publish = usePublishEvent();
  const { getLocalizedString } = useLocale();

  // Stringify the raw card payload. No transformation — same as NotificationFeed.
  const cardJson = useMemo(() => {
    try {
      const card = message.getCard();
      if (card == null) return '';
      return JSON.stringify(card);
    } catch {
      return '';
    }
  }, [message]);

  // Forward the raw action to the app. The renderer always receives this callback
  // alongside `cardJson`, so the action handler is wired before the schema renders.
  const handleAction = useCallback(
    (event: CometChatCardActionEvent) => {
      onCardAction?.(message, event.action);
      publish({ type: 'ui:card/action', message, action: event.action });
    },
    [message, onCardAction, publish]
  );

  if (cardJson) {
    return (
      <div className="cometchat-card-bubble">
        <CometChatCardView
          cardJson={cardJson}
          themeMode={themeMode}
          themeOverride={themeOverride}
          onAction={handleAction}
        />
      </div>
    );
  }

  // Fallback path — never pass an empty schema to the renderer.
  const fallbackText =
    message.getFallbackText() ||
    message.getText() ||
    getLocalizedString('card_message_fallback') ||
    'Card Message';

  return (
    <div className="cometchat-card-bubble cometchat-card-bubble__fallback">{fallbackText}</div>
  );
};

CometChatCardBubble.displayName = 'CometChatCardBubble';
