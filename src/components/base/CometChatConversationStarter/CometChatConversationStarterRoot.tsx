import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatConversationStarterRootProps,
  CometChatConversationStarterContextValue,
  CometChatConversationStarterState,
} from './CometChatConversationStarter.types';
import { CometChatConversationStarterContext } from './CometChatConversationStarter.context';
import { CometChatConversationStarterItem } from './CometChatConversationStarterItem';
import './CometChatConversationStarter.css';
import { useLocale } from '../../../context/locale/LocaleContext';

/**
 * Root container for conversation starters.
 * Manages data fetching, state machine, context, and keyboard navigation.
 */
export const CometChatConversationStarterRoot: React.FC<CometChatConversationStarterRootProps> = ({
  getConversationStarters,
  onSuggestionClick,
  className,
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const [state, setState] = useState<CometChatConversationStarterState>('loading');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  const fetchStarters = useCallback(() => {
    const id = ++fetchIdRef.current;
    setState('loading');
    setSuggestions([]);
    setError(null);

    getConversationStarters()
      .then(result => {
        if (id !== fetchIdRef.current) return;
        if (result.length === 0) {
          setState('empty');
        } else {
          setSuggestions(result);
          setState('loaded');
        }
      })
      .catch((err: unknown) => {
        if (id !== fetchIdRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setState('error');
      });
  }, [getConversationStarters]);

  useEffect(() => {
    fetchStarters();
  }, [fetchStarters]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;

    if (
      e.key === 'ArrowRight' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowUp' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      const buttons = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled)'));
      if (buttons.length === 0) return;

      const currentIndex = buttons.indexOf(document.activeElement as HTMLElement);
      let nextIndex: number;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else {
        nextIndex = buttons.length - 1;
      }

      e.preventDefault();
      buttons[nextIndex]?.focus();
    }
  }, []);

  const ctxValue = useMemo<CometChatConversationStarterContextValue>(
    () => ({ state, suggestions, error, onSuggestionClick, retry: fetchStarters }),
    [state, suggestions, error, onSuggestionClick, fetchStarters]
  );

  const rootBase = 'cometchat-conversation-starter';
  const rootClass = className ? `${rootBase} ${className}` : rootBase;

  const hasCustomChildren = React.Children.count(children) > 0;

  return (
    <CometChatConversationStarterContext.Provider value={ctxValue}>
      <div
        ref={rootRef}
        className={rootClass}
        role="group"
        aria-label={getLocalizedString('ai_conversation_starter_title')}
        aria-live="polite"
        aria-busy={state === 'loading'}
        onKeyDown={handleKeyDown}
      >
        {hasCustomChildren && children}
        {state === 'loaded' &&
          suggestions.map(s => (
            <CometChatConversationStarterItem key={s} suggestion={s} onClick={onSuggestionClick} />
          ))}
      </div>
    </CometChatConversationStarterContext.Provider>
  );
};
