import * as React from "react";
import PropTypes from "prop-types";
import dateFormat from "dateformat";

import { timeStyle } from "./style";

const CometChatDate = props => {
	const setDate = () => {
		let messageDate = null;
		switch (props.timeFormat) {
			case "CONVERSATION_LIST":
				messageDate = getMessageTime(props.time);
				break;
			case "MESSAGE_LIST":
				messageDate = getMessageTime(props.time);
				break;
			case "MESSAGE_BUBBLE":
				messageDate = getMessageTime(props.time);
				break;
			case "CALL_LIST":
				break;
			default:
				break;
		}

		return messageDate;
	};

	const getMessageTime = messageDate => {
		//const messageTimestamp = new Date(messageDate) * 1000;
		return dateFormat(new Date(messageDate) * 1000, "shortTime");
	};

	return <span style={timeStyle(props)}>{setDate()}</span>;
};

CometChatDate.defaultProps = {
	time: 0,
	timeFont: "500 11px Inter",
	timeColor: "rgba(20, 20, 20, 40%)",
	timeFormat: "MESSAGE_BUBBLE",
	backgroundColor: "transparent",
	cornerRadius: null,
};

CometChatDate.propTypes = {
	time: PropTypes.number.isRequired,
	timeFont: PropTypes.string.isRequired,
	timeColor: PropTypes.string.isRequired,
	timeFormat: PropTypes.oneOf(["CONVERSATION_LIST", "MESSAGE_LIST", "MESSAGE_BUBBLE", "CALL_LIST"]).isRequired,
	backgroundColor: PropTypes.string.isRequired,
	cornerRadius: PropTypes.string,
};

export { CometChatDate };
