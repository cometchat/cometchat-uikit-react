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
 * Mirrors Angular's CometChatAIAssistantMessageBubble which uses
 * CometChatMarkdownRenderer with `streaming: false`.
 *
 * Performance: uses content-visibility: auto (via CSS) to defer rendering
 * until the bubble is in the viewport.
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatAIAssistantBubbleProps } from './ai.types';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { sanitizeAIHtml } from './CometChatAISanitize';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatAIAssistantBubble.css';
import copyIcon from '../../assets/Copy.svg';

// Singleton markdown formatter — no need to recreate per render
const markdownFormatter = new CometChatMarkdownFormatter();

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
  const [copied, setCopied] = useState(false);
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
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [text]);

  const rootClasses = ['cometchat-ai-assistant-bubble', className].filter(Boolean).join(' ');

  if (!text) return null;

  return (
    <div className={rootClasses} data-alignment={alignment}>
      <div
        className={'cometchat-ai-assistant-bubble__content'}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
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
    </div>
  );
};

CometChatAIAssistantBubble.displayName = 'CometChatAIAssistantBubble';

export default CometChatAIAssistantBubble;
