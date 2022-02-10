import React from "react";
import PropTypes from "prop-types";

import { Emoji } from "emoji-mart";
import { CometChat } from "@cometchat-pro/chat";

import { localize } from "../../../";
import { CometChatMessageEvents } from "../../";


import { messageReactionsStyle, reactionCountStyle } from "./style";

const CometChatMessageReactionListItem = props => {
	const [reactionCount, setReactionCount] = React.useState(0);

	React.useEffect(() => {
		if (props.text) {
			setReactionCount(props.text);
		} else {
			setReactionCount(Object.keys(props.reactionObject).length);
		}
	}, [props.text, props.reactionObject]);

	const reactToMessages = (emoji, event) => {
		CometChat.callExtension("reactions", "POST", "v1/react", {
			msgId: props.messageId,
			emoji: emoji.colons,
		})
		.then(response => {
			/**
			 * When reacting to a message fails
			 */
			if (response.hasOwnProperty("success") === false || (response.hasOwnProperty("success") && response["success"] === false)) {
				CometChatMessageEvents.emit(CometChatMessageEvents.onMessageReactionError, response);
			}
		})
		.catch(error => {

			CometChatMessageEvents.emit(CometChatMessageEvents.onMessageReactionError, error);
		} );

		event.stopPropagation();
	};

	let reactionName = "";
	const userList = [];

	for (const reaction in props.reactionObject) {
		reactionName = reaction.replaceAll(":", "");

		const reactionData = props.reactionObject[reaction];
		for (const user in reactionData) {
			userList.push(reactionData[user]["name"]);
		}
	}

	let reactionTitle = "";
	if (userList.length) {
		reactionTitle = userList.join(", ");
		//const str = `${localize("REACTED")}`;
		reactionTitle = reactionTitle.concat(localize("REACTED"));
	}

	const reactionClassName = `reaction reaction__${reactionName}`;

	return (
		<div style={messageReactionsStyle(props)} className={reactionClassName} title={reactionTitle}>
			<Emoji emoji={{ id: reactionName }} size={18} native onClick={reactToMessages} />
			<span style={reactionCountStyle(props)} className="reaction__count">
				{reactionCount}
			</span>
		</div>
	);
};

// Specifies the default values for props:
CometChatMessageReactionListItem.defaultProps = {
	language: "en",
	border: "1px solid rgba(20, 20, 20, 8%)",
	background: "#F0F0F0",
	text: "",
	textColor: "#fff",
	textFont: "11px Inter",
	loggedInUser: null,
	messageId: null,
	reactionObject: null,
};

CometChatMessageReactionListItem.propTypes = {
	language: PropTypes.string,
	border: PropTypes.string,
	text: PropTypes.string.isRequired,
	textColor: PropTypes.string,
	textFont: PropTypes.string,
	background: PropTypes.string,
	loggedInUser: PropTypes.object,
	messageId: PropTypes.string.isRequired,
	reactionObject: PropTypes.object.isRequired,
};

export { CometChatMessageReactionListItem };
