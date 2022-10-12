import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";
import {
  CometChatMessageEvents,
  messageConstants,
  CometChatMessageBubble,
  CometChatCustomMessageTypes,
  CometChatSmartReplies,
  MessageListStyles,
  MessageInputData,
  getDefaultTypes,
  CometChatNewMessageIndicator,
  CometChatMessageTemplate,
  CometChatMessageOptions,
} from "..";

import {
  fontHelper,
  ReceiverTypeConstants,
  MessageOptionConstants,
  MessageOptionForConstants,
  MessageListAlignmentConstants,
  MessageBubbleAlignmentConstants,
  MessageCategoryConstants,
  CometChatEmojiKeyboard,
  CometChatPopover,
  CometChatDecoratorMessage,
  CometChatListItem,
  getExtensionsData,
  ExtensionConstants,
  ExtensionURLs,
  CometChatTheme,
  CometChatSoundManager,
  CometChatLocalize,
  localize,
  CustomView,
} from "../..";

import loadingIcon from "./resources/spinner.svg";

import { fetchMessages, Hooks } from "./hooks";

import { MessageListManager } from "./controller";

import {
  chatListStyle,
  listWrapperStyle,
  decoratorMsgStyle,
  decoratorMsgImgStyle,
  decoratorMsgTxtStyle,
  messageBubbleStyle,
  smartReplyStyle,
  emojiKeyBoardStyle,
  emojiBoardToolTipStyle,
  messageIndicatorStyle,
  messageDateContainerStyle,
  messageDateStyle,
} from "./style";
import { messageStatus } from "../CometChatMessageConstants";

import { CometChatDate, DateStyles } from "../../Shared";

import { EmojiKeyboardConfiguration } from "../";

import { SmartRepliesConfiguration } from "../CometChatSmartReplies/SmartRepliesConfiguration";
import { NewMessageIndicatorConfiguration } from "../CometChatNewMessageIndicator/NewMessageIndicatorConfiguration";
import { MessageBubbleConfiguration } from "../Bubbles/CometChatMessageBubble/MessageBubbleConfiguration";
import { DateConfiguration } from "../../Shared/PrimaryComponents/CometChatConfiguration/DateConfiguration";
/**
 *
 * CometChatMessageList component retrieves the latest messages and presents them inside a message bubble, that a CometChat logged-in user has been a part of.
 * The state of the component is communicated via 3 states i.e empty, loading and error
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 *
 */

const CometChatMessageList = React.forwardRef((props, ref) => {
  /**
   * Destructuring prop values
   */
  const {
    limit,
    user,
    group,
    alignment,
    messageTypes,
    excludeMessageOptions,
    customMessageOptions,
    excludeMessageTypes,
    onlyUnread,
    hideMessagesFromBlockedUsers,
    hideDeletedMessages,
    tags,
    loadingIconURL,
    customView,
    emptyText,
    errorText,
    hideError,
    customIncomingMessageSound,
    enableSoundForMessages,
    sentMessageInputData,
    receivedMessageInputData,
    style,
    theme,
    messageBubbleConfiguration,
    emojiKeyboardConfiguration,
    smartRepliesConfiguration,
    newMessageIndicatorConfiguration,
    dateConfiguration,
  } = props;

  let lastScrollTop = 0;
  const loggedInUserRef = React.useRef(null);
  const [messageCount, setMessageCount] = React.useState(0);
  const [messageList, setMessageList] = React.useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = React.useState(0);
  const [callbackData, setCallbackData] = React.useState(null);
  const [decoratorMessage, setDecoratorMessage] = React.useState(
    localize("LOADING")
  );
  const [chatWith, setChatWith] = React.useState(null);
  const [chatWithType, setChatWithType] = React.useState(null);
  const messageTypesRef = React.useRef(null);
  const messageCategoryRef = React.useRef(null);
  let messageListManagerRef = React.useRef(null);
  const messageListEndRef = React.useRef(null);
  const [viewEmojiTray, setViewEmojiTray] = React.useState({});
  const [messageToReact, setMessageToReact] = React.useState(null);

  const [newMessage, setnewMessage] = React.useState({});

  const _theme = new CometChatTheme(theme ?? {});

  const _messageBubbleConfiguration =
    messageBubbleConfiguration || new MessageBubbleConfiguration({});

  const _emojiKeyboardConfiguration =
    emojiKeyboardConfiguration || new EmojiKeyboardConfiguration({});

  const _newMessageIndicatorConfiguration =
    newMessageIndicatorConfiguration ||
    new NewMessageIndicatorConfiguration({});

  const _dateConfiguration =
    dateConfiguration || new DateConfiguration({ pattern: "dayDateFormat" });

  /**
   * Update messagelist
   */
  React.useImperativeHandle(ref, () => ({
    addMessage: addMessage,
    updateMessage: updateMessage,
    removeMessage: removeMessage,
    deleteMessage: deleteMessage,
    scrollToBottom: scrollToBottom,
    translateMessage: translateMessage,
    reactToMessages: reactToMessages,
  }));

  const messageListCallback = (listenerName, ...args) => {
    setCallbackData({ name: listenerName, args: [...args] });
  };

  const errorHandler = (errorCode) => {
    CometChatMessageEvents.emit(
      CometChatMessageEvents.onMessageError,
      errorCode
    );
  };

  const reInitializeMessageBuilder = () => {
    resetChatWindow();

    setDecoratorMessage("loading");
    messageListManagerRef.current.removeListeners();

    messageListManagerRef.current = new MessageListManager(
      limit,
      user,
      group,
      onlyUnread,
      hideDeletedMessages,
      hideMessagesFromBlockedUsers,
      tags,
      messageTypesRef.current,
      messageCategoryRef.current
    );

    fetchMessages(messageListManagerRef?.current).then((messagelist) => {
      messageHandler(messagelist, true);
      setMessageList(messagelist);
      messageListManagerRef.current.attachListeners(messageListCallback);
    });
  };

  /**
   * add new message to the messageList
   */
  const addMessage = (message) => {
    const messagelist = [...messageList];
    messagelist.push(message);
    setMessageList(messagelist);

    // scrollToBottom()
  };

  /**
   * Set unreadCount when new message is received
   */
  const updateUnreadMessageCount = () => {
    setUnreadMessageCount(unreadMessageCount + 1);
  };

  /**
   *
   * @param {*} message
   * Function to play notification sound if sound for messages is enabled.
   * It checks for custom sound and if not provided plays default sound.
   */
  const playNotificationSound = (message) => {
    if (message?.category === MessageCategoryConstants.message) {
      if (enableSoundForMessages) {
        if (customIncomingMessageSound) {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessage,
            customIncomingMessageSound
          );
        } else {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessage
          );
        }
      }
    } else if (
      message?.category !== MessageCategoryConstants.message &&
      message?.metadata?.incrementUnreadCount
    ) {
      if (enableSoundForMessages) {
        if (customIncomingMessageSound) {
          CometChatSoundManager.play(customIncomingMessageSound);
        } else {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessage
          );
        }
      }
    }
  };

  /**
   * Update message
   */
  const updateMessage = (message, withMuid = false) => {
    let messageKey;
    const messagelist = [...messageList];
    if (withMuid) {
      messageKey = messagelist.findIndex((m) => m.muid === message.muid);
    } else {
      messageKey = messagelist.findIndex((m) => m.id === message.id);
    }
    if (messageKey > -1) {
      const messageObject = { ...messageList[messageKey], ...message };

      messagelist.splice(messageKey, 1, messageObject);

      setMessageCount(messagelist.length);
      setMessageList(messagelist);
    }
  };

  /**
   * Update message as read; show double blue tick
   */
  const updateMessageAsRead = (message) => {
    const messagelist = [...messageList];
    let messageKey = messagelist.findIndex((m) => m.id === message.messageId);

    if (messageKey > -1) {
      const messageObject = { ...messageList[messageKey] };
      messageObject.readAt = message.getReadAt();
      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist);
    }
  };

  /**
   * Update message as deleted; show deleted message bubble
   */
  const removeMessage = (message) => {
    const messages = [...messageList];
    let messageKey = messages.findIndex((m) => m.id === message.id);
    if (messageKey > -1) {
      if (hideDeletedMessages) {
        messages.splice(messageKey, 1);
      } else {
        const messageObject = { ...messages[messageKey], ...message };
        messages.splice(messageKey, 1, messageObject);
      }
      setMessageList(() => messages);
    }
  };

  /**
   *
   * @param {*} message
   * emits markAsRead Event
   */
  const markMessageAsRead = (message) => {
    if (!message?.readAt) {
      CometChat.markAsRead(message).catch((error) => {
        errorHandler(error);
      });
    }
  };

  const handleNewMessages = (message) => {
    //handling dom lag - increment count only for main message list

    setnewMessage(message);

    const messageReceivedHandler = (message) => {
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      setMessageCount(messageCount + 1);
      if (
        messageListEndRef.current.scrollHeight -
          messageListEndRef.current.scrollTop -
          messageListEndRef.current.clientHeight <=
        1
      ) {
        if (messageCount > messageConstants.maximumNumOfMessages) {
          reInitializeMessageBuilder();
        } else {
          playNotificationSound(message);
          addMessage(message);
          scrollToBottom();
          markMessageAsRead(message);
          CometChatMessageEvents.emit(
            CometChatMessageEvents.onMessageRead,
            message
          );
        }
      } else {
        //if the user has scrolled up in chat window
        playNotificationSound(message);
        addMessage(message);
        updateUnreadMessageCount();
      }
    };

    /**
     * message receiver is chat window group
     */
    if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      message.getReceiverId() === chatWith?.guid
    ) {
      messageReceivedHandler(message);
    } else if (
      chatWithType === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user
    ) {
      /**
       * If the message sender is chat window user and message receiver is logged-in user
       * OR
       * If the message sender is logged-in user and message receiver is chat window user
       */
      if (
        (message.getSender().uid === chatWith?.uid &&
          message.getReceiverId() === loggedInUserRef?.current?.uid) ||
        (message.getSender().uid === loggedInUserRef?.current?.uid &&
          message.getReceiverId() === chatWith?.uid)
      ) {
        messageReceivedHandler(message);
      }
    }
  };

  const handleNewCustomMessages = (message) => {
    const customMessageReceivedHandler = (message) => {
      setMessageCount(messageCount + 1);
      //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)
      if (
        messageListEndRef.current.scrollHeight -
          messageListEndRef.current.scrollTop -
          messageListEndRef.current.clientHeight <=
        1
      ) {
        if (messageCount > messageConstants.maximumNumOfMessages) {
          reInitializeMessageBuilder();
        } else {
          playNotificationSound(message);
          addMessage(message);
          // scrollToBottom();
          markMessageAsRead(message);
          CometChatMessageEvents.emit(
            CometChatMessageEvents.onMessageRead,
            message
          );
        }
      } else {
        //if the user has scrolled in chat window
        playNotificationSound(message);
        addMessage(message);
        updateUnreadMessageCount();
      }
    };

    if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      loggedInUserRef.current?.uid === message.getSender().uid &&
      message.getReceiverId() === chatWith?.guid &&
      (message.type === CometChatCustomMessageTypes.poll ||
        message.type === CometChatCustomMessageTypes.document ||
        message.type === CometChatCustomMessageTypes.whiteboard)
    ) {
      playNotificationSound();
      addMessage(message);
      // scrollToBottom();
    } else if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      message.getReceiverId() === chatWith?.guid
    ) {
      customMessageReceivedHandler(message, ReceiverTypeConstants.group);
    } else if (
      chatWithType === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user &&
      message.getSender().uid === chatWith?.uid
    ) {
      customMessageReceivedHandler(message, ReceiverTypeConstants.user);
    } else if (
      chatWithType === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user &&
      loggedInUserRef.current?.uid === message.getSender().uid &&
      message.getReceiverId() === chatWith?.uid &&
      (message.type === CometChatCustomMessageTypes.poll ||
        message.type === CometChatCustomMessageTypes.document ||
        message.type === CometChatCustomMessageTypes.whiteboard)
    ) {
      playNotificationSound(message);
      addMessage(message);
      // scrollToBottom();
    }
  };

  const handleMessageDeliveryAndReadReceipt = (messageReceipt) => {
    //read receipts
    if (
      messageReceipt?.getReceiverType() === ReceiverTypeConstants.user &&
      messageReceipt?.getSender()?.getUid() === chatWith?.uid &&
      messageReceipt?.getReceiver() === loggedInUserRef.current.uid
    ) {
      if (messageReceipt?.getReceiptType() === "delivery") {
        updateMessageAsDelivered(messageReceipt);
      } else if (messageReceipt?.getReceiptType() === "read") {
        updateMessageAsRead(messageReceipt);
      }
    } else if (
      messageReceipt?.getReceiverType() === ReceiverTypeConstants.group &&
      messageReceipt?.getReceiver() === chatWith?.guid
    ) {
    }
  };

  const handleMessageDelete = (message) => {
    if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      message.getReceiverId() === chatWith?.guid
    ) {
      removeMessage(message);
    } else if (
      chatWith === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user &&
      message.getSender().uid === chatWith?.uid
    ) {
      removeMessage(message);
    }
  };

  const handleMessageEdit = (message) => {
    if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      message.getReceiverId() === chatWith?.guid
    ) {
      updateMessage(message);
    } else if (
      chatWithType === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user &&
      loggedInUserRef.current.uid === message.getReceiverId() &&
      message.getSender().uid === chatWith?.uid
    ) {
      updateMessage(message);
    } else if (
      chatWithType === ReceiverTypeConstants.user &&
      message.getReceiverType() === ReceiverTypeConstants.user &&
      loggedInUserRef.current.uid === message.getSender().uid &&
      message.getReceiverId() === chatWith?.uid
    ) {
      updateMessage(message);
    }
  };

  const handleNewGroupActionMessage = (message) => {
    if (
      chatWithType === ReceiverTypeConstants.group &&
      message.getReceiverType() === ReceiverTypeConstants.group &&
      message.getReceiverId() === chatWith?.guid
    ) {
      playNotificationSound(message);
      addMessage(message);
      // scrollToBottom();
      markMessageAsRead(message);
      CometChatMessageEvents.emit(
        CometChatMessageEvents.onMessageRead,
        message
      );
    }
  };

  /**
   * update message list
   */
  const prependMessages = (messages) => {
    const messagelist = [...messages, ...messageList];
    setMessageList(messagelist);
    setMessageCount(messagelist.length);
  };

  const messageHandler = (messagelist, scroll, val) => {
    messagelist.forEach((message) => {
      //if the sender of the message is not the loggedin user, mark the message as read.
      if (
        message?.getSender()?.getUid() !== loggedInUserRef.current?.uid &&
        !message?.readAt
      ) {
        if (message.getReceiverType() === ReceiverTypeConstants.user) {
          markMessageAsRead(message);
          CometChatMessageEvents.emit(
            CometChatMessageEvents.onMessageRead,
            message
          );
        } else if (message.getReceiverType() === ReceiverTypeConstants.group) {
          markMessageAsRead(message);
          CometChatMessageEvents.emit(
            CometChatMessageEvents.onMessageRead,
            message
          );
        }
      }
    });

    if (scroll) {
      const lastScrollPoint = val || 0;
      scrollToBottom(lastScrollPoint);
    }
  };

  const scrollToBottom = (scrollHeight = 0) => {
    setTimeout(() => {
      if (messageListEndRef) {
        messageListEndRef.current.scrollTop =
          messageListEndRef.current.scrollHeight - scrollHeight;
      }
    });
  };

  const handleScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop;
    const scrollHeight = event.currentTarget.scrollHeight;

    lastScrollTop = scrollHeight - scrollTop;

    const top = Math.round(scrollTop) === 0;
    if (top && messageList.length) {
      fetchMessages(messageListManagerRef?.current)
        .then((messagelist) => {
          prependMessages(messagelist);
          messageHandler(messagelist, true, lastScrollTop);
        })
        .catch((error) => {
          errorHandler(error);
          setDecoratorMessage(localize("SOMETHING_WRONG"));
        });
    }
  };

  /**
   * Update message as delivered; show double grey tick
   */
  const updateMessageAsDelivered = (message) => {
    const messagelist = [...messageList];
    let messageKey = messagelist.findIndex((m) => m.id === message.messageId);

    if (messageKey > -1) {
      const messageObject = { ...messageList[messageKey] };
      messageObject.deliveredAt = message.getDeliveredAt();
      messagelist?.splice(messageKey, 1, messageObject);
      setMessageList(messagelist);
    }
  };

  /**
   * Upon scrolling to bottom, reload the chat if messages cross the maximum count,
   * or else render and update (mark them as read) the stored messages
   */
  const scrolledToBottom = () => {
    if (unreadMessageCount <= 0) {
      return false;
    }
    const totalMessageCount = messageList.length + unreadMessageCount;
    const message = messageList[messageList.length - 1];
    if (totalMessageCount > messageConstants.maximumNumOfMessages) {
      reInitializeMessageBuilder();
    } else {
      setUnreadMessageCount(0);
      scrollToBottom();
      markMessageAsRead(message);
      CometChatMessageEvents.emit(
        CometChatMessageEvents.onMessageRead,
        message
      );
    }
  };

  /**
   * upon scrolling to the bottom, update the unread messagess
   */

  /**
   * reset message list
   */
  const resetChatWindow = () => {
    setMessageList([]);
    setUnreadMessageCount(0);
    setMessageCount(0);
    setnewMessage({});
  };

  const handlers = {
    onTextMessageReceived: handleNewMessages,
    onMediaMessageReceived: handleNewMessages,
    onCustomMessageReceived: handleNewCustomMessages,
    onMessagesDelivered: handleMessageDeliveryAndReadReceipt,
    onMessagesRead: handleMessageDeliveryAndReadReceipt,
    onMessageDeleted: handleMessageDelete,
    onMessageEdited: handleMessageEdit,
    onGroupMemberScopeChanged: handleNewGroupActionMessage,
    onGroupMemberKicked: handleNewGroupActionMessage,
    onGroupMemberBanned: handleNewGroupActionMessage,
    onGroupMemberUnbanned: handleNewGroupActionMessage,
    onMemberAddedToGroup: handleNewGroupActionMessage,
    onGroupMemberLeft: handleNewGroupActionMessage,
    onGroupMemberJoined: handleNewGroupActionMessage,
  };

  Hooks(
    limit,
    user,
    group,
    excludeMessageTypes,
    onlyUnread,
    hideDeletedMessages,
    hideMessagesFromBlockedUsers,
    tags,
    messageTypes,
    loggedInUserRef,
    messageList,
    setMessageList,
    setDecoratorMessage,
    setChatWith,
    setChatWithType,
    messageHandler,
    messageListCallback,
    handlers,
    callbackData,
    messageTypesRef,
    messageCategoryRef,
    messageListManagerRef,
    localize,
    errorHandler,
    chatWith,
    chatWithType,
    setMessageCount,
    setnewMessage
  );

  /**
   *
   * @param {*} message
   * returns translated text and push it into metadata of message Object
   */
  const translateMessage = (message) => {
    const messageId = message.id;
    const messageText = message.text;

    let translateToLanguage = CometChatLocalize.getLocale();
    let translateMessage = "";
    CometChat.callExtension(
      ExtensionConstants.messageTranslation,
      "POST",
      ExtensionURLs.translate,
      {
        msgId: messageId,
        text: messageText,
        languages: [translateToLanguage],
      }
    )
      .then((result) => {
        if (
          result?.hasOwnProperty("translations") &&
          result.translations.length
        ) {
          const messageTranslation = result.translations[0];
          translateMessage = `${messageTranslation["message_translated"]}`;
          if (message.hasOwnProperty("metadata")) {
            Object.assign(message.metadata, {
              translatedText: translateMessage,
            });
          } else {
            Object.assign(message, {
              metadata: {
                translatedText: translateMessage,
              },
            });
          }
          updateMessage(message);
        }
      })
      .catch((error) => {
        errorHandler(error);
      });
  };

  /**
   *
   * @param {*} message
   * emits edit Message event
   */
  const editMessage = (message) => {
    CometChatMessageEvents.emit(CometChatMessageEvents.onMessageEdit, {
      message: message,
      status: messageStatus.inprogress,
    });
  };

  /**
   *
   * @param {*} message
   * copies message text to the clipboard
   */
  const copyMessage = (message) => {
    navigator.clipboard.writeText(message.text);
  };

  /**
   *
   * @param {*} message
   * Deletes the selected message
   */
  const deleteMessage = (message) => {
    CometChat.deleteMessage(message.id)
      .then((deletedMessage) => {
        removeMessage(deletedMessage);
      })
      .catch((error) => {
        errorHandler(error);
      });
  };

  /**
   *
   * @param {*} message
   * @param {*} event
   * set visibility of Emoji Tray to true
   */
  const onReactToMessages = (message, event, emoji) => {
    // To remove reaction by clicking on the reacted emoji
    if (emoji) {
      reactToMessages(message, emoji);
    }
    // Open EmojiTray When clicked on Reaction messageOption or Add Reaction button
    else {
      setMessageToReact(message);
      setViewEmojiTray((old) => {
        return {
          emojiTrayPreview: !old.emojiTrayPreview,
          event: event,
        };
      });
    }
  };

  /**
   *
   * @param {*} emojiObject
   * triggers reactToMessages function after closing the emojiKeyboard
   */
  const onReactionSelected = (emojiObject) => {
    setViewEmojiTray((old) => {
      return {
        emojiTrayPreview: !old.emojiTrayPreview,
      };
    });
    reactToMessages(messageToReact, emojiObject);
  };

  /**
   *
   * @returns EmojiKeyboard inside tooltip
   */
  const emojiBoard = () => {
    if (viewEmojiTray.emojiTrayPreview) {
      return (
        <CometChatPopover
          position="top"
          x={viewEmojiTray?.event?.clientX}
          y={viewEmojiTray?.event?.clientY}
          style={emojiBoardToolTipStyle(_theme)}
        >
          <CometChatEmojiKeyboard
            style={emojiKeyBoardStyle(_theme)}
            hideSearch={_emojiKeyboardConfiguration.hideSearch}
            theme={_theme}
            onClick={
              onReactionSelected.bind(this) ||
              _emojiKeyboardConfiguration.onClick
            }
          />
        </CometChatPopover>
      );
    } else {
      return null;
    }
  };

  /**
   *
   * @param {*} message
   * @param {*} emoji
   * Calls extension reaction to Messages
   */
  const reactToMessages = (message, emoji) => {
    let reactionObject = {};
    let newMessageObject = {};
    let messageObject = { ...message };
    const userObject = {};

    if (loggedInUserRef?.current?.avatar?.length) {
      userObject["avatar"] = loggedInUserRef.current.avatar;
    }

    if (loggedInUserRef?.current?.name?.length) {
      userObject["name"] = loggedInUserRef.current.name;
    }

    const emojiObject = {
      [emoji]: {
        [loggedInUserRef.current.uid]: userObject,
      },
    };

    const reactionExtensionsData = getExtensionsData(
      messageObject,
      ExtensionConstants.reactions
    );

    if (reactionExtensionsData) {
      if (reactionExtensionsData[emoji]) {
        //if the reactions metadata has the selected emoji/reaction for the loggedin user
        if (reactionExtensionsData[emoji][loggedInUserRef.current.uid]) {
          reactionObject = {
            ...messageObject["metadata"]["@injected"]["extensions"][
              "reactions"
            ],
          };
          delete reactionObject[emoji][loggedInUserRef.current.uid];
        } else {
          reactionObject = {
            ...messageObject["metadata"]["@injected"]["extensions"][
              "reactions"
            ],
            [emoji]: {
              ...messageObject["metadata"]["@injected"]["extensions"][
                "reactions"
              ][emoji],
              [loggedInUserRef.current.uid]: userObject,
            },
          };
        }
      } else {
        reactionObject = {
          ...messageObject["metadata"]["@injected"]["extensions"]["reactions"],
          ...emojiObject,
        };
      }
    } else {
      if (!messageObject.hasOwnProperty("metadata")) {
        messageObject["metadata"] = {};
      }

      if (!messageObject["metadata"].hasOwnProperty("@injected")) {
        messageObject["metadata"]["@injected"] = {};
      }
      if (
        !messageObject["metadata"]["@injected"].hasOwnProperty("extensions")
      ) {
        messageObject["metadata"]["@injected"]["extensions"] = {};
      }
      if (
        !messageObject["metadata"]["@injected"]["extensions"].hasOwnProperty(
          "reactions"
        )
      ) {
        messageObject["metadata"]["@injected"]["extensions"]["reactions"] = {};
      }

      reactionObject = {
        ...emojiObject,
      };
    }

    const metadataObject = {
      metadata: {
        ...messageObject["metadata"],
        "@injected": {
          ...messageObject["metadata"]["@injected"],
          extensions: {
            ...messageObject["metadata"]["@injected"]["extensions"],
            reactions: {
              ...reactionObject,
            },
          },
        },
      },
    };

    newMessageObject = {
      ...messageObject,
      data: {
        ...messageObject,
        ...metadataObject,
      },
      ...metadataObject,
    };

    updateMessage(newMessageObject);

    CometChat.callExtension(
      ExtensionConstants.reactions,
      "POST",
      ExtensionURLs.reaction,
      {
        msgId: message.id,
        emoji: emoji,
      }
    ).catch((error) => {
      errorHandler(error);
      updateMessage(message);
    });
  };

  /**
   *
   * @param {*} messageOptions
   * Sets MessageOptions Onclick function
   */
  const setOptionsCallbackData = (messageOptions) => {
    let optionsList = [...messageOptions];

    optionsList.forEach((eachMessageOption) => {
      switch (eachMessageOption.id) {
        case MessageOptionConstants.deleteMessage:
          if (eachMessageOption.onClick === null) {
            eachMessageOption.onClick = deleteMessage.bind(this);
          }
          break;
        case MessageOptionConstants.editMessage:
          if (eachMessageOption.onClick === null) {
            eachMessageOption.onClick = editMessage.bind(this);
          }
          break;
        case MessageOptionConstants.copyMessage:
          if (eachMessageOption.onClick === null) {
            eachMessageOption.onClick = copyMessage.bind(this);
          }
          break;
        case MessageOptionConstants.reactToMessage:
          if (eachMessageOption.onClick === null) {
            eachMessageOption.onClick = onReactToMessages.bind(this);
          }
          break;
        case MessageOptionConstants.translateMessage:
          if (eachMessageOption.onClick === null) {
            eachMessageOption.onClick = translateMessage.bind(this);
          }
          break;
        default:
          break;
      }
    });
    return optionsList;
  };

  /**
   *
   * @param {*} messageObject
   * @returns messageOptions according to the type of message and sender's identity
   */
  const filterMessageOptions = (messageObject) => {
    let _messageTypes =
      messageTypes && messageTypes.length ? messageTypes : getDefaultTypes();

    let messageOptions = [];
    // If User sends messageTypes as
    _messageTypes.forEach((messageTemplateObject) => {
      // Checking Message types for Template object and message object to set options
      if (messageTemplateObject.type === messageObject.type) {
        messageOptions = messageTemplateObject.options.filter(
          (option) =>
            // Segregating Sender and receiver options.

            (loggedInUserRef.current?.uid === messageObject?.sender?.uid &&
              option.optionFor === MessageOptionForConstants.sender) ||
            option.optionFor === MessageOptionForConstants.both ||
            (loggedInUserRef.current?.uid !== messageObject?.sender?.uid &&
              option.optionFor === MessageOptionForConstants.receiver) ||
            option.optionFor === MessageOptionForConstants.both
        );
      }
    });

    // If user exclude's an option from options list
    if (excludeMessageOptions && excludeMessageOptions.length) {
      excludeMessageOptions.forEach((excludeOption) => {
        messageOptions.forEach((option) => {
          if (option.id === excludeOption) {
            const index = messageOptions.indexOf(option);
            if (index > -1) {
              messageOptions.splice(index, 1); // 2nd parameter means remove one item only
            }
          }
        });
      });
    }

    // If user sends in customMessageOptions
    if (customMessageOptions?.length) {
      customMessageOptions.forEach((option) => {
        messageOptions.push(option);
      });
    }

    // Setting callback data for Message Option's onClick
    return setOptionsCallbackData(messageOptions);
  };

  /**
   *
   * @param {*} message
   * @returns filtering custom View from message Types sent in by the user
   */
  const filterCustomView = (message) => {
    if (messageTypes?.length) {
      const templateObject = messageTypes.filter(
        (messageTemplateObject) =>
          messageTemplateObject.type === message.type &&
          messageTemplateObject.customView
      );
      if (templateObject?.customView) {
        return templateObject.customView;
      }
      return null;
    }
  };

  /**
   *
   * @param {*} customView
   * @returns customView for handling empty,error and loading states
   */
  const getCustomView = (customView) => {
    return React.createElement(customView, props);
  };

  const getMessageContainer = () => {
    let messageContainer = null;
    if (
      messageList.length === 0 &&
      decoratorMessage?.toLowerCase() === localize("LOADING").toLowerCase()
    ) {
      messageContainer = (
        <div
          style={decoratorMsgStyle(style)}
          className="messagelist__decorator-message"
        >
          {customView?.loading ? (
            getCustomView(customView.loading, props)
          ) : (
            <div
              style={decoratorMsgImgStyle(style, loadingIconURL, _theme)}
              className="decorator-message"
            ></div>
          )}
        </div>
      );
    } else if (
      messageList.length === 0 &&
      decoratorMessage?.toLowerCase() ===
        localize("NO_MESSAGES_FOUND").toLowerCase()
    ) {
      messageContainer = (
        <div
          style={decoratorMsgStyle(style)}
          className="messagelist__decorator-message"
        >
          {customView?.empty ? (
            getCustomView(customView?.empty, props)
          ) : (
            <p
              style={decoratorMsgTxtStyle(
                style,
                fontHelper,
                _theme,
                decoratorMessage,
                localize
              )}
              className="decorator-message"
            >
              {emptyText}
            </p>
          )}
        </div>
      );
    } else if (
      decoratorMessage?.toLowerCase() ===
      localize("NO_MESSAGE_TYPE_SET")?.toLowerCase()
    ) {
      messageContainer = (
        <div
          style={decoratorMsgStyle(style)}
          className="messagelist__decorator-message"
        >
          {customView?.empty ? (
            getCustomView(customView?.empty, props)
          ) : (
            <p
              style={decoratorMsgTxtStyle(
                style,
                fontHelper,
                _theme,
                decoratorMessage,
                localize
              )}
              className="decorator-message"
            >
              {decoratorMessage}
            </p>
          )}
        </div>
      );
    } else if (
      !hideError &&
      decoratorMessage?.toLowerCase() ===
        localize("SOMETHING_WRONG").toLowerCase()
    ) {
      messageContainer = (
        <div
          style={decoratorMsgStyle(style)}
          className="messagelist__decorator-message"
        >
          {customView?.error ? (
            getCustomView(customView.error, props)
          ) : (
            <p
              style={decoratorMsgTxtStyle(
                style,
                fontHelper,
                _theme,
                decoratorMessage,
                localize
              )}
              className="decorator-message"
            >
              {errorText}
            </p>
          )}
        </div>
      );
    }
    return messageContainer;
  };

  /**
   * Empty new Message Received State to close Smart reply Preview
   */
  const onClose = () => {
    setnewMessage({});
  };

  const _smartRepliesConfiguration =
    smartRepliesConfiguration ||
    new SmartRepliesConfiguration({ onClose: onClose });
  /**
   *
   * @returns smart suggestions to the user as per the message received
   */
  const getSmartReplies = () => {
    if (Object.keys(newMessage).length) {
      return (
        <CometChatSmartReplies
          messageObject={newMessage}
          customOutgoingMessageSound={
            _smartRepliesConfiguration.customOutgoingMessageSound
          }
          enableSoundForMessages={
            _smartRepliesConfiguration.enableSoundForMessages
          }
          loggedInUser={loggedInUserRef.current}
          onClick={_smartRepliesConfiguration.onClick}
          style={smartReplyStyle(_theme)}
          onClose={onClose.bind(this)}
        />
      );
    }
  };

  /**
   *
   * @returns new Message Indicator banner
   */
  const newMessageIndicator = () => {
    if (unreadMessageCount >= 1) {
      const text =
        unreadMessageCount > 1
          ? `${unreadMessageCount} ${localize("NEW_MESSAGES")}`
          : `${unreadMessageCount} ${localize("NEW_MESSAGE")}`;

      return (
        <CometChatNewMessageIndicator
          text={text}
          onClick={
            scrolledToBottom.bind(this) ||
            _newMessageIndicatorConfiguration.onClick
          }
          Icon={_newMessageIndicatorConfiguration.Icon}
          style={messageIndicatorStyle(_theme)}
        />
      );
    }
    return null;
  };

  /**
   *
   * @returns Items to render in Message List Component
   */
  const renderItems = () => {
    // to hold date value for first message
    let previousMessageDate = null;

    return messageList.map((eachMessage) => {
      // date label component
      let dateSeparator = null;

      // Converting Unix  timeStamp to readable date format
      const currentMessageDate = new Date(eachMessage.sentAt * 1000);

      const currentDate =
        currentMessageDate.getDate() +
        "-" +
        currentMessageDate.getMonth +
        "-" +
        currentMessageDate.getFullYear();
      const previousDate =
        previousMessageDate?.getDate() +
        "-" +
        previousMessageDate?.getMonth +
        "-" +
        previousMessageDate?.getFullYear();

      const pattern = _dateConfiguration?.pattern;
      const customPattern = _dateConfiguration?.customPattern;
      const dateStyle = new DateStyles({
        ..._dateConfiguration?.style,
        textColor:
          _dateConfiguration?.style?.textColor ||
          _theme?.palette?.accent500[_theme?.palette?.mode],
        textFont:
          _dateConfiguration?.style?.textFont ||
          fontHelper(_theme?.typography?.caption2),
      });

      // Comparing Date, Month, Year of the two dates
      if (previousDate !== currentDate) {
        dateSeparator = (
          <div style={messageDateContainerStyle(_theme)}>
            <div style={messageDateStyle(_theme)}>
              <CometChatDate
                timestamp={eachMessage?.sentAt}
                pattern={pattern}
                customPattern={customPattern}
                style={dateStyle}
              />
            </div>
          </div>
        );
      }
      previousMessageDate = currentMessageDate;

      const messageKey = eachMessage.id || eachMessage.muid;
      const className = `message__${eachMessage.type} message__kit__background`;
      let alignmentValue = MessageBubbleAlignmentConstants.left;
      let background;
      let messageBubbleData = {};
      if (
        alignment === MessageListAlignmentConstants?.standard &&
        loggedInUserRef.current?.uid === eachMessage?.sender?.uid
      ) {
        alignmentValue = MessageBubbleAlignmentConstants.right;
        background = {
          background: _theme.palette.primary[_theme.palette.mode],
        };
        messageBubbleData = sentMessageInputData;
      } else if (
        alignment === MessageListAlignmentConstants?.left &&
        loggedInUserRef.current?.uid === eachMessage?.sender?.uid
      ) {
        alignmentValue = MessageBubbleAlignmentConstants.left;
        background = {
          background: _theme.palette.secondary[_theme.palette.mode],
        };
        messageBubbleData = sentMessageInputData;
      } else {
        alignmentValue = MessageBubbleAlignmentConstants.left;
        background = {
          background: _theme.palette.secondary[_theme.palette.mode],
        };
        messageBubbleData = receivedMessageInputData;
      }
      let style = {
        width: "100%",
        height: "100%",
        border: "0 none",
        borderRadius: "12px",
        nameTextFont: fontHelper(_theme.typography.caption1),
        timestampFont: fontHelper(_theme.typography.caption2),
        ...background,
        nameTextColor: _theme.palette.accent500[_theme.palette.mode],
        timestampColor: _theme.palette.accent[_theme.palette.mode],
      };

      return !eachMessage.action ? (
        <React.Fragment key={messageKey}>
          {dateSeparator}
          <div
            key={messageKey}
            className={className}
            style={messageBubbleStyle(
              alignment,
              loggedInUserRef.current,
              eachMessage
            )}
          >
            {
              <CometChatMessageBubble
                key={messageKey}
                messageBubbleData={
                  messageBubbleData ||
                  _messageBubbleConfiguration.messageBubbleData
                }
                alignment={alignmentValue}
                timeAlignment={_messageBubbleConfiguration.timeAlignment}
                messageObject={eachMessage}
                messageOptions={filterMessageOptions(eachMessage)}
                loggedInUser={loggedInUserRef.current}
                customView={filterCustomView(eachMessage)}
                style={{ ...style }}
                theme={_theme}
                updateReaction={onReactToMessages.bind(this)}
              />
            }
          </div>
        </React.Fragment>
      ) : null;
    });
  };

  return (
    <div className="message__list" style={chatListStyle(style, _theme)}>
      <div
        className="list__wrapper"
        style={listWrapperStyle(style, _theme)}
        ref={messageListEndRef}
        onScroll={handleScroll}
      >
        {getMessageContainer()}
        {newMessageIndicator()}
        {emojiBoard()}
        {renderItems()}
      </div>
      {getSmartReplies()}
    </div>
  );
});

CometChatMessageList.defaultProps = {
  limit: 30,
  user: null,
  group: null,
  alignment: "standard",
  messageTypes: null,
  excludeMessageTypes: null,
  excludeMessageOptions: null,
  customMessageOptions: null,
  onlyUnread: false,
  hideMessagesFromBlockedUsers: false,
  hideDeletedMessages: false,
  tags: null,
  loadingIconURL: loadingIcon,
  customView: {
    loading: "",
    empty: "",
    error: "",
  },
  emptyText: "No messages here yet...",
  errorText: "Something went wrong",
  hideError: false,
  customIncomingMessageSound: "",
  enableSoundForMessages: true,
  sentMessageInputData: {
    thumbnail: true,
    title: true,
    timestamp: true,
    readReceipt: true,
  },
  receivedMessageInputData: {
    thumbnail: true,
    title: true,
    timestamp: true,
    readReceipt: false,
  },
  style: {
    width: "100%",
    height: "100%",
    border: "",
    borderRadius: "8px",
    background: "",
    textFont: "400 12px Inter, sans-serif",
    textColor: "rgb(20,20,20)",
  },
  messageBubbleConfiguration: null,
  emojiKeyboardConfiguration: null,
  smartRepliesConfiguration: null,
  newMessageIndicatorConfiguration: null,
  dateConfiguration: null,
};

CometChatMessageList.propTypes = {
  limit: PropTypes.number,
  user: PropTypes.object,
  group: PropTypes.object,
  alignment: PropTypes.string,
  messageTypes: PropTypes.array,
  excludeMessageTypes: PropTypes.array,
  excludeMessageOptions: PropTypes.array,
  customMessageOptions: PropTypes.array,
  onlyUnread: PropTypes.bool,
  hideMessagesFromBlockedUsers: PropTypes.bool,
  hideDeletedMessages: PropTypes.bool,
  tags: PropTypes.array,
  loadingIconURL: PropTypes.string,
  customView: PropTypes.object,
  emptyText: PropTypes.string,
  errorText: PropTypes.string,
  hideError: PropTypes.bool,
  customIncomingMessageSound: PropTypes.string,
  enableSoundForMessages: PropTypes.bool,
  sentMessageInputData: PropTypes.object,
  receivedMessageInputData: PropTypes.object,
  style: PropTypes.object,
  messageBubbleConfiguration: PropTypes.object,
  emojiKeyboardConfiguration: PropTypes.object,
  smartRepliesConfiguration: PropTypes.object,
  newMessageIndicatorConfiguration: PropTypes.object,
  dateConfiguration: PropTypes.object,
};

export { CometChatMessageList };
