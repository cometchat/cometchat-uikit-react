import React from 'react';
import { useLocale } from '../../context/locale/LocaleContext';
import { localizeWithFallback } from '../../utils/localizeWithFallback';
import { useCometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesSlotProps } from './CometChatPinnedMessages.types';

/**
 * CometChatPinnedMessages.Header — the panel title row + close button.
 * Pass `children` to replace it entirely.
 */
export const CometChatPinnedMessagesHeader: React.FC<CometChatPinnedMessagesSlotProps> = ({
  children,
}) => {
  const { getLocalizedString } = useLocale();
  const loc = (key: string, fallback: string): string =>
    localizeWithFallback(getLocalizedString, key, fallback);
  const { hideCloseButton, onClose } = useCometChatPinnedMessagesContext();

  if (children !== undefined) return <>{children}</>;

  return (
    <div className={'cometchat-pinned-messages__header'}>
      <span className={'cometchat-pinned-messages__header-title'}>
        {loc('message_header_option_pinned_messages', 'Pinned Messages')}
      </span>
      {!hideCloseButton && (
        <button
          type="button"
          className={'cometchat-pinned-messages__header-close'}
          onClick={onClose}
          aria-label={loc('close', 'Close')}
        >
          <span className={'cometchat-pinned-messages__header-close-icon'} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

CometChatPinnedMessagesHeader.displayName = 'CometChatPinnedMessages.Header';
