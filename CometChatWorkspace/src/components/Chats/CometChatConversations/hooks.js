import React from "react";
import { CometChat } from "@cometchat-pro/chat";

export const Hooks = (setUser) => {

    React.useEffect(() => {

		CometChat.getLoggedinUser()
			.then(user => setUser(user))

	}, [])
};