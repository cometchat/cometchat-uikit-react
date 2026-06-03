import React, { useCallback } from 'react';
import type { CometChatReactionsChipProps } from './CometChatReactions.types';
import { useCometChatReactionsContext } from './CometChatReactions.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactions.css';

/**
 * CometChatReactionsChip — a single reaction chip button.
 *
 * Displays the emoji and count. Highlights when the logged-in user has reacted.
 * Fires onReactionClick on click/Enter/Space.
 */
export const CometChatReactionsChip = React.memo<CometChatReactionsChipProps>(
  function CometChatReactionsChip({ reaction, className }) {
    const { onReactionClick } = useCometChatReactionsContext();
    const { getLocalizedString } = useLocale();
    const emoji = reaction.getReaction();
    const count = reaction.getCount();
    const reactedByMe = reaction.getReactedByMe();

    const handleClick = useCallback(() => {
      onReactionClick(emoji);
    }, [emoji, onReactionClick]);

    const chipClass = [
      'cometchat-reactions__chip',
      reactedByMe ? 'cometchat-reactions__chip--active' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        type="button"
        className={chipClass}
        onClick={handleClick}
        aria-label={getLocalizedString('accessibility_reacted_by')
          .replace('{emoji}', emoji)
          .replace('{count}', String(count))}
        aria-pressed={reactedByMe}
      >
        <span className={'cometchat-reactions__chip-emoji'}>{emoji}</span>
        <span className={'cometchat-reactions__chip-count'}>{count}</span>
      </button>
    );
  },
  (prev, next) =>
    prev.reaction.getReaction() === next.reaction.getReaction() &&
    prev.reaction.getCount() === next.reaction.getCount() &&
    prev.reaction.getReactedByMe() === next.reaction.getReactedByMe() &&
    prev.className === next.className
);
