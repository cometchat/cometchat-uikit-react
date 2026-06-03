import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatSmartRepliesRootProps,
  CometChatSmartRepliesContextValue,
  CometChatSmartRepliesState,
} from './CometChatSmartReplies.types';
import { CometChatSmartRepliesContext } from './CometChatSmartReplies.context';
import { CometChatSmartRepliesHeader } from './CometChatSmartRepliesHeader';
import { CometChatSmartRepliesItem } from './CometChatSmartRepliesItem';
import { CometChatSmartRepliesLoading } from './CometChatSmartRepliesLoading';
import { CometChatSmartRepliesError } from './CometChatSmartRepliesError';
import { CometChatSmartRepliesEmpty } from './CometChatSmartRepliesEmpty';
import './CometChatSmartReplies.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Root container for smart replies.
 * Manages data fetching, state machine, context, and Escape key handler.
 */
export const CometChatSmartRepliesRoot: React.FC<CometChatSmartRepliesRootProps> = ({
  getSmartReplies,
  onSuggestionClick,
  onClose,
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const [state, setState] = useState<CometChatSmartRepliesState>('loading');
  const [replies, setReplies] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const fetchIdRef = useRef(0);

  const fetchReplies = useCallback(() => {
    const id = ++fetchIdRef.current;
    setState('loading');
    setReplies([]);
    setError(null);

    getSmartReplies()
      .then(result => {
        if (id !== fetchIdRef.current) return;
        if (result.length === 0) {
          setState('empty');
        } else {
          setReplies(result);
          setState('loaded');
        }
      })
      .catch((err: unknown) => {
        if (id !== fetchIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setState('error');
      });
  }, [getSmartReplies]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    },
    [onClose]
  );

  const ctxValue = useMemo<CometChatSmartRepliesContextValue>(
    () => ({ state, replies, error, onSuggestionClick, onClose, retry: fetchReplies }),
    [state, replies, error, onSuggestionClick, onClose, fetchReplies]
  );

  const rootBase = 'cometchat-smart-replies';
  const rootClass = className ? `${rootBase} ${className}` : rootBase;

  const hasChildren = React.Children.count(children) > 0;

  return (
    <CometChatSmartRepliesContext.Provider value={ctxValue}>
      <div
        className={rootClass}
        role="region"
        aria-label={getLocalizedString('ai_smart_replies_title')}
        aria-live="polite"
        aria-busy={state === 'loading'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {hasChildren ? (
          <>
            {children}
            {state === 'loaded' && (
              <div className={'cometchat-smart-replies__items-container'}>
                {replies.map((reply, index) => (
                  <CometChatSmartRepliesItem key={index} reply={reply} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <CometChatSmartRepliesHeader />
            <CometChatSmartRepliesLoading />
            <CometChatSmartRepliesError />
            <CometChatSmartRepliesEmpty />
            {state === 'loaded' && (
              <div className={'cometchat-smart-replies__items-container'}>
                {replies.map((reply, index) => (
                  <CometChatSmartRepliesItem key={index} reply={reply} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CometChatSmartRepliesContext.Provider>
  );
};
