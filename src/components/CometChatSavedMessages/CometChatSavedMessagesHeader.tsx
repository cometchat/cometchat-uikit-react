import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatSavedMessagesContext } from './CometChatSavedMessages.context';
import type { CometChatSavedMessagesSlotProps } from './CometChatSavedMessages.types';

/**
 * CometChatSavedMessages.Header — the panel title row + close button.
 * Pass `children` to replace it entirely.
 */
export const CometChatSavedMessagesHeader: React.FC<CometChatSavedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { hideCloseButton, onClose } = useCometChatSavedMessagesContext();

  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-saved-messages__header'}>
      <span className={'cometchat-saved-messages__header-title'}>
        {loc('selector_option_saved_messages', 'Saved Messages')}
      </span>
      {!hideCloseButton && (
        <button
          type="button"
          className={'cometchat-saved-messages__header-close'}
          onClick={onClose}
          aria-label={loc('close', 'Close')}
        >
          <span className={'cometchat-saved-messages__header-close-icon'} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

CometChatSavedMessagesHeader.displayName = 'CometChatSavedMessages.Header';
