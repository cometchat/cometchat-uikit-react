import React from "react";

export const Hooks = (props, setName, setAvatar, setStickerURL) => {

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
		if (props.stickerURL && props.stickerURL.length) {
			setStickerURL(props.stickerURL);
		} else if (props.messageObject) {
			if (props.messageObject.data && props.messageObject.data.customData && props.messageObject.data.customData.sticker_url) {
				setStickerURL(props.messageObject.data.customData.sticker_url);
			}
		}
	}, [props.stickerURL, props.messageObject, setStickerURL]);
};