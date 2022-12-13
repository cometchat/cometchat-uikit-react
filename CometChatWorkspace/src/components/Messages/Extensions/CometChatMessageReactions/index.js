import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
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
import { Emojis } from "./EmojiMapping";

class CometChatMessageReactions extends React.Component {
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);
		this._isMounted = false;
		this.state = {
			enableMessageReaction: false,
		};

		this.context.getLoggedinUser().then((user) => {
			this.loggedInUser = { ...user };
		});
	}

	componentDidMount() {
		this._isMounted = true;
		this.enableMessageReaction();
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	enableMessageReaction = () => {
		/**
		 * If reacting to messages feature is disabled
		 */
		this.context.FeatureRestriction.isReactionsEnabled()
			.then((response) => {
				if (response !== this.state.enableMessageReaction && this._isMounted) {
					this.setState({ enableMessageReaction: response });
				}
			})
			.catch((error) => {
				if (this.state.enableMessageReaction !== false) {
					this.setState({ enableMessageReaction: false });
				}
			});
	};

	reactToMessages = (emoji) => {
		let messageObject = { ...this.props.message };
		delete messageObject["metadata"]["@injected"]["extensions"]["reactions"][
			emoji
		][this.loggedInUser.uid];
		this.props.actionGenerated(enums.ACTIONS["MESSAGE_EDITED"], messageObject);

		CometChat.callExtension("reactions", "POST", "v1/react", {
			msgId: this.props.message.id,
			emoji: emoji,
		})
			.then((response) => {
				// Reaction failed
				if (!response || !response.success || response.success !== true) {
					this.props.actionGenerated(
						enums.ACTIONS["ERROR"],
						[],
						"SOMETHING_WRONG"
					);
				}
			})
			.catch((error) => {
				this.props.actionGenerated(
					enums.ACTIONS["ERROR"],
					[],
					"SOMETHING_WRONG"
				);
			});
	};

	getMessageReactions = (reaction) => {
		if (reaction === null) {
			return null;
		}

		const messageReactions = Object.keys(reaction).map((data, key) => {
			const reactionData = reaction[data];
			let reactionName = data.replaceAll(":", "");
			const reactionCount = Object.keys(reactionData).length;

			/**Showing "?" instead of unknown :emoji_name: */
			if (data.includes(":")) {
				reactionName = Emojis[reactionName] ?? "?";
			}

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
				const str = ` ${Translator.translate(
					"REACTED",
					this.context.language
				)}`;
				reactionTitle = reactionTitle.concat(str);
			}

			const reactionClassName = `reaction reaction__${reactionName}`;
			return (
				<div
					key={key}
					css={messageReactionsStyle(
						this.props,
						reactionData,
						this.context,
						this.loggedInUser
					)}
					onClick={this.reactToMessages.bind(this, reactionName)}
					className={reactionClassName}
					title={reactionTitle}
				>
					<div className='emoji'>{reactionName}</div>
					<span
						css={reactionCountStyle(this.context)}
						className='reaction__count'
					>
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
			<div
				key='-1'
				css={messageReactionsStyle(this.props, {}, this.context)}
				className='reaction reaction__add'
				title={Translator.translate("ADD_REACTION", this.context.language)}
			>
				<button
					type='button'
					css={emojiButtonStyle(reactIcon, this.context)}
					className='button__reacttomessage'
					onClick={() =>
						this.props.actionGenerated(
							enums.ACTIONS["REACT_TO_MESSAGE"],
							this.props.message
						)
					}
				>
					<i></i>
				</button>
			</div>
		);

		return addReactionEmoji;
	};

	render() {
		const reaction = checkMessageForExtensionsData(
			this.props.message,
			"reactions"
		);
		const messageReactions = this.getMessageReactions(reaction);

		const addReactionEmoji = this.addMessageReaction();

		if (
			messageReactions !== null &&
			messageReactions.length &&
			addReactionEmoji !== null
		) {
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
