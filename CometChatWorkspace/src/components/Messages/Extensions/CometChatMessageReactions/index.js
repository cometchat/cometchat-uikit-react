import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { Emoji } from "emoji-mart";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatContext } from "../../../../util/CometChatContext";
import * as enums from "../../../../util/enums.js";
import { checkMessageForExtensionsData } from "../../../../util/common";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import {
    messageReactionsStyle,
    reactionCountStyle,
    emojiButtonStyle,
} from "./style";

import reactIcon from "./resources/reactions.svg";

class CometChatMessageReactions extends React.Component {
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);
		this.state = {
			enableMessageReaction: false,
		};

		this.context.getLoggedinUser().then(user => {
			this.loggedInUser = { ...user };
		});
	}

	componentDidMount() {
		this.enableMessageReaction();
	}

	enableMessageReaction = () => {
		/**
		 * If reacting to messages feature is disabled
		 */
		this.context.FeatureRestriction.isReactionsEnabled()
			.then(response => {
				if (response !== this.state.enableMessageReaction) {
					this.setState({ enableMessageReaction: response });
				}
			})
			.catch(error => {
				if (this.state.enableMessageReaction !== false) {
					this.setState({ enableMessageReaction: false });
				}
			});
	};

	reactToMessages = emoji => {

		CometChat.callExtension("reactions", "POST", "v1/react", {
			msgId: this.props.message.id,
			emoji: emoji.colons,
		}).then(response => {
			// Reaction failed
			if (response.hasOwnProperty("success") === false || (response.hasOwnProperty("success") && response["success"] === false)) {
				this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
			}
		})
		.catch(error => this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG"));
	};

	triggerEmojiClick = event => {
		event.stopPropagation();
		event.currentTarget.querySelector(".emoji-mart-emoji").click();
	};

	getMessageReactions = reaction => {
		
		if (reaction === null) {
			return null;
		}

		const messageReactions = Object.keys(reaction).map((data, key) => {
			const reactionData = reaction[data];
			const reactionName = data.replaceAll(":", "");
			const reactionCount = Object.keys(reactionData).length;

			if (!reactionCount) {
				return null;
			}

			const userList = [];
			let reactionTitle = "";

			for (const user in reactionData) {
				userList.push(reactionData[user]["name"]);
			}

			if (userList.length) {
				reactionTitle = userList.join(", ");
				const str = ` ${Translator.translate("REACTED", this.context.language)}`;
				reactionTitle = reactionTitle.concat(str);
			}

			const reactionClassName = `reaction reaction__${reactionName}`;
			return (
				<div key={key} css={messageReactionsStyle(this.props, reactionData, this.context, this.loggedInUser)} className={reactionClassName} title={reactionTitle} onClick={this.triggerEmojiClick}>
					<Emoji emoji={{ id: reactionName }} size={16} native onClick={this.reactToMessages} />
					<span css={reactionCountStyle(this.context)} className="reaction__count">
						{reactionCount}
					</span>
				</div>
			);
		});

		return messageReactions;
	};

	addMessageReaction = () => {
		//If reacting to messages feature is disabled
		if (this.state.enableMessageReaction === false) {
			return null;
		}

		const addReactionEmoji = (
			<div key="-1" css={messageReactionsStyle(this.props, {}, this.context)} className="reaction reaction__add" title={Translator.translate("ADD_REACTION", this.context.language)}>
				<button type="button" css={emojiButtonStyle(reactIcon, this.context)} className="button__reacttomessage" onClick={() => this.props.actionGenerated(enums.ACTIONS["REACT_TO_MESSAGE"], this.props.message)}>
					<i></i>
				</button>
			</div>
		);

		return addReactionEmoji;
	};

	render() {
		const reaction = checkMessageForExtensionsData(this.props.message, "reactions");
		const messageReactions = this.getMessageReactions(reaction);

		const addReactionEmoji = this.addMessageReaction();

		if (messageReactions !== null && messageReactions.length && addReactionEmoji !== null) {
			if (this.props.message?.sender?.uid !== this.loggedInUser?.uid) {
				messageReactions.push(addReactionEmoji);
			} else {
				messageReactions.unshift(addReactionEmoji);
			}
		}

		return messageReactions;
	}
}

// Specifies the default values for props:
CometChatMessageReactions.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatMessageReactions.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatMessageReactions };
