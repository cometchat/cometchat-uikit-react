import React from "react";
import PropTypes from "prop-types";

import { localize } from "../../../";
import { getExtensionsData, metadataKey, CometChatMessageEvents } from "../../";
import { CometChatMessageReactionListItem } from "../";

import {
	messageReactionListStyle,
    messageAddReactionStyle,
    emojiButtonStyle,
} from "./style";

import reactIcon from "./resources/reactions.svg";

const CometChatMessageReactions = (props) => {

	const [reactionList, setReactionList] = React.useState([]);

	const reactToMessage = React.useCallback(() => {
		//CometChatEvent.triggerHandler(enums.EVENTS["REACT_TO_MESSAGE"], props.messageObject);
		CometChatMessageEvents.emit(CometChatMessageEvents.onMessageReaction, props.messageObject);
	}, [props.messageObject]);

	const getAddReactionButton = React.useCallback(() => {
		return (
			<div key="-1" style={messageAddReactionStyle(props)} className="reaction reaction__add" title={localize("ADD_REACTION")}>
				<button type="button" style={emojiButtonStyle(reactIcon, props)} className="button__reacttomessage" onClick={reactToMessage}>
					<i></i>
				</button>
			</div>
		);
	}, [props, reactToMessage]);

	React.useEffect(() => {
		const reaction = getExtensionsData(props.messageObject, metadataKey.extensions.reactions);
		/**
		 * If message reaction extension is enabled
		 */
		if (reaction) {
			const messageReactions = Object.keys(reaction).map(data => {
				const reactionData = reaction[data];
				const reactionObject = { [data]: reactionData };
				let textColor = "#141414";
				let borderColor = "transparent";
				let backgroundColor = "#F0F0F0";
				if (reactionData.hasOwnProperty(props.loggedInUser?.uid)) {
					textColor = "#3399ff";
					borderColor = "#3399ff";
					backgroundColor = "#F0F0F0";
				}

				return (
					<CometChatMessageReactionListItem
						key={data}
						borderWidth="1px"
						borderStyle="solid"
						borderColor={borderColor}
						textColor={textColor}
						backgroundColor={backgroundColor}
						textFont={props.textFont}
						loggedInUser={props.loggedInUser}
						messageId={props.messageObject.id}
						reactionObject={reactionObject}
					/>
				);
			});

			/**
			 * Add reaction button
			 */
			messageReactions.push(getAddReactionButton());
			setReactionList(messageReactions);
		}
	}, [props.messageObject, props.loggedInUser, getAddReactionButton, props.textFont]);

	if(!reactionList.length) {
		return null;
	}

	return <div className="message_kit__reaction_bar" style={messageReactionListStyle()}>{reactionList}</div>;
}

// Specifies the default values for props:
CometChatMessageReactions.defaultProps = {
	language: "en",
	actionGenerated: () => {},
	border: "1px solid rgba(20, 20, 20, 8%)",
	background: "#F0F0F0",
	text: "",
	textColor: "#fff",
	textFont: "700 11px Inter",
	messageObject: null,
};

CometChatMessageReactions.propTypes = {
	language: PropTypes.string,
	actionGenerated: PropTypes.func.isRequired,
	border: PropTypes.string,
	background: PropTypes.string,
	text: PropTypes.string,
	textColor: PropTypes.string,
	textFont: PropTypes.string,
	messageObject: PropTypes.object.isRequired,
};

export { CometChatMessageReactions };