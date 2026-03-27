import React, { useCallback, useEffect, useRef, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import { CometChatList } from "../BaseComponents/CometChatList/CometChatList";
import { CometChatListItem } from "../BaseComponents/CometChatListItem/CometChatListItem";
import { CometChatUIKit } from "../../CometChatUIKit/CometChatUIKit";
import { MessageUtils } from "../../utils/MessageUtils";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { CometChatMessageTemplate } from "../../modals";
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import {CometChatLocalize, getLocalizedString} from "../../resources/CometChatLocalize/cometchat-localize";
import { MessageBubbleAlignment, States } from "../../Enums/Enums";
import closeIcon from "../../assets/close.svg";
import { CometChatDate } from "../BaseComponents/CometChatDate/CometChatDate";
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { CalendarObject } from "../../utils/CalendarObject";
import { CometChatTextFormatter } from "../../formatters";
import { JSX } from 'react';
interface MessageInformationProps {
  message: CometChat.BaseMessage;
  onClose?: () => void;
  /**
   * Callback triggered when an error occurs during the message receipt fetching process.
   * @param error - CometChatException object representing the error.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /**
  * Format for timestamps displayed in message details (e.g., delivery or read time).
  */
  messageInfoDateTimeFormat?: CalendarObject;
  /**
   * Format for the timestamp displayed next to messages.
   */
  messageSentAtDateTimeFormat?: CalendarObject;

  /**
   * Template for customizing the appearance of the message.
   */
  template?: CometChatMessageTemplate;
  /**
  * Hides the visibility of receipt in the Message Information.
  * @default false
  */
  hideReceipts?: boolean;
  /**
  * Array of text formatters for custom styling or formatting of message text bubbles.
  */
  textFormatters?: CometChatTextFormatter[];
    /**
   * Controls the visibility of the scrollbar in the list.
   * @defaultValue `false`
   */
    showScrollbar?: boolean;
}

const CometChatMessageInformation = (props: MessageInformationProps) => {
  const {
    onClose,
    message,
    messageSentAtDateTimeFormat,
    messageInfoDateTimeFormat,
    onError = (error: CometChat.CometChatException) => {
    },
    template,
    hideReceipts,
    textFormatters,
    showScrollbar = false,
  } = props;

  const [state, setState] = useState<States>(States.loading);
  const [messageReceipts, setMessageReceipts] = useState<
    CometChat.MessageReceipt[]
  >([]);
  const loggedInUser = useRef<CometChat.User | null>(null);
  const onErrorCallback = useCometChatErrorHandler(onError);

  /* The purpose of this function is to fetch the message information receipts data and update the states. */
  async function getMessageReceipt(message?: CometChat.BaseMessage) {
    try {
      if (
        message?.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.group
      ) {
        setState(States.loading);
        let messageReceiptVal: CometChat.MessageReceipt | any =
          await CometChat.getMessageReceipts(message?.getId());
        let receiptList = messageReceiptVal.filter((receipt: CometChat.MessageReceipt) =>
          receipt.getSender().getUid() !== loggedInUser.current?.getUid()) as CometChat.MessageReceipt[]
        setMessageReceipts(receiptList);
        setState(States.loaded);
        return messageReceiptVal;
      }
    } catch (error) {
      onErrorCallback(error, 'getMessageReceipt');
      setState(States.error);
    }
  }

  useEffect(() => {
    try {
      if (message?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user) {
        setState(States.loaded);
      }
      if (message?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group) {
        getMessageReceipt(message);
      }
    } catch (error) {
      onErrorCallback(error, 'useEffect');
    }
  }, [message]);

  /* This function returns close button view. */
  function getCloseBtnView() {
    try {
      return (
        <CometChatButton
          iconURL={closeIcon}
          hoverText={getLocalizedString("message_information_close_hover")}
          onClick={onClose}
        />
      );
    } catch (error) {
      onErrorCallback(error, 'getCloseBtnView');
    }
  }

  /* This function returns Message bubble view of which information is getting viewed. */
  const getBubbleView = useCallback(() => {
    try {
      let alignment = MessageBubbleAlignment.right;
      if (CometChatUIKitLoginListener.getLoggedInUser()) {
        loggedInUser.current = CometChatUIKitLoginListener.getLoggedInUser();
      }
      if (message) {
        const templatesArray = CometChatUIKit.getDataSource()?.getAllMessageTemplates();

        const bubbleTemplate = template ?? templatesArray?.find((t: CometChatMessageTemplate) => t.type === message.getType() && t.category === message.getCategory());
        if (!bubbleTemplate) {
          return <></>
        }
        if (message.getSender()?.getUid() !== loggedInUser.current?.getUid()) {
          alignment = MessageBubbleAlignment.left;
        } else {
          alignment = MessageBubbleAlignment.right;
        }
        const view = new MessageUtils().getMessageBubble(
          message,
          bubbleTemplate,
          alignment,
          messageSentAtDateTimeFormat,
          hideReceipts,
          textFormatters
        );
        return view;
      }
      return null;
    } catch (error) {
      onErrorCallback(error, 'getBubbleView');
    }
  }, [message]);
  /**
  * Function for timestamps displayed in message details (e.g., delivery or read time).
  * @returns CalendarObject
  */
    function getMessageInfoDateFormat() {
      const defaultFormat = {
        yesterday: `DD MMM, hh:mm A`,
        otherDays: `DD MMM, hh:mm A`,
        today: `DD MMM, hh:mm A`
      };
  
      const finalFormat = {
        ...defaultFormat,
        ...CometChatLocalize.calendarObject,
        ...messageInfoDateTimeFormat
      };
  
      return finalFormat;
    }

  /**
   * Creates subtitle receipt view for group.
   */
  function getSubtitleView(
    deliveredAt: number,
    readAt?: number
  ): JSX.Element | null {
    try {
      return (
        <div className="cometchat-message-information__receipts-subtitle">
          {readAt && <div className="cometchat-message-information__receipts-subtitle-text">
            {getLocalizedString("message_information_read")}
            <CometChatDate
              timestamp={readAt}
              calendarObject={getMessageInfoDateFormat()}

            />
          </div>}

         {deliveredAt &&  <div className="cometchat-message-information__receipts-subtitle-text">
            {getLocalizedString("message_information_delivered")}
            <CometChatDate
              timestamp={deliveredAt}
              calendarObject={getMessageInfoDateFormat()}
            />
          </div>}
        </div>
      )
    } catch (error) {
      onErrorCallback(error, 'getSubtitleView');
      return null;
    }
  }

  /**
   * Creates default list item view
   */
  function getListItem(messageReceipt: CometChat.MessageReceipt) {
    try {
      return (
        <CometChatListItem
          id={messageReceipt.getMessageId()}
          title={messageReceipt.getSender()?.getName()}
          avatarURL={messageReceipt.getSender()?.getAvatar()}
          avatarName={messageReceipt.getSender()?.getName()}
          subtitleView={getSubtitleView(
            messageReceipt.getDeliveredAt(),
            messageReceipt.getReadAt()
          )}
        />
      );
    } catch (error) {
      onErrorCallback(error, 'getListItem');
      return <></>;
    }
  }

  return (
    <div className={`cometchat cometchat-message-information ${!showScrollbar ? "cometchat-message-information-hide-scrollbar" : ""}`}>
      <div className="cometchat-message-information__header">
        <div className="cometchat-message-information__header-title">
          {getLocalizedString("message_information_title")}
        </div>
        <div className="cometchat-message-information__header-close">
          {getCloseBtnView()}
        </div>
      </div>
      <div className="cometchat-message-information__message">
        {getBubbleView()}
      </div>

      {message.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.user && (
          <React.Fragment>
            {state === States.loading ? (<div className="cometchat-message-information__shimmer">
              {[...Array(1)].map((_, index) => (
                <div key={index} className="cometchat-message-information__shimmer-item">
                  <div className="cometchat-message-information__shimmer-item-avatar"></div>
                  <div className="cometchat-message-information__shimmer-item-title"></div>
                </div>
              ))}
            </div>) :
              state === States.error ? (<div className="cometchat-message-information__error-state">
                <div>
                  {getLocalizedString("message_information_error")}
                </div>
              </div>) :
                <div className="cometchat-message-information__receipts">
                  <CometChatListItem
                    title={getLocalizedString("message_information_read")}
                    subtitleView={(
                      <div className="cometchat-message-information__receipts-subtite-text">
                        {message.getReadAt() ?
                          <CometChatDate
                            timestamp={message.getReadAt()}
                            calendarObject={getMessageInfoDateFormat()}
                          /> :
                          "----"
                        }
                      </div>
                    )}
                    avatarURL=""
                  />
                  <CometChatListItem
                    title={getLocalizedString("message_information_delivered")}
                    subtitleView={(
                      <div className="cometchat-message-information__receipts-subtite-text">
                        {message.getDeliveredAt() ?
                          <CometChatDate
                            timestamp={message.getDeliveredAt()}
                            calendarObject={getMessageInfoDateFormat()}
                          /> :
                          "----"
                        }
                      </div>
                    )}
                    avatarURL=""
                  />
                </div>
            }
          </React.Fragment>)
      }

      {message.getReceiverType() ===
        CometChatUIKitConstants.MessageReceiverType.group && (
          <React.Fragment>
            {state === States.loading ? (<div className="cometchat-message-information__shimmer">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="cometchat-message-information__shimmer-item">
                  <div className="cometchat-message-information__shimmer-item-avatar"></div>
                  <div className="cometchat-message-information__shimmer-item-title"></div>
                </div>
              ))}
            </div>) :
              state === States.error ? (<div className="cometchat-message-information__error-state">
                <div>
                  {getLocalizedString("message_information_error")}
                </div>
              </div>) :
                <div className="cometchat-message-information__receipts">
                  {messageReceipts.length > 0 && (
                    <CometChatList
                      showScrollbar={showScrollbar}
                      list={messageReceipts}
                      itemView={getListItem}
                      state={
                        messageReceipts.length === 0
                          ? States.loading
                          : States.loaded
                      }
                      hideSearch={true}
                      showSectionHeader={false}
                    />
                  )}
                  {messageReceipts.length <= 0 && (
                    <div className="cometchat-message-information__receipts-empty">
                      <div>
                        {getLocalizedString("message_information_group_message_receipt_empty")}
                      </div>
                    </div>
                  )}
                </div>
            }
          </React.Fragment>
        )
      }
    </div>
  );
};

export { CometChatMessageInformation };
