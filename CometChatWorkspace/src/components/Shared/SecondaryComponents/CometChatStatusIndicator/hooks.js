import React from "react";
import { CometChat } from "@cometchat-pro/chat";

export const Hooks = (setColor, props) => {

	React.useEffect(() => {

		// if (props.customBackgroundColor.trim().length) {
		// 	setColor(props.customBackgroundColor.trim());
		// } else 
		
		if (props.status.trim().length) {
			if (props.status === CometChat.USER_STATUS.ONLINE) {
				setColor(props.onlineBackgroundColor);
			} else if (props.status === CometChat.USER_STATUS.OFFLINE) {
				setColor(props.offlineBackgroundColor);
			} else {
				setColor(props.status.trim());
			}
		}
	}, [props, setColor]);
};
