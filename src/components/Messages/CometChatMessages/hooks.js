import React from "react";
import { CometChat } from "@cometchat-pro/chat";

export const Hooks = (
  props,
  loggedInUser,
  errorHandler,
  messagesCallback,
  messagesManager
) => {
  React.useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => {
        loggedInUser.current = user;
        messagesManager.current?.attachListeners(messagesCallback);
      })
      .catch((error) => errorHandler(error));
  }, [messagesCallback]);
};
