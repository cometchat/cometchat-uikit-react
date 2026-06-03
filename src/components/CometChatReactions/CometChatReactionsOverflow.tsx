import React from 'react';
import type { CometChatReactionsOverflowProps } from './CometChatReactions.types';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactions.css';

/**
 * CometChatReactionsOverflow — "+N more" button for overflow reactions.
 *
 * Rendered when the number of reactions exceeds maxVisible.
 * Opens the ReactionList popover when clicked.
 */
export const CometChatReactionsOverflow: React.FC<CometChatReactionsOverflowProps> = ({
  count,
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const overflowClass = ['cometchat-reactions__overflow', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={overflowClass}
      aria-label={getLocalizedString('accessibility_more_reactions').replace(
        '{count}',
        String(count)
      )}
    >
      <span className={'cometchat-reactions__overflow-count'}>+{count}</span>
    </button>
  );
};
