import React from 'react';
import type { CometChatMessageInformationReceiptListProps } from './CometChatMessageInformation.types';
import { useCometChatMessageInformationContext } from './CometChatMessageInformation.context';
import { CometChatMessageInformationLoadingState } from './CometChatMessageInformationLoadingState';
import { CometChatMessageInformationErrorState } from './CometChatMessageInformationErrorState';
import { CometChatMessageInformationEmptyState } from './CometChatMessageInformationEmptyState';
import { CometChatAvatar } from '../base/CometChatAvatar';
import { CometChatDate } from '../base/CometChatDate';
import { useLocale } from '../../context/locale/LocaleContext';
import './CometChatMessageInformation.css';

/**
 * CometChatMessageInformation.ReceiptList — receipt display area.
 *
 * For group messages: renders a scrollable list of users with avatars,
 * names, and read/delivered timestamps.
 * For 1-on-1 messages: renders Read and Delivered sections with timestamps.
 */
export const CometChatMessageInformationReceiptList: React.FC<
  CometChatMessageInformationReceiptListProps
> = ({ className }) => {
  const {
    fetchState,
    userReceipts,
    oneOnOneReadAt,
    oneOnOneDeliveredAt,
    isGroupMessage,
    showScrollbar,
    messageInfoDateTimeFormat,
  } = useCometChatMessageInformationContext();
  const { getLocalizedString } = useLocale();

  const contentClass = [
    'cometchat-message-information__content',
    !showScrollbar ? 'cometchat-message-information__content--hide-scrollbar' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // Loading state (initial)
  if (
    fetchState === 'loading' &&
    userReceipts.length === 0 &&
    !oneOnOneReadAt &&
    !oneOnOneDeliveredAt
  ) {
    return (
      <div className={contentClass}>
        <CometChatMessageInformationLoadingState />
      </div>
    );
  }

  // Error state
  if (
    fetchState === 'error' &&
    userReceipts.length === 0 &&
    !oneOnOneReadAt &&
    !oneOnOneDeliveredAt
  ) {
    return (
      <div className={contentClass}>
        <CometChatMessageInformationErrorState />
      </div>
    );
  }

  return (
    <div className={contentClass}>
      {/* Group message receipts */}
      {isGroupMessage && fetchState !== 'loading' && (
        <>
          {userReceipts.length > 0 ? (
            <ul
              className={'cometchat-message-information__user-list'}
              role="list"
              aria-label={getLocalizedString('message_information_title')}
            >
              {userReceipts.map(receipt => (
                <li
                  key={receipt.user.getUid()}
                  className={'cometchat-message-information__user-item'}
                  role="listitem"
                >
                  <div
                    className={'cometchat-message-information__user-item-avatar'}
                    aria-hidden="true"
                  >
                    <CometChatAvatar
                      image={receipt.user.getAvatar()}
                      name={receipt.user.getName()}
                      size="large"
                    />
                  </div>
                  <div className={'cometchat-message-information__user-item-content'}>
                    <span className={'cometchat-message-information__user-item-name'}>
                      {receipt.user.getName()}
                    </span>
                    {receipt.readAt > 0 && (
                      <div className={'cometchat-message-information__user-item-receipt-row'}>
                        <span className={'cometchat-message-information__user-item-receipt-label'}>
                          {getLocalizedString('message_information_read')}
                        </span>
                        <span className={'cometchat-message-information__user-item-receipt-time'}>
                          <CometChatDate
                            timestamp={receipt.readAt}
                            formatConfig={messageInfoDateTimeFormat}
                          />
                        </span>
                      </div>
                    )}
                    {receipt.deliveredAt > 0 && (
                      <div className={'cometchat-message-information__user-item-receipt-row'}>
                        <span className={'cometchat-message-information__user-item-receipt-label'}>
                          {getLocalizedString('message_information_delivered')}
                        </span>
                        <span className={'cometchat-message-information__user-item-receipt-time'}>
                          <CometChatDate
                            timestamp={receipt.deliveredAt}
                            formatConfig={messageInfoDateTimeFormat}
                          />
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            fetchState !== 'error' && <CometChatMessageInformationEmptyState />
          )}
        </>
      )}

      {/* 1-on-1 message receipts */}
      {!isGroupMessage && fetchState !== 'loading' && (
        <>
          {/* Read section */}
          <div className={'cometchat-message-information__section'}>
            <h3 className={'cometchat-message-information__section-title'}>
              {getLocalizedString('message_information_read')}
            </h3>
            {oneOnOneReadAt > 0 ? (
              <div className={'cometchat-message-information__section-time'}>
                <CometChatDate
                  timestamp={oneOnOneReadAt}
                  formatConfig={messageInfoDateTimeFormat}
                />
              </div>
            ) : (
              <span
                className={'cometchat-message-information__section-empty-dash'}
                aria-label={getLocalizedString('message_information_not_read')}
              >
                —
              </span>
            )}
          </div>

          {/* Delivered section */}
          <div className={'cometchat-message-information__section'}>
            <h3 className={'cometchat-message-information__section-title'}>
              {getLocalizedString('message_information_delivered')}
            </h3>
            {oneOnOneDeliveredAt > 0 ? (
              <div className={'cometchat-message-information__section-time'}>
                <CometChatDate
                  timestamp={oneOnOneDeliveredAt}
                  formatConfig={messageInfoDateTimeFormat}
                />
              </div>
            ) : (
              <span
                className={'cometchat-message-information__section-empty-dash'}
                aria-label={getLocalizedString('message_information_not_delivered')}
              >
                —
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
