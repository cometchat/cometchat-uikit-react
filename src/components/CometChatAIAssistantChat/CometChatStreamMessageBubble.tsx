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
import { useCometChatFrameContext } from '../../context/CometChatFrameContext';
import './CometChatStreamMessageBubble.css';
import { useLocale } from '../../context/locale/LocaleContext';
import copyIcon from '../../assets/Copy.svg';

// Singleton markdown formatter
const markdownFormatter = new CometChatMarkdownFormatter();

// Localized strings (fallback — real translations wired via CometChatLocalize)
const THINKING_TEXT = 'Thinking...';

export const CometChatStreamMessageBubble: React.FC<CometChatStreamMessageBubbleProps> = ({
  chatId,
  runId,
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
  const IframeContext = useCometChatFrameContext();

  const getCurrentDocument = useCallback(() => {
    return IframeContext.iframeDocument ?? document;
  }, [IframeContext.iframeDocument]);

  const getCurrentWindow = useCallback(() => {
    return IframeContext.iframeWindow ?? window;
  }, [IframeContext.iframeWindow]);

  const isOwner = runId ? streamState.currentRunId === runId : true;

  const [snapshotText, setSnapshotText] = useState<string | null>(null);
  const lastSeenTextRef = React.useRef('');

  useEffect(() => {
    if (snapshotText !== null) return;

    if (!isOwner) {
      if (lastSeenTextRef.current) {
        setSnapshotText(lastSeenTextRef.current);
      } else {
        setSnapshotText('');
      }
      return;
    }

    if (streamState.hasContent && streamState.text) {
      lastSeenTextRef.current = streamState.text;
    }

    if (streamState.isComplete && streamState.text) {
      setSnapshotText(streamState.text);
    }
  }, [streamState, snapshotText, isOwner]);

  // Determine which text to display:
  // - If we have a snapshot, always use it (this bubble is done)
  // - Otherwise use the live stream state text (only if we're the owner)
  const displayText = snapshotText ?? (isOwner ? streamState.text : '');
  const isThinking =
    snapshotText === null && isOwner && streamState.isThinking && !streamState.hasContent;
  const hasContent =
    snapshotText !== null ? snapshotText.length > 0 : isOwner && streamState.hasContent;
  const activeToolCall = snapshotText === null && isOwner ? streamState.activeToolCall : null;
  const toolExecutionText = snapshotText === null && isOwner ? streamState.toolExecutionText : '';
  const hasError = snapshotText === null && isOwner && streamState.hasError;

  // Detect offline errors
  useEffect(() => {
    const handleOffline = () => {
      setStreamError(chatId);
    };
    getCurrentWindow().addEventListener('offline', handleOffline);
    return () => {
      getCurrentWindow().removeEventListener('offline', handleOffline);
    };
  }, [chatId, getCurrentWindow]);

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
      const textarea = getCurrentDocument().createElement('textarea');
      textarea.value = displayText;
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
  }, [displayText, getCurrentDocument]);

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
