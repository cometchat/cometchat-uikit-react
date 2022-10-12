import React from "react";
import PropTypes from "prop-types";
import { MessageReceiptStyles } from "../../../Shared";
import { Hooks } from "./hooks";
import { iconStyle } from "./style";
import waiting from "./resources/wait.svg";
import greyTick from "./resources/message-sent.svg";
import greyDoubleTick from "./resources/message-delivered.svg";
import blueDoubleTick from "./resources/message-read.svg";
import errorTick from "./resources/warning-small.svg";

const CometChatMessageReceipt = props => {


	const [icon, setIcon] = React.useState(null);

	Hooks(props, setIcon);

	if (!icon) {
		return null;
	}

	return <i className="message__receipt" style={iconStyle(props, icon)}></i>;
};


/**
 * Component default props
 */
CometChatMessageReceipt.propTypes = {
	messageWaitIcon: PropTypes.string,
	messageSentIcon: PropTypes.string,
	messageDeliveredIcon: PropTypes.string,
	messageReadIcon: PropTypes.string,
	messageErrorIcon: PropTypes.string,
	messageObject: PropTypes.object,
	style: PropTypes.object
};


/**
 * Component default props values
 */
CometChatMessageReceipt.defaultProps = {
	messageWaitIcon: waiting,
	messageSentIcon: greyTick,
	messageDeliveredIcon: greyDoubleTick,
	messageReadIcon: blueDoubleTick,
	messageErrorIcon: errorTick,
	messageObject: null,
};

export { CometChatMessageReceipt };