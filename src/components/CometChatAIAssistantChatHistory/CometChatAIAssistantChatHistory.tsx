import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { MessageStatus, States } from '../../Enums/Enums';
import { useCometChatErrorHandler } from "../../CometChatCustomHooks";
import { CometChatUIKitLoginListener } from "../../CometChatUIKit/CometChatUIKitLoginListener";
import { getThemeMode, sanitizeCalendarObject } from '../../utils/util';
import emptyIcon from "../../assets/conversations_empty_state.svg";
import emptyIconDark from "../../assets/conversations_empty_state_dark.svg";
import errorIcon from "../../assets/list_error_state_icon.svg"
import errorIconDark from "../../assets/list_error_state_icon_dark.svg"
import { CometChatLocalize, getLocalizedString } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatButton } from '../BaseComponents/CometChatButton/CometChatButton';
import newChatIcon from '../../assets/new-chat.svg';
import { CometChatList } from '../BaseComponents/CometChatList/CometChatList';
import { CometChatDate } from '../BaseComponents/CometChatDate/CometChatDate';
import { CometChatContextMenu } from '../BaseComponents/CometChatContextMenu/CometChatContextMenu';
import { CometChatOption } from '../../modals';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';

interface CometChatAIAssistantChatHistoryProps {
  /**
   * A `CometChat.User` object representing the participant of the chat whose message history is displayed.
   */
  user?: CometChat.User;

  /**
   * A `CometChat.Group` object representing the group whose message history is displayed.
   */
  group?: CometChat.Group;

  /**
   * Callback function triggered when an error occurs during message fetching.
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;

  /**
 * Callback function triggered when clicked on closeIcon button
 */
  onClose?: (() => void) | undefined;

  /**
 * Callback function triggered when clicked on a message
 */
  onMessageClicked?: ((message: CometChat.BaseMessage) => void) | undefined;

  /**
 * Callback function triggered when clicked on new chat button
 */
  onNewChatClicked?: ((id?:number) => void) | undefined;
  /**
    * Hides new chat button.
    * @default false
  */
   hideNewChat?: boolean;

}

const CometChatAIAssistantChatHistory = (props: CometChatAIAssistantChatHistoryProps) => {
  const {
    user,
    group,
    onError,
    onClose,
    onMessageClicked,
    onNewChatClicked,
    hideNewChat
  } = props;

  // State variables
  const [messageList, setMessageList] = useState<CometChat.BaseMessage[]>([]);
  const [listState, setListState] = useState<States>(States.loading);

  // Refs
  const messageListBuilderRef = useRef<CometChat.MessagesRequest | null>(null);
  const loggedInUserRef = useRef<CometChat.User | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const messagesCountRef = useRef<number>(0);
  const lastMessageIdRef = useRef<number>(0);

  // Error handler
  const errorHandler = useCometChatErrorHandler(onError);

  /**
   * Function to extract text content from a message
   */
  const getMessageText = useCallback((message: CometChat.BaseMessage): string => {
    try {
      if (message instanceof CometChat.TextMessage) {
        return message.getText();
      } else if (message instanceof CometChat.MediaMessage) {
        return `${message.getType()} message`;
      } else if (message instanceof CometChat.CustomMessage) {
        return 'Custom message';
      } else if (message.getType() === 'groupMember') {
        return 'Group action message';
      } else {
        return 'Message';
      }
    } catch (error) {
      errorHandler(error, "getMessageText");
      return 'Message';
    }
  }, [errorHandler]);

  /**
   * Function to prepend messages to the beginning of the current message list
   */
  const appendMessages = useCallback(
    (messages: CometChat.BaseMessage[]) => {
      return new Promise<boolean>((resolve) => {
        try {
          setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
            messagesCountRef.current = [...messages, ...prevMessageList].length;
            return [...prevMessageList, ...messages];
          });
          resolve(true);
        } catch (error: any) {
          errorHandler(error, "appendMessages");
          resolve(false);
        }
      });
    },
    [errorHandler]
  );

  /**
   * Function to fetch previous messages
   */
  const fetchPreviousMessages = useCallback(() => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (isFetchingRef.current) {
          resolve(true);
          return;
        }

        isFetchingRef.current = true;
        if (lastMessageIdRef.current && messageListBuilderRef.current && !messageListBuilderRef.current?.getMessageId()) {
          const builder = new CometChat.MessagesRequestBuilder()
            .hideReplies(true)
            .setLimit(30);

          if (user) {
            builder.setUID(user.getUid());
          } else if (group) {
            builder.setGUID(group.getGuid());
          }
          builder.setType(CometChatUIKitConstants.MessageTypes.text)
          builder.setCategory(CometChatUIKitConstants.MessageCategory.message)
          builder.hideDeletedMessages(true)
          builder.setMessageId(lastMessageIdRef.current);
          lastMessageIdRef.current = 0;
          messageListBuilderRef.current = builder.build();
        }
        if (messageListBuilderRef.current) {
          const messages = await messageListBuilderRef.current.fetchPrevious();
          lastMessageIdRef.current = lastMessageIdRef.current === 0 && messages.length > 0 ? messages[0].getId() : 0;


          if (messages.length > 0) {
            await appendMessages(messages.reverse());
            setListState(States.loaded);
          } else {
            if (messages.length == 0 && messagesCountRef.current === 0) {
              setListState(States.empty);
            } else {
              setListState(States.loaded);
            }
          }
        }

        isFetchingRef.current = false;
        resolve(true);
      } catch (error: any) {
        isFetchingRef.current = false;
        if (messagesCountRef.current <= 0) {
          setListState(States.error);
        }
        errorHandler(error, "fetchPreviousMessages");
        reject(error);
      }
    });
  }, [appendMessages, errorHandler]);

  /**
   * Callback to be executed when the list is scrolled to the top
   */
  const onBottomCallback = useCallback(() => {
    return new Promise<boolean>((resolve, reject) => {
      try {
        fetchPreviousMessages().then(
          (success) => resolve(success),
          (error) => reject(error)
        );
      } catch (error: any) {
        errorHandler(error, "onBottomCallback");
        reject(error);
      }
    });
  }, [fetchPreviousMessages, errorHandler]);

  function getSeparatorDateFormat() {
    const defaultFormat = {
      yesterday: getLocalizedString("yesterday"),
      otherDays: `DD MMM, YYYY`,
      today: getLocalizedString("today")
    };

    var globalCalendarFormat = sanitizeCalendarObject(CometChatLocalize.calendarObject)
    const finalFormat = {
      ...defaultFormat,
      ...globalCalendarFormat
    };
    return finalFormat;
  }
  const isDateDifferent: (firstDate: number | undefined, secondDate: number | undefined) => boolean | undefined = useCallback(
    (firstDate: number | undefined, secondDate: number | undefined) => {
      try {
        let firstDateObj: Date, secondDateObj: Date;
        firstDateObj = new Date(firstDate! * 1000);
        secondDateObj = new Date(secondDate! * 1000);
        return (
          firstDateObj.getDate() !== secondDateObj.getDate() ||
          firstDateObj.getMonth() !== secondDateObj.getMonth() ||
          firstDateObj.getFullYear() !== secondDateObj.getFullYear()
        );
      } catch (error: any) {
        errorHandler(error, "isDateDifferent");
      }
    },
    [errorHandler]
  );
  /**
   * Function to create date for the message
   * @param {CometChat.BaseMessage} item - The message for which the date needs to be fetched
   * @param {number} i - The index of the message
   * @returns {JSX.Element | null} - Returns JSX.Element or null for date of a message
   */
  const getMessageDateHeader: (item: CometChat.BaseMessage, i: number) => JSX.Element | undefined = useCallback(
    (item: CometChat.BaseMessage, i: number) => {
      if (
        messageList.length > 0 && isDateDifferent(messageList[i - 1]?.getSentAt(), item?.getSentAt())
      ) {
        return (
          <div
            className={`cometchat-ai-assistant-chat-history__list-item-date-header ${i === 0 ? 'cometchat-ai-assistant-chat-history__list-item-date-header-start' : ''}`}
            key={`${item.getId()}-${item.getSentAt()}`}
          >
            <CometChatDate
              calendarObject={getSeparatorDateFormat()}
              timestamp={item.getSentAt()}
            ></CometChatDate>
          </div>
        );
      }
      return undefined;
    },
    [
      messageList,
      isDateDifferent
    ]
  );

  function getDefaultOptions(message: CometChat.BaseMessage) {
    return [new CometChatOption({
      id: CometChatUIKitConstants.ConversationOptions.delete,
      title: getLocalizedString("conversation_delete_icon_hover"),
      onClick: ()=>{
         CometChat.deleteMessage(String(message.getId())).then(()=>{
           setMessageList((prevMessages) => {
             return prevMessages.filter((m) => m.getId() !== message.getId())
           })
           if(onNewChatClicked){
            onNewChatClicked(message.getId())
           }
         }).catch((error)=>{
          errorHandler(error, "deleteMessage")
         })
      },
    })]
  }

  /**
   * Function to render list item
   */
  const itemView = useCallback((message: CometChat.BaseMessage, i: number) => {
    return (
      <div className='cometchat-ai-assistant-chat-history__list-item-container'>
        {getMessageDateHeader(message, i)}
        <div onClick={() => {
          if (onMessageClicked) {
            onMessageClicked(message);
          }
        }} className="cometchat-ai-assistant-chat-history__list-item">
          <div className="cometchat-ai-assistant-chat-history__list-item-text">
            {getMessageText(message)}
          </div>
          <div className="cometchat-ai-assistant-chat-history__list-options"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <CometChatContextMenu topMenuSize={2} data={getDefaultOptions(message)} />

          </div>
        </div>
      </div>
    );
  }, [getMessageText, getMessageDateHeader]);

  /**
   * Initialize component and fetch logged-in user
   */
  useEffect(() => {
    CometChat.getLoggedinUser()
      .then((userObject: CometChat.User | null) => {
        if (userObject) {
          loggedInUserRef.current = userObject;
        }
      })
      .catch((error: CometChat.CometChatException) => {
        errorHandler(error, "getLoggedinUser");
      });
  }, [user, group, errorHandler]);

  useEffect(() => {
    let ccMessageSentEvent = CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => {
      if (data.status == MessageStatus.success) {
        let message = data.message;
        if (user && message.getType() == CometChatUIKitConstants.MessageTypes.text && message.getReceiverId() == user.getUid() && !message.getParentMessageId() && message.getSender().getUid() == loggedInUserRef.current?.getUid()) {
          setMessageList((prevMessages) => {
            messagesCountRef.current = prevMessages.length + 1;
            return [message, ...prevMessages];
          });
        }
      }
    })
    return () => ccMessageSentEvent?.unsubscribe();
  }, [user]);

  /**
   * Initialize message list manager when user or group changes
   */
  useEffect(() => {
    const initializeChat = async () => {
      try {
        if (CometChatUIKitLoginListener.getLoggedInUser() && (user || group)) {
          // Create messages request builder with hideReplies set to true
          const builder = new CometChat.MessagesRequestBuilder()
            .hideReplies(true)
            .setLimit(30);

          if (user) {
            builder.setUID(user.getUid());
          } else if (group) {
            builder.setGUID(group.getGuid());

          }
            builder.setType(CometChatUIKitConstants.MessageTypes.text)
            builder.setCategory(CometChatUIKitConstants.MessageCategory.message)
            builder.hideDeletedMessages(true)

          messageListBuilderRef.current = builder.build();
          messagesCountRef.current = 0;
          setMessageList([]);
          setListState(States.loading);
          fetchPreviousMessages();
        }
      } catch (error) {
        errorHandler(error, "useEffect - initialization");
      }
    };

    initializeChat();
  }, [user, group, errorHandler]);

  const getLoadingView = () => {
    return (
      <div className='cometchat-ai-assistant-chat-history__shimmer'>
        {[...Array(15)].map((_, index) => (
          <div key={index} className='cometchat-ai-assistant-chat-history__shimmer-item'>

            <div className='cometchat-ai-assistant-chat-history__shimmer-item-title'></div>
          </div>
        ))}
      </div>
    );
  };
  const getEmptyView = () => {
    const isDarkMode = getThemeMode() === "dark";
    return (
      <div className='cometchat-ai-assistant-chat-history__empty-state-view'>
        <div
          className='cometchat-ai-assistant-chat-history__empty-state-view-icon'
        >
          <img src={isDarkMode ? emptyIconDark : emptyIcon} alt="" />
        </div>
        <div className='cometchat-ai-assistant-chat-history__empty-state-view-body'>
          <div className='cometchat-ai-assistant-chat-history__empty-state-view-body-title'>
            {getLocalizedString("ai_assistant_chat_history_empty_title")}
          </div>
          <div className='cometchat-ai-assistant-chat-history__empty-state-view-body-description'>
            {getLocalizedString("ai_assistant_chat_history_empty_subtitle")}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders the error state view when an error occurs
   *
   * @remarks
   * If a custom `errorView` is provided, it will be used. Otherwise, a default error message is displayed.
   *
   * @returns A JSX element representing the error state
   */
  const getErrorView = () => {
    const isDarkMode = getThemeMode() === "dark";
    return (
      <div className='cometchat-ai-assistant-chat-history__error-state-view'>
        <div className='cometchat-ai-assistant-chat-history__error-state-view-icon'>
          <img src={isDarkMode ? errorIconDark : errorIcon} alt="" />
        </div>
        <div className='cometchat-ai-assistant-chat-history__error-state-view-body'>
          <div className='cometchat-ai-assistant-chat-history__error-state-view-body-title'>
            {getLocalizedString("ai_assistant_chat_history_error_title")}
          </div>
          <div className='cometchat-ai-assistant-chat-history__error-state-view-body-description'>
            {getLocalizedString("ai_assistant_chat_history_error_subtitle")}
          </div>
        </div>
      </div>
    );
  };

  function getHeaderView() {
    return <div className="cometchat-ai-assistant-chat-history__header-container">
      <div className='cometchat-ai-assistant-chat-history__header'>
        <h3 className="cometchat-ai-assistant-chat-history__title">{getLocalizedString("ai_assistant_chat_history_title")}</h3>
        <button
          className="cometchat-ai-assistant-chat-history__close"
          onClick={onClose}
        >
          <span className="cometchat-ai-assistant-chat-history__close-icon"></span>
        </button>
      </div>
      {!hideNewChat && getNewChatButton()}
    </div>
  }

  function getNewChatButton() {
    return (
      <div className="cometchat-ai-assistant-chat-history__header-container-new-chat-container">
        <CometChatButton onClick={()=>{
          if(onNewChatClicked){
            onNewChatClicked()
          }
        }} iconURL={newChatIcon} hoverText={getLocalizedString("ai_assistant_chat_new_chat")} text={getLocalizedString("ai_assistant_chat_new_chat")} />
      </div>
    );
  }

  return (
    <div className="cometchat-ai-assistant-chat-history">
      <div className="cometchat-ai-assistant-chat-history__list">
        <CometChatList
          title='Message History'
          showSectionHeader={false}
          list={messageList}
          onScrolledToBottom={onBottomCallback}
          itemView={itemView}
          loadingView={getLoadingView()}
          emptyView={getEmptyView()}
          errorView={getErrorView()}
          state={listState}
          hideSearch={true}
          headerView={getHeaderView()}
        />
      </div>
    </div>
  );
};

export { CometChatAIAssistantChatHistory };