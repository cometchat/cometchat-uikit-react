import React from "react";
import { ReceiverTypeConstants } from "../../Shared";

export const Hooks = (messageObject, setChatWith, setChatWithId) => {

	React.useEffect(() => {

		/**
		 * Sets receiver id and receiver type
		 */
		if (messageObject?.receiverType === ReceiverTypeConstants.user) {
			setChatWithId(messageObject?.sender?.uid)
			setChatWith(ReceiverTypeConstants.user);
		} else {
			setChatWithId(messageObject?.receiverId);
			setChatWith(ReceiverTypeConstants.group);
			
		}
	}, [setChatWith, setChatWithId, messageObject]);
};
