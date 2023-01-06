import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import { ReceiverTypeConstants, localize } from "../..";
import { MessageListManager } from "./controller";
import { getDefaultTypes } from "../CometChatMessageTemplate";

export const fetchMessages = (MessageListManager) => {
  return new Promise((resolve, reject) => {
    MessageListManager.fetchPreviousMessages()
      .then((messageList) => resolve(messageList))
      .catch((error) => reject(error));
  });
};

export const Hooks = (
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
  messageHandler,
  messageListCallback,
  messageTypesRef,
  messageCategoryRef,
  messageListManagerRef,
  localize,
  errorHandler,
  chatWithRef,
  chatWithTypeRef,
  setMessageCount,
  setnewMessage
) => {
  React.useEffect(() => {
    //fetching logged in user
    CometChat.getLoggedinUser()
      .then((user) => {
        loggedInUserRef.current = { ...user };

        // 	// Setting MessageList ManagerRef if messageTypes is supplied by the user
        if (messageTypes) {
          if (messageTypes.length === 0) {
            return (
              (messageCategoryRef.current = []),
              (messageTypesRef.current = []),
              setDecoratorMessage(localize("NO_MESSAGE_TYPE_SET"))
            );
          } else {
            messageTypesRef.current = messageTypes.map((value) => {
              return value.type;
            });
            messageCategoryRef.current = [
              ...new Set(
                messageTypes.map((value) => {
                  return value.category;
                })
              ),
            ];
            if (excludeMessageTypes && excludeMessageTypes.length) {
              messageTypesRef.current.filter(
                (val) => !excludeMessageTypes?.includes(val)
              );
            }
          }
        }
        // Setting MessageList ManagerRef by default
        else {
          const messageTemplateObject = getDefaultTypes();
          messageTypesRef.current = messageTemplateObject.map((value) => {
            return value.type;
          });
          messageCategoryRef.current = [
            ...new Set(
              messageTemplateObject.map((value) => {
                return value.category;
              })
            ),
          ];
          if (excludeMessageTypes && excludeMessageTypes.length) {
            messageTypesRef.current = messageTypesRef.current.filter(
              (val) => !excludeMessageTypes?.includes(val)
            );
          }
        }

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

        messageListManagerRef?.current?.attachListeners(messageListCallback);
        setMessageList([]);

        // Fetch MessageList
        fetchMessages(messageListManagerRef?.current)
          .then((messages) => {
            if (messageList.length === 0 && messages.length === 0) {
              setDecoratorMessage(localize("NO_MESSAGES_FOUND"));
            } else {
              setMessageCount(messages.length);
              setMessageList(messages);
              setDecoratorMessage("");
              messageHandler(messages, true);
            }
          })
          .catch((error) => {
            errorHandler(error);
            setDecoratorMessage(localize("SOMETHING_WRONG"));
          });
      })
      .catch((error) => {
        errorHandler(error);

        setDecoratorMessage(localize("SOMETHING_WRONG"));
      });
  }, []);

  // Update MessageList on change of props
  React.useEffect(() => {
    setnewMessage([]);
    if (messageTypes) {
      if (messageTypes.length === 0) {
        return (
          (messageCategoryRef.current = []),
          (messageTypesRef.current = []),
          setDecoratorMessage(localize("NO_MESSAGE_TYPE_SET"))
        );
      } else {
        messageTypesRef.current = messageTypes.map((value) => {
          return value.type;
        });
        messageCategoryRef.current = [
          ...new Set(
            messageTypes.map((value) => {
              return value.category;
            })
          ),
        ];
        if (excludeMessageTypes && excludeMessageTypes.length) {
          messageTypesRef.current = messageTypesRef.current.filter(
            (val) => !excludeMessageTypes?.includes(val)
          );
        }
      }
    }

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

    setMessageList([]);

    fetchMessages(messageListManagerRef?.current)
      .then((messages) => {
        if (messageList.length === 0 && messages.length === 0) {
          setDecoratorMessage(localize("NO_MESSAGES_FOUND"));
        } else {
          setMessageCount(messages.length);
          setMessageList(() => {
            return [...messages];
          });
          setDecoratorMessage("");
        }
        messageHandler(messages, true);
      })
      .catch((error) => {
        errorHandler(error);

        setDecoratorMessage(localize("SOMETHING_WRONG"));
      });

    return () => {
      setMessageList([]);
      if (
        messageListManagerRef &&
        messageListManagerRef.current &&
        typeof messageListManagerRef.current.removeListeners === "function"
      ) {
        messageListManagerRef.current?.removeListeners();
      }
    };
  }, [
    limit,
    tags,
    onlyUnread,
    user,
    group,
    messageTypes,
    hideDeletedMessages,
    hideMessagesFromBlockedUsers,
  ]);

  //set receiver and receiver type
  React.useEffect(() => {
    //set receiver and receiver type
    if (user && user.uid) {
      chatWithTypeRef.current = ReceiverTypeConstants.user;
      chatWithRef.current = user;
    } else if (group && group.guid) {
      chatWithTypeRef.current = ReceiverTypeConstants.group;
      chatWithRef.current = group;
    }
  }, []);

  //update receiver and receiver type
  React.useEffect(() => {
    if (user && user.uid) {
      chatWithTypeRef.current = ReceiverTypeConstants.user;
      chatWithRef.current = user;
    } else if (group && group.guid) {
      chatWithTypeRef.current = ReceiverTypeConstants.group;
      chatWithRef.current = group;
    }
  }, [user, group, chatWithTypeRef, chatWithRef]);
};
