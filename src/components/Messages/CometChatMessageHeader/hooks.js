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
  setChatWith,
  setChatWithType,
  setMessageHeaderStatus,
  setUserPresence,
  messageHeaderManager,
  messageHeaderCallback,
  handlers,
  callbackData,
  errorHandler
) => {
  //fetch logged in user
  React.useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => {
        loggedInUser.current = user;
        messageHeaderManager.current?.attachListeners(messageHeaderCallback);
      })
      .catch(error => errorHandler(error));
  }, []);

  const updateMessageHeaderStatusForUser = React.useCallback(
    (user) => {
      if (user.status === UserStatusConstants.offline) {
        setMessageHeaderStatus(localize("OFFLINE"));
        setUserPresence(UserStatusConstants.offline);
      } else if (user.status === UserStatusConstants.online) {
        setMessageHeaderStatus(localize("ONLINE"));
        setUserPresence(UserStatusConstants.online);
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
        setChatWithType(CometChatMessageReceiverType.user);
        setChatWith(props.user);
        updateMessageHeaderStatusForUser(props.user);
      } else {
        getUser(props.user.uid).then((user) => {
          setChatWithType(CometChatMessageReceiverType.user);
          setChatWith(user);
          updateMessageHeaderStatusForUser(user);
        }).catch(error => errorHandler(error));
      }
    } else if (props.group && props.group.guid) {
      if (props.group.name) {
        setChatWithType(CometChatMessageReceiverType.group);
        setChatWith(props.group);
        updateMessageHeaderStatusForGroup(props.group);
      } else {
        getGroup(props.group.guid).then((group) => {
          setChatWithType(CometChatMessageReceiverType.group);
          setChatWith(group);
          updateMessageHeaderStatusForGroup(group);
        }).catch(error => errorHandler(error));
      }
    }
  }, [
    props.user,
    props.group,
    setChatWith,
    setChatWithType,
    updateMessageHeaderStatusForUser,
    updateMessageHeaderStatusForGroup,
  ]);

  React.useEffect(() => {
    const handler = handlers[callbackData?.name];
    if (handler) return handler(...callbackData?.args);
  }, [callbackData, handlers]);
};
