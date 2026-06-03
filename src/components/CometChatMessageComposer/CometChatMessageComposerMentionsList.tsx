/**
 * CometChatMessageComposerMentionsList — dropdown for mention suggestions.
 *
 * Renders inside the text-input-wrapper, positioned absolutely above the input.
 * Shows user/group member suggestions when @ is typed.
 * Supports keyboard navigation and @all mention.
 *
 *  only shows when there are actual results,
 * uses mousedown (not click) to prevent input blur, and mouseenter for hover focus.
 */

import React, { useEffect, useRef } from 'react';
import type { MentionSuggestion } from './useCometChatMentions';
import './CometChatMessageComposer.css';
import { useLocale } from '../../context/locale/LocaleContext';

export interface CometChatMessageComposerMentionsListProps {
  suggestions: MentionSuggestion[];
  focusedIndex: number;
  isLoading: boolean;
  onSelect: (suggestion: MentionSuggestion) => void;
  onFocusChange?: (index: number) => void;
}

export const CometChatMessageComposerMentionsList: React.FC<
  CometChatMessageComposerMentionsListProps
> = ({ suggestions, focusedIndex, isLoading, onSelect, onFocusChange }) => {
  const { getLocalizedString } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll focused item into view
  useEffect(() => {
    const item = itemRefs.current[focusedIndex];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  // Angular: only show when there are suggestions (no "No results" state)
  if (suggestions.length === 0) {
    if (isLoading) {
      return (
        <div className={'cometchat-message-composer__mentions-list'}>
          <div className={'cometchat-message-composer__mentions-loading'}>
            <span className={'cometchat-message-composer__mentions-spinner'} aria-hidden="true" />
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={listRef}
      className={'cometchat-message-composer__mentions-list'}
      role="listbox"
      id="mention-suggestions-listbox"
      aria-label={getLocalizedString('accessibility_mention_suggestions')}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.uid}
          id={`mention-option-${String(index)}`}
          ref={el => {
            itemRefs.current[index] = el;
          }}
          className={[
            'cometchat-message-composer__mentions-item',
            index === focusedIndex ? 'cometchat-message-composer__mentions-item--focused' : '',
            suggestion.isAllMention ? 'cometchat-message-composer__mentions-item--all' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={-1}
          // mousedown prevents input blur (Angular pattern)
          onMouseDown={e => {
            e.preventDefault();
            onSelect(suggestion);
          }}
          onMouseEnter={() => onFocusChange?.(index)}
        >
          {/* Avatar */}
          {suggestion.isAllMention ? (
            <div className={'cometchat-message-composer__mentions-item-all-icon'}>@</div>
          ) : suggestion.avatar ? (
            <img
              src={suggestion.avatar}
              alt={suggestion.name}
              className={'cometchat-message-composer__mentions-item-avatar'}
              width={42}
              height={42}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className={'cometchat-message-composer__mentions-item-initials'}>
              {suggestion.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Name */}
          <span className={'cometchat-message-composer__mentions-item-name'}>
            {suggestion.isAllMention ? `@${suggestion.name}` : suggestion.name}
          </span>
          {/* Subtitle for @all */}
          {suggestion.isAllMention && (
            <span className={'cometchat-message-composer__mentions-item-badge'}>
              {getLocalizedString('message_composer_mention_notify_everyone_label')}
            </span>
          )}
        </div>
      ))}
      {/* Loading indicator for pagination */}
      {isLoading && suggestions.length > 0 && (
        <div className={'cometchat-message-composer__mentions-loading'}>
          <span className={'cometchat-message-composer__mentions-spinner'} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
