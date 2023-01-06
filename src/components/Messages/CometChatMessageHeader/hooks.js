import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageReceiverType } from "..";
import { CometChatDate, localize, UserStatusConstants } from "../..";

const getUser = (uid) => {
  return new Promise((resolve, reject) => {
    CometChat.getUser(uid)
      .then((user) => resolve(user))
      .catch((error) => reject(error));
  });
};

const getGroup = (guid) => {
  return new Promise((resolve, reject) => {
    CometChat.getGroup(guid)
      .then((group) => resolve(group))
      .catch((error) => reject(error));
  });
};

export const Hooks = (
  props,
  loggedInUser,
  chatWithRef,
  chatWithTypeRef,
  setMessageHeaderStatus,
  setUserPresence,
  messageHeaderManager,
  messageHeaderCallback,
  errorHandler
) => {
  //fetch logged in user
  React.useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => {
        loggedInUser.current = user;
        messageHeaderManager.current?.attachListeners(messageHeaderCallback);
      })
      .catch((error) => errorHandler(error));
  }, []);

  const updateMessageHeaderStatusForUser = React.useCallback(
    (user) => {
      if (user.status === UserStatusConstants.offline) {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(false);
      } else if (user.status === UserStatusConstants.online) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(true);
      }
    },
    [setMessageHeaderStatus, setUserPresence]
  );

  const updateMessageHeaderStatusForGroup = React.useCallback(
    (group) => {
      const status = `${group.membersCount} ${localize("MEMBERS")}`;
      setMessageHeaderStatus(status);
      //setUserPresence(CometChat.USER_STATUS.OFFLINE);
    },
    [setMessageHeaderStatus]
  );

  //update receiver user
  React.useEffect(() => {
    if (props.user && props.user.uid) {
      if (props.user.name) {
        chatWithTypeRef.current = CometChatMessageReceiverType.group;
        chatWithRef.current=props.group;
        updateMessageHeaderStatusForUser(props.user);
      } else {
        getUser(props.user.uid)
          .then((user) => {
            chatWithTypeRef.current = CometChatMessageReceiverType.group;
            chatWithRef.current = user;
            updateMessageHeaderStatusForUser(user);
          })
          .catch((error) => errorHandler(error));
      }
    } else if (props.group && props.group.guid) {
      if (props.group.name) {
        chatWithTypeRef.current = CometChatMessageReceiverType.group;
        chatWithRef.current=props.group;
        updateMessageHeaderStatusForGroup(props.group);
      } else {
        getGroup(props.group.guid)
          .then((group) => {
            chatWithTypeRef.current = CometChatMessageReceiverType.group;
            chatWithRef.current=group;
            updateMessageHeaderStatusForGroup(group);
          })
          .catch((error) => errorHandler(error));
      }
    }
  }, [
    props,
    props.user,
    props.group,
    chatWithRef,
    chatWithTypeRef,
    updateMessageHeaderStatusForUser,
    updateMessageHeaderStatusForGroup,
  ]);

};
