import React from "react";
import PropTypes from "prop-types";
//import dateFormat from "dateformat";

import { CometChatAvatar, localize } from "../../";
import { CometChatMessageReceiverType } from "../";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    messageTxtStyle,
    messageInfoWrapperStyle,
    messageTimeStampStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle
} from "./style";

const CometChatDeletedMessageBubble = (props) => {

    let message = null;
    const messageDate = props.messageObject.sentAt * 1000;
    if (props.messageObject?.sender?.uid === props.loggedInUser?.uid) {

		message = (
			<React.Fragment>
				<div style={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
					<p style={messageTxtStyle()} className="message__txt">
						{localize("YOU_DELETED_THIS_MESSAGE")}
					</p>
				</div>
				<div style={messageInfoWrapperStyle(props)} className="message__info__wrapper">
					<span style={messageTimeStampStyle()} className="message__timestamp">
						{/* {dateFormat(messageDate, "shortTime")} */}
					</span>
				</div>
			</React.Fragment>
		);

	} else {

		let avatar = null,
			name = null;
		if (props.messageObject.receiverType === CometChatMessageReceiverType.group) {
			avatar = (
				<div style={messageThumbnailStyle()} className="message__thumbnail">
					<CometChatAvatar user={props.messagObject?.sender} />
				</div>
			);
			name = (
				<div style={nameWrapperStyle(props)} className="message__name__wrapper">
					<span style={nameStyle()} className="message__name">
						{props.messagObject?.sender?.name}
					</span>
				</div>
			);
		}

		message = (
			<React.Fragment>
				{avatar}
				<div style={messageDetailStyle(props)} className="message__details">
					{name}
					<div style={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
						<p style={messageTxtStyle()} className="message__txt">
							{localize("THIS_MESSAGE_DELETED")}
						</p>
					</div>
					<div style={messageInfoWrapperStyle(props)} className="message__info__wrapper">
						<span style={messageTimeStampStyle()} className="message__timestamp">
							{/* {dateFormat(messageDate, "shortTime")} */}
						</span>
					</div>
				</div>
			</React.Fragment>
		);
	}

    return (
        <div style={messageContainerStyle(props)} className="message__deleted">
            <div style={messageWrapperStyle(props)} className="message__wrapper">{message}</div>                            
        </div>
    )
}

// Specifies the default values for props:
CometChatDeletedMessageBubble.defaultProps = {
	loggedInUser: null,
	messagObject: {},
};

CometChatDeletedMessageBubble.propTypes = {
	loggedInUser: PropTypes.object.isRequired,
	messagObject: PropTypes.object.isRequired,
};

export { CometChatDeletedMessageBubble };