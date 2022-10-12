import React from "react";
import { CometChat } from "@cometchat-pro/chat";

export const Hooks = (props, setLoggedInUser) => {
  React.useEffect(() => {
    CometChat.getLoggedinUser().then(
      (user) => {
        setLoggedInUser(user);
      },
      (error) => {
        alert(error);
      }
    );
  }, []);
};
