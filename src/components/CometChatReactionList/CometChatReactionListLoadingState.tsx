import React from 'react';
import type { CometChatReactionListLoadingStateProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import './CometChatReactionList.css';
import { useLocale } from '../../context/locale/LocaleContext';

const SHIMMER_ITEM_COUNT = 4;

/**
 * CometChatReactionList.LoadingState — shimmer loading placeholder.
 *
 * Renders animated shimmer rows while reactions are being fetched.
 * Reads fetchState from context and renders only when fetchState === 'loading'.
 * Respects `prefers-reduced-motion` via CSS.
 */
export const CometChatReactionListLoadingState: React.FC<
  CometChatReactionListLoadingStateProps
> = ({ className }) => {
  const { getLocalizedString } = useLocale();
  const { fetchState } = useCometChatReactionListContext();

  if (fetchState !== 'loading') return null;

  const rootClass = ['cometchat-reaction-list__shimmer', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={rootClass}
      aria-busy="true"
      aria-label={getLocalizedString('accessibility_loading_reactions')}
    >
      {Array.from({ length: SHIMMER_ITEM_COUNT }).map((_, i) => (
        <div key={i} className={'cometchat-reaction-list__shimmer-item'}>
          <div className={'cometchat-reaction-list__shimmer-item-icon'} />
          <div className={'cometchat-reaction-list__shimmer-item-content'} />
          <div className={'cometchat-reaction-list__shimmer-item-tailview'} />
        </div>
      ))}
    </div>
  );
};
