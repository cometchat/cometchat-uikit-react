import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import * as enums from "../../../util/enums.js";
import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	messageActionStyle,
	actionGroupStyle,
	groupButtonStyle,
} from "./style";

import startThreadIcon from "./resources/threaded-message.svg";
import deleteIcon from "./resources/delete.svg";
import editIcon from "./resources/edit.svg";
import reactIcon from "./resources/reactions.svg";
import translateIcon from "./resources/message-translate.svg";
import sendMessageInPrivateIcon from "./resources/send-message-in-private.svg";

class CometChatMessageActions extends React.PureComponent {
	static contextType = CometChatContext;

	constructor(props, context) {
		super(props, context);

		this.state = {
			loggedInUser: null,
			enableMessageReaction: false,
			enableThreadedChats: false,
			enableDeleteMessage: false,
			enableEditMessage: false,
			enableTranslateMessage: false,
			enableMessageInPrivate: false,
			enableDeleteMessageForModerator: false,
		};
	}

	componentDidMount() {
		this.context
			.getLoggedinUser()
			.then((user) => {
				this.setState({ loggedInUser: { ...user } });
			})
			.then(() => {
				this.enableMessageReaction();
				this.enableThreadedChats();
				this.enableDeleteMessage();
				this.enableDeleteMessageForModerator();
				this.enableEditMessage();
				this.enableTranslateMessage();
				this.enableMessageInPrivate();
			});
	}

	toggleTooltip = (event, flag) => {
		const elem = event.target;

		if (flag) {
			elem.setAttribute("title", elem.dataset.title);
		} else {
			elem.removeAttribute("title");
		}
	};

	enableMessageReaction = () => {
		/**
		 * If reacting to messages feature is disabled
		 */
		this.context.FeatureRestriction.isReactionsEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableMessageReaction: true });
				} else {
					this.setState({ enableMessageReaction: false });
				}
			})
			.catch((error) => {
				this.setState({ enableMessageReaction: false });
			});
	};

	enableThreadedChats = () => {
		/**
		 * If threaded chats are open, return false
		 */
		if (this.props.message.hasOwnProperty("parentMessageId") === true) {
			return false;
		}

		/**
		 * If threaded replies feature is disabled
		 */
		this.context.FeatureRestriction.isThreadedMessagesEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableThreadedChats: true });
				} else {
					this.setState({ enableThreadedChats: false });
				}
			})
			.catch((error) => {
				this.setState({ enableThreadedChats: false });
			});
	};

	enableDeleteMessage = () => {
		this.context.FeatureRestriction.isDeleteMessageEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableDeleteMessage: true });
				} else {
					this.setState({ enableDeleteMessage: false });
				}
			})
			.catch((error) => {
				this.setState({ enableDeleteMessage: false });
			});
	};

	enableDeleteMessageForModerator = () => {
		this.context.FeatureRestriction.isDeleteMemberMessageEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableDeleteMessageForModerator: true });
				} else {
					this.setState({ enableDeleteMessageForModerator: false });
				}
			})
			.catch((error) => {
				this.setState({ enableDeleteMessageForModerator: false });
			});
	};

	enableEditMessage = () => {
		/**
		 * If the message is not sent by the logged in user or the message type is not text
		 */
		if (
			this.props.message.sender?.uid !== this.state.loggedInUser?.uid ||
			this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT
		) {
			return false;
		}

		this.context.FeatureRestriction.isEditMessageEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableEditMessage: true });
				} else {
					this.setState({ enableEditMessage: false });
				}
			})
			.catch((error) => {
				this.setState({ enableEditMessage: false });
			});
	};

	enableTranslateMessage = () => {
		/**
		 * message type is not text
		 */
		if (this.props.message.type !== CometChat.MESSAGE_TYPE.TEXT) {
			return false;
		}

		this.context.FeatureRestriction.isMessageTranslationEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableTranslateMessage: true });
				} else {
					this.setState({ enableTranslateMessage: false });
				}
			})
			.catch((error) => {
				this.setState({ enableTranslateMessage: false });
			});
	};

	/**
	 * If message in private feature is enabled
	 */
	enableMessageInPrivate = () => {
		this.context.FeatureRestriction.isMessageInPrivateEnabled()
			.then((response) => {
				if (response === true) {
					this.setState({ enableMessageInPrivate: true });
				} else {
					this.setState({ enableMessageInPrivate: false });
				}
			})
			.catch((error) => {
				this.setState({ enableMessageInPrivate: false });
			});
	};

	sendMessageInPrivate = () => {
		const item = this.props.message?.sender;
		const type = CometChat.ACTION_TYPE.TYPE_USER;

		this.context.setTypeAndItem(type, item);
	};

	reactToMessage = () => {
		this.props.actionGenerated(
			enums.ACTIONS["REACT_TO_MESSAGE"],
			this.props.message
		);
	};

	viewThread = () => {
		this.props.actionGenerated(
			enums.ACTIONS["VIEW_THREADED_MESSAGE"],
			this.props.message
		);
	};

	deleteMessage = () => {
		this.props.actionGenerated(
			enums.ACTIONS["DELETE_MESSAGE"],
			this.props.message
		);
	};

	editMessage = () => {
		this.props.actionGenerated(
			enums.ACTIONS["EDIT_MESSAGE"],
			this.props.message
		);
	};

	translateMessage = () => {
		this.props.actionGenerated(
			enums.ACTIONS["TRANSLATE_MESSAGE"],
			this.props.message
		);
	};

	render() {
		//don't show the tooltip while the message is being sent
		if (this.props.message.hasOwnProperty("sentAt") === false) {
			return false;
		}

		let reactToMessage = null;
		if (this.state.enableMessageReaction) {
			reactToMessage = (
				<li css={actionGroupStyle()} className='action__group'>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(reactIcon, this.context)}
						className='group__button button__reacttomessage'
						data-title={Translator.translate(
							"ADD_REACTION",
							this.context.language
						)}
						onClick={this.reactToMessage}
					></button>
				</li>
			);
		}

		let threadedChats = null;
		if (this.state.enableThreadedChats) {
			threadedChats = (
				<li css={actionGroupStyle()} className='action__group'>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(startThreadIcon, this.context)}
						className='group__button button__threadedchats'
						data-title={
							this.props.message.replyCount
								? Translator.translate("REPLY_TO_THREAD", this.context.language)
								: Translator.translate("REPLY_IN_THREAD", this.context.language)
						}
						onClick={this.viewThread}
					></button>
				</li>
			);
		}

		/**
		 * in one-on-one chat, allow deleting self messages if delete feature is enabled
		 * in group chat, allow deleting other's messages for moderators and admins if moderator delete feature && delete feature is enabled
		 */
		let deleteMessage = null;
		if (
			(this.props.message.sender?.uid === this.state.loggedInUser?.uid &&
				this.state.enableDeleteMessage) ||
			(this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
				this.props.message.sender?.uid !== this.state.loggedInUser?.uid &&
				this.context.item.hasOwnProperty("scope") &&
				this.context.item.scope !== CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT &&
				this.state.enableDeleteMessageForModerator &&
				this.state.enableDeleteMessage)
		) {
			deleteMessage = (
				<li css={actionGroupStyle()} className='action__group'>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(deleteIcon, this.context, 1)}
						className='group__button button__delete'
						data-title={Translator.translate(
							"DELETE_MESSAGE",
							this.context.language
						)}
						onClick={this.deleteMessage}
					></button>
				</li>
			);
		}

		let editMessage = null;
		if (this.state.enableEditMessage) {
			editMessage = (
				<li css={actionGroupStyle()} className='action__group'>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(editIcon, this.context)}
						className='group__button button__edit'
						data-title={Translator.translate(
							"EDIT_MESSAGE",
							this.context.language
						)}
						onClick={this.editMessage}
					></button>
				</li>
			);
		}

		let translateMessage = null;
		if (this.state.enableTranslateMessage) {
			translateMessage = (
				<li css={actionGroupStyle()} className='action__group'>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(translateIcon, this.context)}
						className='group__button button__translate'
						data-title={Translator.translate(
							"TRANSLATE_MESSAGE",
							this.context.language
						)}
						onClick={this.translateMessage}
					></button>
				</li>
			);
		}

		/**
		 * if send message in private feature is enabled, if group chat window is open, and messages are not sent by the loggedin user...
		 */
		let messageInPrivate = null;
		if (
			this.state.enableMessageInPrivate === true &&
			this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
			this.props.message?.sender?.uid !== this.state.loggedInUser?.uid
		) {
			messageInPrivate = (
				<li>
					<button
						type='button'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
						css={groupButtonStyle(sendMessageInPrivateIcon, this.context)}
						className='group__button button__translate'
						data-title={Translator.translate(
							"SEND_MESSAGE_IN_PRIVATE",
							this.context.language
						)}
						onClick={this.sendMessageInPrivate}
					></button>
				</li>
			);
		}

		let tooltip = (
			<ul
				css={messageActionStyle(
					this.props,
					this.context,
					this.state.loggedInUser
				)}
				className='message__actions'
			>
				{reactToMessage}
				{threadedChats}
				{editMessage}
				{deleteMessage}
				{messageInPrivate}
				{translateMessage}
			</ul>
		);

		if (
			threadedChats === null &&
			deleteMessage === null &&
			editMessage === null &&
			reactToMessage === null &&
			translateMessage === null &&
			messageInPrivate === null
		) {
			tooltip = null;
		}

		return tooltip;
	}
}

// Specifies the default values for props:
CometChatMessageActions.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatMessageActions.propTypes = {
	theme: PropTypes.object.isRequired,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatMessageActions };
