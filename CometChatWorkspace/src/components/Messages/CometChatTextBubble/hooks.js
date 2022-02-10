import React from "react";

export const Hooks = (props, setName, setAvatar) => {
    
    React.useEffect(() => {
		if (props.userName && props.userName.length) {
			setName(props.userName);
		} else if (props.messageObject 
			&& props.messageObject.sender 
			&& props.messageObject.sender.name) {
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
}