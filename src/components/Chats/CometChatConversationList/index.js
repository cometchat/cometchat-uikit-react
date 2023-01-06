import React, { useRef, useState } from "react";
import { CometChat } from "@cometchat-pro/chat";
import PropTypes from "prop-types";
import { ConversationListManager } from "./controller";
import { Hooks } from "./hooks";
import * as styles from "./style";
import loadingIcon from "./resources/spinner.svg";
import {
  CometChatSoundManager,
  CometChatConversationListItem,
  localize,
  CometChatTheme,
  ReceiverTypeConstants,
  MessageCategoryConstants,
  ConversationTypeConstants,
  CometChatBackdrop,
  CometChatConfirmDialog,
  ConversationListItemConfiguration,
  ConversationOptionConstants,
  ConversationListItemStyle,
} from "../../Shared";
import { CometChatConversationEvents } from "../";
import {
  ConversationListStyles,
  CometChatConversationOptions,
} from "../../Chats";
import { ConversationListCustomView } from "../ConversationListCustomView";
import deleteIcon from "./resources/delete.svg";

/**
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @description CometChatConversationList component retrieves the latest conversations that a CometChat logged-in user has been a part of.
 * The state of the component is communicated via 3 states i.e empty, loading and error.
 *
 */
const ConversationList = React.forwardRef((props, ref) => {
  /**
   * Props destructuring
   */
  const {
    activeConversation,
    emptyText,
    errorText,
    conversationType,
    limit,
    hideError,
    tags,
    userAndGroupTags,
    loadingIconURL,
    style,
    enableSoundForMessages,
    customIncomingMessageSound,
    customView,
    conversationListItemConfiguration,
    theme,
  } = props;

  /**
   * Component internal state
   */
  const loggedInUser = useRef(null);
  const conversationListManager = useRef(
    new ConversationListManager({
      conversationType: conversationType,
      limit: limit,
      tags: tags,
      userAndGroupTags: userAndGroupTags,
    })
  );
  const [conversationList, setConversationList] = useState([]);
  const [message, setMessage] = useState(localize("LOADING"));
  const [showConfirm, setShowConfirm] = useState({
    show: false,
    message: localize("CONFIRM_DELETE_CONVERSATION"),
    confirmButtonText: localize("DELETE"),
    conversation: null,
    onCancel: () => {},
  });
  const activeConversationRef = React.useRef(null);
  const callbackDataRef = React.useRef(null);

  /**
   * Component private scoping
   */
  const _conversationListItemConfiguration =
    new ConversationListItemConfiguration(
      conversationListItemConfiguration ?? {}
    );
  const _theme = new CometChatTheme(theme ?? {});
  activeConversationRef.current = activeConversation;

  /**
   * Component internal handlers/methods
   */

  const conversationCallback = (listenerName, ...args) => {
    callbackDataRef.current = { name: listenerName, args: [...args] };
    try {
      const handler = handlers[callbackDataRef.current?.name];

      if (handler) return handler(...callbackDataRef.current?.args);
    } catch (e) {
      throw e;
    }
  };

  /**
   * Mark the incoming message as delivered
   */
  const markMessageAsDelivered = (message) => {
    if (message.hasOwnProperty("deliveredAt") === false) {
      CometChat.markAsDelivered(message);
    }
  };

  /**
   *
   * If the incoming message is 1-1 conversation, and the conversation type filter is set to groups return false
   * If the incoming message is group conversation, and the conversation type filter is set to users return false
   * else return true
   *
   */
  React.useImperativeHandle(ref, () => ({
    resetUnreadCount: resetUnreadCount,
    updateLastMessage: updateLastMessage,
    updateConversationonEditOrDeleteMessage:
      updateConversationonEditOrDeleteMessage,
    removeConversation: removeConversation,
    deleteConversation: deleteConversation,
    updateConversation: updateConversation,
  }));

  const filterByConversationType = (message) => {
    if (conversationType !== ConversationTypeConstants.both) {
      if (
        (conversationType === ConversationTypeConstants.users &&
          message?.receiverType === ReceiverTypeConstants.group) ||
        (conversationType === ConversationTypeConstants.groups &&
          message?.receiverType === ReceiverTypeConstants.user)
      ) {
        return false;
      }
    }
    return true;
  };

  /**
   *
   * Converting message object received in the listener callback to conversation object
   */
  const getConversationFromMessage = (message) => {
    return new Promise((resolve, reject) => {
      CometChat.CometChatHelper.getConversationFromMessage(message)
        .then((conversation) => {
          let conversationKey = conversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId
          );
          if (conversationKey > -1) {
            resolve({
              conversationKey: conversationKey,
              conversationId: conversation.conversationId,
              conversationType: conversation.conversationType,
              conversationWith: conversation.conversationWith,
              conversation: conversationList[conversationKey],
              conversations: [...conversationList],
            });
          }

          resolve({
            conversationKey: conversationKey,
            conversationId: conversation.conversationId,
            conversationType: conversation.conversationType,
            conversationWith: conversation.conversationWith,
            conversation: conversation,
            conversations: [...conversationList],
          });
        })
        .catch((error) => {
          CometChatConversationEvents.emit(
            CometChatConversationEvents.onError,
            error
          );
          reject(error);
        });
    });
  };

  const getUnreadMessageCount = (
    message,
    conversation = {},
    activeConversation = null
  ) => {
    let unreadMessageCount = conversation?.unreadMessageCount
      ? Number(conversation?.unreadMessageCount)
      : 0;

    unreadMessageCount = shouldIncrementCount(message)
      ? ++unreadMessageCount
      : unreadMessageCount;

    unreadMessageCount =
      activeConversationRef.current?.conversationId ===
      conversation?.conversationId
        ? 0
        : unreadMessageCount;

    return unreadMessageCount;
  };

  /**
   *
   * If the message is sent by the logged in user, return false
   * If the message has category message or has incrementUnreadCount key in the metadata with value set to true, return true else return false
   *
   */
  const shouldIncrementCount = (message) => {
    if (message?.sender?.uid === loggedInUser?.current?.uid) {
      return false;
    }

    if (
      message?.category === MessageCategoryConstants.message ||
      message?.metadata?.incrementUnreadCount === true
    ) {
      return true;
    }
    return false;
  };

  /**
   * play notification sound for incoming messages
   */
  const playNotificationSound = (message) => {
    /**
     * If unreadcount is not incremented, don't play notification sound
     */
    if (!shouldIncrementCount(message)) {
      return false;
    }
    /**
        * If customIncomingMessageSound url is present then CometChatSoundManager will play this sound
        else play the default sound
        */
    if (
      enableSoundForMessages &&
      activeConversation?.conversationType &&
      activeConversation?.conversationWith
    ) {
      const receiverType = message.getReceiverType();
      const receiverId =
        receiverType === ReceiverTypeConstants.user
          ? message?.getSender()?.getUid()
          : message?.getReceiverId();

      if (
        receiverId !== activeConversation?.conversationWith?.uid &&
        receiverId !== activeConversation?.conversationWith?.guid
      ) {
        if (customIncomingMessageSound) {
          CometChatSoundManager.play(customIncomingMessageSound);
        } else {
          CometChatSoundManager.play(
            CometChatSoundManager.Sound.incomingMessageFromOther
          );
        }
      }
    }
  };

  /**
   *
   * When a user goes online/ offline
   */
  const handleUsers = (user) => {
    const conversationKey = conversationList.findIndex(
      (eachConversation) =>
        eachConversation.conversationType &&
        eachConversation.conversationType === ReceiverTypeConstants.user &&
        eachConversation.conversationWith &&
        eachConversation.conversationWith.uid &&
        eachConversation.conversationWith.uid === user.uid
    );

    if (conversationKey > -1) {
      let conversations = [...conversationList];
      let conversation = conversations[conversationKey];
      let conversationWith = {
        ...conversation.conversationWith,
        status: user.getStatus(),
      };

      let newConversation = {
        ...conversation,
        conversationWith: conversationWith,
      };
      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  /**
   *
   * When a text message / media message / custom message is received
   */
  const handleMessages = (...options) => {
    const message = options[0];
    /**
     * marking the incoming messages as read
     */
    markMessageAsDelivered(message);
    /**
     * If the incoming message is 1-1 and the conversation type filter is set to group, return false
     * OR
     * If the incoming message is group and the conversation type filter is set to "users", return false
     * ELSE
     * return true
     */
    if (filterByConversationType() === false) {
      return false;
    }
    CometChat.CometChatHelper.getConversationFromMessage(message)
      .then((conversation) => {
        setConversationList((prevConversationList) => {
          const list = [...prevConversationList];

          let conversationKey = prevConversationList.findIndex(
            (c) => c.conversationId === conversation.conversationId
          );

          //  const lastMessage = { ...conversation?.lastMessage, ...message, data: {...message.data} };

          if (conversationKey > -1) {
            const latestConversation = prevConversationList[conversationKey];

            const lastMessage = {
              ...latestConversation?.lastMessage,
              ...message,
              data: { ...message.data },
            };
            const unreadMessageCount = getUnreadMessageCount(
              message,
              latestConversation
            );

            const newConversation = {
              ...latestConversation,
              conversationId: latestConversation.conversationId,
              conversationType: latestConversation.conversationType,
              conversationWith: { ...latestConversation.conversationWith },
              unreadMessageCount: unreadMessageCount,
              lastMessage: { ...lastMessage },
            };

            //play notification sound
            playNotificationSound(message);

            list.splice(conversationKey, 1);
            list.unshift(newConversation);

            return [...list];
          } else {
            const lastMessage = {
              ...conversation?.lastMessage,
              ...message,
              data: { ...message.data },
            };
            const unreadMessageCount = getUnreadMessageCount(
              message,
              conversation
            );

            const newConversation = new CometChat.Conversation(
              conversation.conversationId,
              conversation.conversationType,
              lastMessage,
              conversation.conversationWith,
              unreadMessageCount
            );

            list.unshift(newConversation);

            return [...list];
          }
        });
      })
      .catch((error) =>
        CometChatConversationEvents.emit(
          CometChatConversationEvents.onError,
          error
        )
      );
  };

  /**
   * Listener callback when a message is edited, deleted or updated
   */
  const handleMessageActions = (...options) => {
    const message = options[0];

    getConversationFromMessage(message).then((response) => {
      setConversationList(
        (prevConversationList) => {
          const conversations = [...prevConversationList];
          let conversationKey = prevConversationList.findIndex(
            (c) => c.conversationId === response.conversation.conversationId
          );

          const latestConversation = prevConversationList[conversationKey];
          if (
            conversationKey > -1 &&
            latestConversation?.lastMessage?.id === message?.id
          ) {
            const lastMessage = {
              ...latestConversation?.lastMessage,
              ...message,
              data: { ...message.data },
            };
            const unreadMessageCount = getUnreadMessageCount(
              message,
              latestConversation
            );
            const newConversation = new CometChat.Conversation(
              latestConversation.conversationId,
              latestConversation.conversationType,
              lastMessage,
              response.conversationWith,
              unreadMessageCount,
              latestConversation
            );
            conversations.splice(conversationKey, 1, newConversation);
            return [...conversations];
          } else {
            return [...prevConversationList];
          }
        }
        //    } else {
        //    const {
        //     conversationId,
        //     conversationType,
        //     conversationWith,
        //     conversation,
        //     conversations,
        //    } = response;
        //    const lastMessage = {
        //      ...conversation.lastMessage, ...message, data: {
        //      ...message.data
        //    } };
        //    const unreadMessageCount = getUnreadMessageCount(message, conversation);
        //    if (lastMessage.id === message.id) {
        //      const newConversation = new CometChat.Conversation(
        //        conversationId,
        //        conversationType,
        //        lastMessage,
        //        conversationWith,
        //        unreadMessageCount
        //      )
        //      conversations.unshift(newConversation);
        //      return [...conversations]
        //    }
        //  }
      );
    });
  };

  /**
   *
   * Listener callback when a message is read
   */
  const handleMessageReadActions = (...options) => {
    const messageReceipt = options[0];

    let conversationKey = conversationList.findIndex(
      (conversation) =>
        messageReceipt?.receiverType === conversation?.conversationType &&
        (messageReceipt?.receiver === conversation?.conversationWith?.uid ||
          messageReceipt?.receiver === conversation?.conversationWith?.guid)
    );

    if (conversationKey > -1) {
      const conversations = { ...conversationList };
      const conversation = conversations[conversationKey];
      let unreadMessageCount = getUnreadMessageCount(message, conversation);

      /**
       * If the message id in the read receipt is greater than or equal to the lastmessage id, set unreadmessagecount to 0
       */
      if (messageReceipt?.messageId >= conversation?.lastMessage?.id) {
        unreadMessageCount = 0;
      }

      const newConversation = new CometChat.Conversation(
        conversation.conversationId,
        conversation.conversationType,
        conversation.lastMessage,
        conversation.conversationWith,
        unreadMessageCount
      );

      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  /**
   *
   * Listener callback when a user joins/added to the group
   */
  const handleGroupMemberAddition = (...options) => {
    const message = options[0];
    const newUser = options[1];
    const group = options[3];

    getConversationFromMessage(message).then((response) => {
      const {
        conversationKey,
        conversationId,
        conversationType,
        conversationWith,
        conversation,
        conversations,
      } = response;

      if (conversationKey > -1) {
        const lastMessage = { ...conversation.lastMessage, ...message };
        const newConversationWith = { ...conversationWith, ...group };
        const unreadMessageCount = getUnreadMessageCount(message, conversation);

        const newConversation = new CometChat.Conversation(
          conversationId,
          conversationType,
          lastMessage,
          newConversationWith,
          unreadMessageCount
        );
        conversations.splice(conversationKey, 1, newConversation);
        setConversationList(conversations);
      } else if (loggedInUser?.current?.uid === newUser.uid) {
        /**
         * If the loggedin user is added to the group, add the conversation to the chats list
         */
        const lastMessage = { ...message };
        const newConversationWith = {
          ...conversationWith,
          ...group,
          hasJoined: true,
        };
        const unreadMessageCount = getUnreadMessageCount(message, conversation);

        const newConversation = new CometChat.Conversation(
          conversationId,
          conversationType,
          lastMessage,
          newConversationWith,
          unreadMessageCount
        );

        conversations.unshift(newConversation);
        setConversationList(conversations);
      }
    });
  };

  /**
   *
   * Listener callback when a member is kicked from / has left the group
   */
  const handleGroupMemberRemoval = (...options) => {
    const message = options[0];
    const removedUser = options[1];
    const group = options[3];

    getConversationFromMessage(message).then((response) => {
      const {
        conversationKey,
        conversationId,
        conversationType,
        conversationWith,
        conversation,
        conversations,
      } = response;

      if (conversationKey > -1) {
        /**
         * If the loggedin user is removed from the group, remove the conversation from the chats list
         */
        if (loggedInUser?.current?.uid === removedUser.uid) {
          conversations.splice(conversationKey, 1);
          setConversationList(conversations);
        } else {
          const lastMessage = { ...conversation.lastMessage, ...message };
          const newConversationWith = { ...conversationWith, ...group };
          const unreadMessageCount = getUnreadMessageCount(
            message,
            conversation
          );

          const newConversation = new CometChat.Conversation(
            conversationId,
            conversationType,
            lastMessage,
            newConversationWith,
            unreadMessageCount
          );

          conversations.splice(conversationKey, 1, newConversation);
          setConversationList(conversations);
        }
      }
    });
  };

  /**
   *
   * Listener callback when a member is banned from the group
   */
  const handleGroupMemberBan = (...options) => {
    const message = options[0];
    const removedUser = options[1];
    const group = options[3];

    getConversationFromMessage(message).then((response) => {
      const {
        conversationKey,
        conversationId,
        conversationType,
        conversationWith,
        conversation,
        conversations,
      } = response;

      if (conversationKey > -1) {
        /**
         * If the loggedin user is banned from the group, remove the conversation from the chats list
         */
        if (loggedInUser?.current?.uid === removedUser.uid) {
          conversations.splice(conversationKey, 1);
          setConversationList(conversations);
        } else {
          const lastMessage = { ...conversation.lastMessage, ...message };
          const newConversationWith = { ...conversationWith, ...group };
          const unreadMessageCount = getUnreadMessageCount(
            message,
            conversation
          );

          const newConversation = new CometChat.Conversation(
            conversationId,
            conversationType,
            lastMessage,
            newConversationWith,
            unreadMessageCount
          );

          conversations.splice(conversationKey, 1, newConversation);
          setConversationList(conversations);
        }
      }
    });
  };

  /**
   *
   * Listener callback when a group member scope is updated
   */
  const handleGroupMemberScopeChange = (...options) => {
    const message = options[0];
    const user = options[1];
    const newScope = options[2];
    const group = options[4];

    getConversationFromMessage(message).then((response) => {
      const {
        conversationKey,
        conversationId,
        conversationType,
        conversationWith,
        conversation,
        conversations,
      } = response;

      if (conversationKey > -1) {
        const lastMessage = { ...conversation.lastMessage, ...message };
        const unreadMessageCount = getUnreadMessageCount(message, conversation);

        if (loggedInUser?.current?.uid === user.uid) {
          const newConversationWith = {
            ...conversationWith,
            ...group,
            scope: newScope,
          };

          const newConversation = new CometChat.Conversation(
            conversationId,
            conversationType,
            lastMessage,
            newConversationWith,
            unreadMessageCount
          );

          conversations.splice(conversationKey, 1);
          conversations.unshift(newConversation);
          setConversationList(conversations);
        } else {
          let newConversationWith = { ...conversationWith, ...group };

          const newConversation = new CometChat.Conversation(
            conversationId,
            conversationType,
            lastMessage,
            newConversationWith,
            unreadMessageCount
          );

          conversations.splice(conversationKey, 1, newConversation);
          setConversationList(conversations);
        }
      }
    });
  };

  /**
   *
   * Listener callback for typing events
   */
  const handleTyping = (...options) => {
    const typingData = options[0];
    const typingStarted = options[1];
    const conversations = [...conversationList];

    let conversationKey = conversations.findIndex(
      (conversation) =>
        conversation?.conversationType === typingData?.receiverType &&
        ((conversation?.conversationType === ReceiverTypeConstants.user &&
          conversation.conversationWith?.uid === typingData?.sender?.uid) ||
          (conversation.conversationType === ReceiverTypeConstants.group &&
            conversation.conversationWith?.guid === typingData?.receiverId))
    );

    if (conversationKey > -1) {
      let typingIndicatorText = "";
      if (typingStarted) {
        typingIndicatorText =
          typingData?.receiverType === ReceiverTypeConstants.group
            ? `${typingData?.sender?.name} ${localize("IS_TYPING")}`
            : localize("IS_TYPING");
      }

      const conversation = conversationList[conversationKey];
      const newConversation = {
        ...conversation,
        showTypingIndicator: typingStarted,
        typingIndicatorText,
      };

      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  /**
   *
   * @param {Object} conversation
   * Public method to update the conversation list programmatically
   */
  const updateConversation = (conversation) => {
    const conversationKey = conversationList.findIndex(
      (eachConversation) =>
        eachConversation.conversationWith &&
        eachConversation.conversationWith.uid &&
        eachConversation.conversationWith.uid ===
          conversation?.conversationWith?.uid
    );

    if (conversationKey > -1) {
      let conversations = [...conversationList];
      let conversation = conversations[conversationKey];
      let conversationWith = {
        ...conversation.conversationWith,
      };

      let newConversation = {
        ...conversation,
        conversationWith: conversationWith,
      };
      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  const handlers = {
    onUserOnline: handleUsers,
    onUserOffline: handleUsers,
    onTextMessageReceived: handleMessages,
    onMediaMessageReceived: handleMessages,
    onCustomMessageReceived: handleMessages,
    onIncomingCallReceived: handleMessages,
    onIncomingCallCancelled: handleMessages,
    messageEdited: handleMessageActions,
    onMessageDeleted: handleMessageActions,
    messageRead: handleMessageReadActions,
    onMemberAddedToGroup: handleGroupMemberAddition,
    onGroupMemberJoined: handleGroupMemberAddition,
    onGroupMemberKicked: handleGroupMemberRemoval,
    onGroupMemberLeft: handleGroupMemberRemoval,
    onGroupMemberBanned: handleGroupMemberBan,
    onGroupMemberScopeChanged: handleGroupMemberScopeChange,
    onTypingStarted: handleTyping,
    onTypingEnded: handleTyping,
  };

  const handleConversations = () => {
    getConversations()
      .then((conversations) => {
        if (conversationList.length === 0 && conversations.length === 0) {
          setMessage("NO_CHATS_FOUND");
        } else {
          setMessage("");
        }

        setConversationList((conversationList) => {
          return [...conversationList, ...conversations];
        });
      })
      .catch((error) => {
        CometChatConversationEvents.emit(
          CometChatConversationEvents.onError,
          error
        );
        setMessage("SOMETHING_WENT_WRONG");
      });
  };

  const getConversations = () => {
    return new Promise((resolve, reject) => {
      conversationListManager?.current
        .fetchNextConversation()
        .then((conversations) => resolve(conversations))
        .catch((error) => {
          CometChatConversationEvents.emit(
            CometChatConversationEvents.onError,
            error
          );
          reject(error);
        });
    });
  };

  const handleScroll = (event) => {
    const bottom =
      Math.round(
        event.currentTarget.scrollHeight - event.currentTarget.scrollTop
      ) === Math.round(event.currentTarget.clientHeight);
    if (bottom) {
      handleConversations();
    }
  };

  /**
   * reset un read count
   */
  const resetUnreadCount = (conversation) => {
    const conversations = [...conversationList];
    const conversationKey = conversations.findIndex(
      (conversationObject) =>
        conversationObject.conversationId === conversation.conversationId
    );
    if (conversationKey > -1) {
      let conversation = conversations[conversationKey];
      let newConversation = {
        ...conversation,
        unreadMessageCount: 0,
      };
      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  // /**
  //  * update last edited or deleted message
  //  */
  const updateConversationonEditOrDeleteMessage = (message) => {
    getConversationFromMessage(message).then((response) => {
      setConversationList((prevConversationList) => {
        let conversations = [...prevConversationList];
        let conversationKey = prevConversationList.findIndex(
          (c) => c.conversationId === response.conversation.conversationId
        );

        const latestConversation = prevConversationList[conversationKey];
        if (
          conversationKey > -1 &&
          latestConversation?.lastMessage?.id === message.id
        ) {
          let newConversation = {
            ...latestConversation,
            lastMessage: { ...message },
          };
          conversations.splice(conversationKey, 1, newConversation);
          return [...conversations];
        } else {
          return [...prevConversationList];
        }
      });
    });
  };

  /**
   * update last message
   */
  const updateLastMessage = (message) => {
    getConversationFromMessage(message).then((response) => {
      setConversationList((prevConversationList) => {
        let conversations = [...prevConversationList];
        let conversationKey = prevConversationList.findIndex(
          (c) => c.conversationId === response.conversation.conversationId
        );

        if (conversationKey > -1) {
          const latestConversation = prevConversationList[conversationKey];
          let newConversation = {
            ...latestConversation,
            lastMessage: { ...message },
          };
          conversations.splice(conversationKey, 1, newConversation);
          return [...conversations];
        } else {
          const { conversationKey, conversations, conversation } = response;
          let newConversation = {
            ...conversation,
            lastMessage: { ...message },
          };
          conversations.unshift(conversationKey, 1, newConversation);
          return [...conversations];
        }
      });
    });
  };

  /**
   * Remove conversation from the conversationlist upon delete
   */
  const removeConversation = (conversation) => {
    const conversationKey = conversationList.findIndex(
      (c) => c.conversationId === conversation.conversationId
    );

    if (conversationKey > -1) {
      const newConversationList = [...conversationList];
      newConversationList.splice(conversationKey, 1);
      setConversationList(newConversationList);
    }
  };

  const deleteConversation = (conversationToBeDeleted) => {
    return new Promise((resolve, reject) => {
      const conversationWith =
        conversationToBeDeleted?.conversationType ===
        ReceiverTypeConstants.group
          ? conversationToBeDeleted?.conversationWith?.guid
          : conversationToBeDeleted?.conversationWith?.uid;

      CometChat.deleteConversation(
        conversationWith,
        conversationToBeDeleted?.conversationType
      )
        .then((deletedConversation) => {
          setShowConfirm({
            ...showConfirm,
            show: false,
          });
          removeConversation(conversationToBeDeleted);
          resolve(deletedConversation);
          CometChatConversationEvents.emit(
            CometChatConversationEvents.onDeleteConversation,
            conversationToBeDeleted
          );
        })

        .catch((error) => {
          CometChatConversationEvents.emit(
            CometChatConversationEvents.onError,
            conversationToBeDeleted
          );
          reject(error);
        });
    });
  };

  const cancelDelete = () =>
    setShowConfirm({
      ...showConfirm,
      show: false,
    });

  const confirmDelete = (conversation) => {
    setShowConfirm({
      ...showConfirm,
      show: true,
      conversation: conversation,
      onCancel: cancelDelete,
    });
  };

  const itemClickhandler = (e) => {
    CometChatConversationEvents.emit(
      CometChatConversationEvents.onItemClick,
      e
    );
  };

  /**
   * Component hooks
   */

  Hooks(
    conversationType,
    limit,
    tags,
    userAndGroupTags,
    setConversationList,
    conversationCallback,
    conversationListManager,
    loggedInUser,
    handleConversations
  );

  /**
   * Component template scoping
   */

  const getCustomView = (customView, props) => {
    return React.createElement(customView, props);
  };

  const getMessageContainer = () => {
    let messageContainer = null;
    if (
      conversationList.length === 0 &&
      message.toLowerCase() === localize("LOADING")
    ) {
      /**Loading custom view */
      messageContainer = (
        <div
          style={styles.messageContainerStyle(style)}
          className="chats__message"
        >
          {customView.loading ? (
            getCustomView(customView.loading, props)
          ) : (
            <div
              style={styles.messageImgStyle(style, _theme, loadingIconURL)}
              className="message"
            ></div>
          )}
        </div>
      );
    } else if (
      conversationList.length === 0 &&
      message.toLowerCase() === "no chats found"
    ) {
      /**Empty custom view */
      messageContainer = (
        <div
          style={styles.messageContainerStyle(style)}
          className="chats__message"
        >
          {customView.empty ? (
            getCustomView(customView.empty, props)
          ) : (
            <div
              style={styles.messageTextStyle(style, _theme, message)}
              className="message"
            >
              {emptyText}
            </div>
          )}
        </div>
      );
    } else if (!hideError && message.toLowerCase() === "something went wrong") {
      /**Error custom view */
      messageContainer = (
        <div
          style={styles.messageContainerStyle(style)}
          className="chats__message"
        >
          {customView.error ? (
            getCustomView(customView.error, props)
          ) : (
            <div
              style={styles.messageTextStyle(style, _theme, message)}
              className="message"
            >
              {errorText}
            </div>
          )}
        </div>
      );
    }
    return messageContainer;
  };
  const renderItems = conversationList.map((conversation) => {
    const typingIndicatorText = conversation?.typingIndicatorText
      ? conversation?.typingIndicatorText
      : "";
    let isActive =
      conversation?.conversationId === activeConversation?.conversationId
        ? true
        : false;

    /**
     * Calculate conversations options for child component
     */
    let conversationOptions =
      _conversationListItemConfiguration?.conversationOptions;
    if (conversationOptions?.length == 0) {
      conversationOptions = [
        new CometChatConversationOptions({
          id: ConversationOptionConstants.delete,
          title: localize("DELETE"),
          iconURL: deleteIcon,
          onClick: () => confirmDelete(conversation),
        }),
      ];
    }

    return (
      <CometChatConversationListItem
        key={conversation.conversationId}
        conversationObject={conversation}
        isActive={isActive}
        conversationInputData={
          _conversationListItemConfiguration?.conversationInputData
        }
        conversationOptions={conversationOptions}
        style={
          new ConversationListItemStyle({
            ...styles.listItemStyle(style, _theme),
          })
        }
        hideDeletedMessages={
          _conversationListItemConfiguration?.hideDeletedMessages
        }
        hideGroupActions={_conversationListItemConfiguration?.hideGroupActions}
        showTypingIndicator={
          _conversationListItemConfiguration?.showTypingIndicator
        }
        typingIndicatorText={typingIndicatorText}
        hideThreadIndicator={
          _conversationListItemConfiguration?.hideThreadIndicator
        }
        threadIndicatorText={localize("IN_A_THREAD")}
        theme={_theme}
        onClick={itemClickhandler.bind(this)}
        avatarConfiguration={
          _conversationListItemConfiguration?.avatarConfiguration
        }
        statusIndicatorConfiguration={
          _conversationListItemConfiguration?.statusIndicatorConfiguration
        }
        badgeCountConfiguration={
          _conversationListItemConfiguration?.badgeCountConfiguration
        }
        messageReceiptConfiguration={
          _conversationListItemConfiguration?.messageReceiptConfiguration
        }
        loggedInUser={loggedInUser?.current}
      />
    );
  });

  /**
   * Component template
   */
  return (
    <React.Fragment>
      {getMessageContainer()}
      <div
        style={styles.chatsListStyle(style, _theme)}
        className="conversation__list"
        onScroll={handleScroll}
      >
        {renderItems}
      </div>
      <CometChatBackdrop
        isOpen={showConfirm.show}
        onClick={showConfirm.onCancel}
        background={_theme?.palette?.accent200[_theme?.palette?.mode]}
      >
        <CometChatConfirmDialog
          isOpen={showConfirm.show}
          onConfirm={deleteConversation.bind(this, showConfirm.conversation)}
          onCancel={showConfirm.onCancel}
          style={styles.DialogStyle(_theme)}
          title={localize("DELETE_CONVERSATION")}
          messageText={localize("CONFIRM_DELETE_CONVERSATION")}
          confirmButtonText={localize("CONFIRM_BUTTON_TEXT")}
          cancelButtonText={localize("CANCEL_BUTTON_TEXT")}
        />
      </CometChatBackdrop>
    </React.Fragment>
  );
});

/**
 * Component default props
 */
ConversationList.defaultProps = {
  loadingIconURL: loadingIcon,
};

/**
 * Component default props types
 */
ConversationList.propTypes = {
  conversationType: PropTypes.oneOf(["users", "groups", "both"]),
  limit: PropTypes.number,
  hideError: PropTypes.bool,
  tags: PropTypes.array,
  userAndGroupTags: PropTypes.bool,
  emptyText: PropTypes.string,
  errorText: PropTypes.string,
  loadingIconURL: PropTypes.string,
  style: PropTypes.object,
  activeConversation: PropTypes.object,
  enableSoundForMessages: PropTypes.bool,
  customIncomingMessageSound: PropTypes.string,
  customView: PropTypes.object,
  conversationListItemConfiguration: PropTypes.object,
  theme: PropTypes.object,
};

export const CometChatConversationList = React.memo(ConversationList);
