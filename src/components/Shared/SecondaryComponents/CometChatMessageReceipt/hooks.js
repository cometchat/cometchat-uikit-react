import React from "react";

export const Hooks = (props, setIcon) => {
    
	React.useEffect(() => {
		if (props.messageObject.error) {
			setIcon(props.messageErrorIcon);
		} else {
			
			if (props.messageObject?.readAt) {
				setIcon(props.messageReadIcon);
			} else if (props.messageObject?.deliveredAt) {

				setIcon(props.messageDeliveredIcon);
			} else if (props.messageObject?.sentAt) {
				setIcon(props.messageSentIcon);
			} else {
				setIcon(props.messageWaitIcon);
			}
		}
	}, [
        props.messageObject, 
        props.messageErrorIcon, 
        props.messageReadIcon, 
        props.messageDeliveredIcon, 
        props.messageSentIcon, 
        props.messageWaitIcon,
        setIcon
    ]);
};