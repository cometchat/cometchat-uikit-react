import React from "react";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageReceiverType } from "..";

export const Hooks = (
  props,
  setLoggedInUser,
  setChatWith,
  setChatWithId,
  chatRef
) => {
  //fetch logged in user
  React.useEffect(() => {
    CometChat.getLoggedinUser().then((user) => setLoggedInUser(user));
  }, []);

  React.useEffect(() => {
    //update receiver user
    if (props.user && props.user.uid) {
      chatRef.current = {
        chatWith: CometChatMessageReceiverType.user,
        chatWithId: props.user.uid,
      };

      setChatWith(CometChatMessageReceiverType.user);
      setChatWithId(props.user.uid);
    } else if (props.group && props.group.guid) {
      chatRef.current = {
        chatWith: CometChatMessageReceiverType.group,
        chatWithId: props.group.guid,
      };

      setChatWith(CometChatMessageReceiverType.group);
      setChatWithId(props.group.guid);
    }
  }, [props.user, props.group, setChatWith, setChatWithId, chatRef]);
};
