import React from "react";
import { CometChat } from "@cometchat-pro/chat";

function hooks(props, setLoggedInUser, setError) {
  React.useEffect(() => {
    CometChat.getLoggedinUser()
      .then((user) => {
        setLoggedInUser(user);
      })
      .catch((error) => setError("SOMETHING_WRONG"));
  }, []);
}

export { hooks };
