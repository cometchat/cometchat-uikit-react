/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * CometChatStreamMessageBubble
 *
 * Renders a live-streaming AI response with three states:
 * 1. Thinking — "Thinking..." text with shimmer animation (before first text chunk)
 * 2. Tool execution — tool name/execution text while a tool is running
 * 3. Streaming text — accumulated markdown content rendered progressively
 *
 * Architecture:
 * - Subscribes to CometChatAIStreamingService via useSyncExternalStore
 * - No Suspense — the bubble is always rendered (thinking state is the initial UI)
 * - Markdown rendered via CometChatMarkdownFormatter + DOMPurify sanitization
 * - Offline error detection via window online/offline events
 *
 */

import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { CometChatStreamMessageBubbleProps } from './ai.types';
import {
  getStreamState,
  subscribeToStreamState,
  setStreamError,
} from './CometChatAIStreamingService';
import { CometChatMarkdownFormatter } from '../../formatters/CometChatMarkdownFormatter';
import { sanitizeAIHtml } from './CometChatAISanitize';
import './CometChatStreamMessageBubble.css';
import { useLocale } from '../../context/locale/LocaleContext';
import copyIcon from '../../assets/Copy.svg';

// Singleton markdown formatter
const markdownFormatter = new CometChatMarkdownFormatter();

// Localized strings (fallback — real i18n wired via CometChatLocalize)
const THINKING_TEXT = 'Thinking...';

export const CometChatStreamMessageBubble: React.FC<CometChatStreamMessageBubbleProps> = ({
  chatId,
  alignment = 'left',
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const NO_INTERNET_TEXT = getLocalizedString('ai_assistant_chat_no_internet');
  // Subscribe to stream state via useSyncExternalStore for tear-free reads
  const subscribe = useCallback(
    (listener: () => void) => subscribeToStreamState(chatId, listener),
    [chatId]
  );
  const getSnapshot = useCallback(() => getStreamState(chatId), [chatId]);

  const streamState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [copied, setCopied] = useState(false);

  // When streaming completes (or a new stream starts for a different message),
  // the bubble "snapshots" its text and stops reading from the global stream state.
  // This allows multiple completed streaming bubbles to coexist with different content.
  const [snapshotText, setSnapshotText] = useState<string | null>(null);
  const wasActiveRef = React.useRef(false);

  useEffect(() => {
    const isActive = streamState.hasStarted && !streamState.isComplete;

    if (isActive && streamState.hasContent) {
      // Stream is active and producing content — this bubble is the live one
      wasActiveRef.current = true;
    }

    // When streaming transitions from active→inactive and this bubble was active,
    // snapshot the text so it persists even after the global state is reset/reused.
    if (wasActiveRef.current && !isActive && streamState.text) {
      setSnapshotText(streamState.text);
    }

    // If a new stream starts (hasStarted becomes true again after we snapshotted),
    // that means a new message triggered a new stream. Keep our snapshot.
    if (snapshotText !== null && isActive) {
      // New stream started — we already have our snapshot, do nothing
    }
  }, [streamState, snapshotText]);

  // Determine which text to display:
  // - If we have a snapshot, always use it (this bubble is done)
  // - Otherwise use the live stream state text
  const displayText = snapshotText ?? streamState.text;
  const isThinking = snapshotText === null && streamState.isThinking && !streamState.hasContent;
  const hasContent = snapshotText !== null || streamState.hasContent;
  const activeToolCall = snapshotText === null ? streamState.activeToolCall : null;
  const toolExecutionText = snapshotText === null ? streamState.toolExecutionText : '';
  const hasError = snapshotText === null && streamState.hasError;

  // Detect offline errors
  useEffect(() => {
    const handleOffline = () => {
      setStreamError(chatId);
    };
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [chatId]);

  // Render markdown to HTML
  const renderedHtml = useMemo(() => {
    if (!displayText) return '';
    try {
      const html = markdownFormatter.format(displayText);
      return sanitizeAIHtml(html);
    } catch {
      return sanitizeAIHtml(displayText);
    }
  }, [displayText]);

  const handleCopy = useCallback(() => {
    if (!displayText) return;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(displayText).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = displayText;
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
  }, [displayText]);

  const rootClasses = ['cometchat-stream-message-bubble', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses} aria-live="polite" aria-atomic="true" data-alignment={alignment}>
      {hasError ? (
        <span className={'cometchat-stream-message-bubble__error'}>{NO_INTERNET_TEXT}</span>
      ) : (
        <>
          {/* Thinking state — shown before first text chunk */}
          {isThinking && (
            <span className={'cometchat-stream-message-bubble__thinking'}>{THINKING_TEXT}</span>
          )}

          {/* Tool execution state */}
          {activeToolCall && (
            <span className={'cometchat-stream-message-bubble__tool-execution'}>
              {toolExecutionText || `Executing ${activeToolCall}...`}
            </span>
          )}

          {/* Streamed markdown content */}
          {hasContent && (
            <div
              className={'cometchat-stream-message-bubble__content'}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}

          {/* Copy button — shown when content is available */}
          {hasContent && (
            <button
              className={'cometchat-stream-message-bubble__copy'}
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
            </button>
          )}
        </>
      )}
    </div>
  );
};

CometChatStreamMessageBubble.displayName = 'CometChatStreamMessageBubble';

export default CometChatStreamMessageBubble;
