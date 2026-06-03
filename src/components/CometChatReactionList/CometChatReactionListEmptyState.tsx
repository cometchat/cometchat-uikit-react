import React from 'react';
import type { CometChatReactionListEmptyStateProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactionList.css';

/**
 * CometChatReactionList.EmptyState — empty state when no reactions exist.
 *
 * Reads fetchState from context and renders only when fetchState === 'empty'.
 */
export const CometChatReactionListEmptyState: React.FC<CometChatReactionListEmptyStateProps> = ({
  className,
}) => {
  const { fetchState } = useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();

  if (fetchState !== 'empty') return null;

  const emptyText = getLocalizedString('reaction_list_empty') || 'No reactions yet';

  const rootClass = ['cometchat-reaction-list__empty', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <p className={'cometchat-reaction-list__empty-text'}>{emptyText}</p>
    </div>
  );
};
