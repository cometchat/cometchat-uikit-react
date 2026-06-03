import React from 'react';
import type { CometChatReactionListErrorStateProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactionList.css';

/**
 * CometChatReactionList.ErrorState — error state with retry button.
 *
 * Reads fetchState from context and renders only when fetchState === 'error'.
 */
export const CometChatReactionListErrorState: React.FC<CometChatReactionListErrorStateProps> = ({
  className,
}) => {
  const { fetchState, retry } = useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();

  if (fetchState !== 'error') return null;

  const errorText = getLocalizedString('reaction_list_error') || 'Something went wrong';
  const retryText = getLocalizedString('reaction_list_retry') || 'Retry';

  const rootClass = ['cometchat-reaction-list__error', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass} role="alert">
      <p className={'cometchat-reaction-list__error-text'}>{errorText}</p>
      <button type="button" className={'cometchat-reaction-list__retry-button'} onClick={retry}>
        {retryText}
      </button>
    </div>
  );
};
