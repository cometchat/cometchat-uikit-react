import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatConversationSummaryRootProps,
  CometChatConversationSummaryContextValue,
  CometChatConversationSummaryState,
} from './CometChatConversationSummary.types';
import { CometChatConversationSummaryContext } from './CometChatConversationSummary.context';
import './CometChatConversationSummary.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Root container for conversation summary.
 * Manages data fetching, state machine, context, and Escape key handler.
 */
export const CometChatConversationSummaryRoot: React.FC<CometChatConversationSummaryRootProps> = ({
  getConversationSummary,
  onClose,
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const [state, setState] = useState<CometChatConversationSummaryState>('loading');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  const fetchSummary = useCallback(() => {
    const id = ++fetchIdRef.current;
    setState('loading');
    setSummary('');
    setError(null);

    getConversationSummary()
      .then(result => {
        if (id !== fetchIdRef.current) return;
        if (!result || result.trim().length === 0) {
          setState('empty');
        } else {
          setSummary(result);
          setState('loaded');
        }
      })
      .catch((err: unknown) => {
        if (id !== fetchIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setState('error');
      });
  }, [getConversationSummary]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    },
    [onClose]
  );

  const ctxValue = useMemo<CometChatConversationSummaryContextValue>(
    () => ({ state, summary, error, onClose, retry: fetchSummary }),
    [state, summary, error, onClose, fetchSummary]
  );

  const rootBase = 'cometchat-conversation-summary';
  const rootClass = className ? `${rootBase} ${className}` : rootBase;

  return (
    <CometChatConversationSummaryContext.Provider value={ctxValue}>
      <div
        ref={rootRef}
        className={rootClass}
        role="region"
        aria-label={getLocalizedString('ai_conversation_summary_title')}
        aria-live="polite"
        aria-busy={state === 'loading'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </CometChatConversationSummaryContext.Provider>
  );
};
