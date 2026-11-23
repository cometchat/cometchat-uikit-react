import React from 'react';
import type { CometChatReactionListErrorStateProps } from './CometChatReactionList.types';
import { useCometChatReactionListContext } from './CometChatReactionList.context';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatReactionList.css';

/**
 * CometChatReactionList.ErrorState — error state with retry button.
 *
 * Reads fetchState from context and renders only when fetchState === 'error'.
 * Offline with nothing saved it reads "Connect to load reactions", with no retry button.
 */
export const CometChatReactionListErrorState: React.FC<CometChatReactionListErrorStateProps> = ({
  className,
}) => {
  const { fetchState, retry, connectToLoad } = useCometChatReactionListContext();
  const { getLocalizedString } = useLocale();

  if (fetchState !== 'error') return null;

  const rootClass = ['cometchat-reaction-list__error', className ?? ''].filter(Boolean).join(' ');

  if (connectToLoad) {
    return (
      <div className={rootClass} role="status">
        <p className={'cometchat-reaction-list__error-text'}>
          {getLocalizedString('reaction_list_connect_to_load')}
        </p>
      </div>
    );
  }

  const errorText = getLocalizedString('reaction_list_error') || 'Something went wrong';
  const retryText = getLocalizedString('reaction_list_retry') || 'Retry';

  return (
    <div className={rootClass} role="alert">
      <p className={'cometchat-reaction-list__error-text'}>{errorText}</p>
      <button type="button" className={'cometchat-reaction-list__retry-button'} onClick={retry}>
        {retryText}
      </button>
    </div>
  );
};
