import React from "react";
import { metadataKey, getExtensionsData } from "../../";

export const Hooks = (props, setName, setAvatar, setWhiteboardURL) => {
	React.useEffect(() => {
		if (props.userName && props.userName.length) {
			setName(props.userName);
		} else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
			setName(props.messageObject.sender.name);
		}
	}, [props.userName, props.messageObject, setName]);

	React.useEffect(() => {
		if (props.avatar && props.avatar.length) {
			setAvatar(props.avatar);
		} else if (props.messageObject && props.messageObject.sender) {
			setAvatar(props.messageObject.sender);
		}
	}, [props.avatar, props.messageObject, setAvatar]);

	React.useEffect(() => {
		if (props.whiteboardURL && props.whiteboardURL.length) {
			setWhiteboardURL(props.whiteboardURL);
		} else if (props.messageObject) {
			const whiteboardData = getExtensionsData(props.messageObject, metadataKey.extensions.whiteboard);
			if (whiteboardData && whiteboardData.board_url && whiteboardData.board_url.trim().length) {
				// Appending the username to the board_url
				const username = props.loggedInUser?.name.split(" ").join("_");
				setWhiteboardURL(whiteboardData.board_url + "&username=" + username);
			}
		}
	}, [props.whiteboardURL, props.messageObject, props.loggedInUser, setWhiteboardURL]);
};