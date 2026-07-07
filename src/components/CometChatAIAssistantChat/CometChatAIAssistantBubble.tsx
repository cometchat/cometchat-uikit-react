/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * CometChatAIAssistantBubble
 *
 * Renders completed AI assistant messages (category: 'agentic', type: 'assistant').
 * Uses the CometChatMarkdownFormatter to render rich markdown content including:
 * - Bold, italic, strikethrough, inline code
 * - Code blocks with syntax highlighting
 * - Lists (ordered and unordered)
 * - Tables, blockquotes, links
 * - Images (clickable to expand)
 *
 * Copy affordance: 1:1 AI assistant chat renders an inline copy button inside
 * the bubble. Group agent messages omit it (copy is offered via the message
 * context menu instead) — this is decided internally from the message's
 * receiver type, so callers don't pass a flag.
 *
 * Performance: uses content-visibility: auto (via CSS) to defer rendering
 * until the bubble is in the viewport.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCardView, type CometChatCardActionEvent } from '@cometchat/cards-react';
import type { CometChatAIAssistantBubbleProps } from './ai.types';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { sanitizeAIHtml } from './CometChatAISanitize';
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import { useLocale } from '../../context/locale/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { usePublishEvent } from '../../hooks/usePublishEvent';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import './CometChatAIAssistantBubble.css';
import copyIcon from '../../assets/Copy.svg';

// Singleton markdown formatter — no need to recreate per render
const markdownFormatter = new CometChatMarkdownFormatter();

/** Render an assistant text string to sanitized markdown HTML. */
function renderAssistantMarkdown(text: string): string {
  if (!text) return '';
  try {
    return sanitizeAIHtml(markdownFormatter.format(text));
  } catch {
    return sanitizeAIHtml(text);
  }
}

/**
 * Read the ordered content blocks (`data.elements`) from an AIAssistantMessage.
 * Returns an empty array when the field is absent (older messages), in which case
 * the bubble falls back to the flat getText() rendering path.
 */
function extractElements(message: CometChat.BaseMessage): CometChat.AIAssistantElement[] {
  try {
    const withElements = message as unknown as {
      getElements?: () => CometChat.AIAssistantElement[];
    };
    return withElements.getElements?.() ?? [];
  } catch {
    return [];
  }
}

/**
 * Extract text content from an AI assistant message.
 * AIAssistantMessage has getAssistantMessageData().getText().
 * Falls back to getText() for TextMessage, then data.text/content.
 */
function extractAssistantText(message: CometChat.BaseMessage): string {
  try {
    // AIAssistantMessage: getAssistantMessageData().getText()
    const msgWithData = message as unknown as {
      getAssistantMessageData?: () => { getText?: () => string };
    };
    const assistantText = msgWithData.getAssistantMessageData?.()?.getText?.();
    if (assistantText) return assistantText;

    // TextMessage fallback
    if (
      'getText' in message &&
      typeof (message as { getText: () => string }).getText === 'function'
    ) {
      const text = (message as { getText: () => string }).getText();
      if (text) return text;
    }

    // CustomMessage / agentic message may store content in data
    const data = (message as unknown as { data?: { text?: string; content?: string } }).data;
    if (data?.text) return data.text;
    if (data?.content) return data.content;
  } catch {
    // fall through
  }
  return '';
}

export const CometChatAIAssistantBubble: React.FC<CometChatAIAssistantBubbleProps> = ({
  message,
  alignment = 'left',
  className,
}) => {
  const text = useMemo(() => extractAssistantText(message), [message]);
  const elements = useMemo(() => extractElements(message), [message]);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const publish = usePublishEvent();
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);
  const { getLocalizedString } = useLocale();

  // Render markdown to HTML and sanitize
  const renderedHtml = useMemo(() => {
    if (!text) return '';
    try {
      const html = markdownFormatter.format(text);
      return sanitizeAIHtml(html);
    } catch {
      return sanitizeAIHtml(text);
    }
  }, [text]);

  const handleCopy = useCallback(() => {
    if (!text) return;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
    } else {
      // Fallback for older browsers
      const textarea = getCurrentDocument().createElement('textarea');
      textarea.value = text;
      getCurrentDocument().body.appendChild(textarea);
      textarea.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      getCurrentDocument().execCommand('copy');
      getCurrentDocument().body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [text, getCurrentDocument]);

  // Forward a nested agent-card action to the app via the event bus only — the
  // template-built card has no app-supplied prop to call.
  const handleCardAction = useCallback(
    (event: CometChatCardActionEvent) => {
      publish({ type: 'ui:card/action', message, action: event.action });
    },
    [message, publish]
  );

  // Render a single content block (`data.elements` entry) by its type.
  const renderElement = useCallback(
    (element: CometChat.AIAssistantElement, index: number): React.ReactNode => {
      const type = element.getType();
      const data = element.getData() as unknown;

      if (type === 'text') {
        const blockText = typeof data === 'string' ? data : '';
        if (!blockText) return null;
        return (
          <div
            key={`text-${String(index)}`}
            className={'cometchat-ai-assistant-bubble__content'}
            dangerouslySetInnerHTML={{ __html: renderAssistantMarkdown(blockText) }}
          />
        );
      }

      if (type === 'card') {
        const cardData = data as { card?: unknown; cardId?: string } | undefined;
        const card = cardData?.card;
        if (card != null) {
          return (
            <div
              key={`card-${cardData?.cardId ?? String(index)}`}
              className="cometchat-card-bubble"
            >
              <CometChatCardView
                cardJson={JSON.stringify(card)}
                themeMode={theme}
                onAction={handleCardAction}
              />
            </div>
          );
        }
        // Empty/invalid card → skip the block (renderer not invoked with empty schema).
        return null;
      }

      // Unknown block types are left to future renderers; skip for now.
      return null;
    },
    [theme, handleCardAction]
  );

  const rootClasses = ['cometchat-ai-assistant-bubble', className].filter(Boolean).join(' ');

  // Nothing to render — no content blocks and no flat text.
  if (elements.length === 0 && !text) return null;

  const showCopyButton =
    message.getReceiverType() !== CometChatUIKitConstants.MessageReceiverType.group;

  // Element-walk path: when the message carries ordered content blocks, render them
  // in array order (text + card interleaved) inside the one existing bubble.
  if (elements.length > 0) {
    return (
      <div className={rootClasses} data-alignment={alignment}>
        {elements.map((element, index) => renderElement(element, index))}
        {showCopyButton && text && (
          <button
            className={'cometchat-ai-assistant-bubble__copy'}
            title={copied ? getLocalizedString('ai_copied') : getLocalizedString('ai_copy')}
            aria-label={
              copied
                ? getLocalizedString('ai_copied')
                : getLocalizedString('accessibility_copy_message')
            }
            onClick={handleCopy}
            type="button"
          >
            <img
              src={copyIcon}
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
              draggable={false}
              style={{ opacity: copied ? 1 : 0.6 }}
            />
            {copied && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--cometchat-text-color-secondary)',
                  marginLeft: 4,
                }}
              >
                {getLocalizedString('ai_copied')}
              </span>
            )}
          </button>
        )}
      </div>
    );
  }

  // Flat path: no elements → existing getText() rendering (text guaranteed above).
  return (
    <div className={rootClasses} data-alignment={alignment}>
      <div
        className={'cometchat-ai-assistant-bubble__content'}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      {showCopyButton && (
        <button
          className={'cometchat-ai-assistant-bubble__copy'}
          title={copied ? getLocalizedString('ai_copied') : getLocalizedString('ai_copy')}
          aria-label={
            copied
              ? getLocalizedString('ai_copied')
              : getLocalizedString('accessibility_copy_message')
          }
          onClick={handleCopy}
          type="button"
        >
          <img
            src={copyIcon}
            alt=""
            width={20}
            height={20}
            aria-hidden="true"
            draggable={false}
            style={{ opacity: copied ? 1 : 0.6 }}
          />
          {copied && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--cometchat-text-color-secondary)',
                marginLeft: 4,
              }}
            >
              {getLocalizedString('ai_copied')}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

CometChatAIAssistantBubble.displayName = 'CometChatAIAssistantBubble';

export default CometChatAIAssistantBubble;
