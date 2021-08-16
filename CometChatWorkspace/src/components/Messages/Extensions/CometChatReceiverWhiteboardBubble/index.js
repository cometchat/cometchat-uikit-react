import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../../";
import { CometChatMessageReactions } from "../";
import { CometChatAvatar } from "../../../Shared";

import { CometChatContext } from "../../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../../util/common";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageThumbnailStyle,
	messageDetailStyle,
	nameWrapperStyle,
	nameStyle,
	messageTxtContainerStyle,
	messageTxtWrapperStyle,
	messageTxtTitleStyle,
	messageTxtStyle,
	messageBtnStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle,
	iconStyle,
} from "./style";

import whiteboardIcon from "./resources/collaborative-whiteboard.svg";

class CometChatReceiverWhiteboardBubble extends React.Component {
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);

		this.state = {
			isHovering: false,
		};

		this.context.getLoggedinUser().then(user => {
			this.loggedInUser = { ...user };
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (currentMessageStr !== nextMessageStr || this.state.isHovering !== nextState.isHovering) {
			return true;
		}
		return false;
	}

	launchCollaborativeWhiteboard = () => {
		let whiteboardUrl = null;
		let whiteboardData = checkMessageForExtensionsData(this.props.message, "whiteboard");
		if (whiteboardData && whiteboardData.hasOwnProperty("board_url") && whiteboardData.board_url.length) {
			let username = this.loggedInUser?.name.split(" ").join("_");
			// Appending the username to the board_url
			whiteboardUrl = whiteboardData.board_url + "&username=" + username;
			window.open(whiteboardUrl, "", "fullscreen=yes, scrollbars=auto");
		}
	};

	handleMouseHover = () => {
		this.setState(this.toggleHoverState);
	};

	toggleHoverState = state => {
		return {
			isHovering: !state.isHovering,
		};
	};

	render() {
		let avatar = null,
			name = null;
		if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
			avatar = (
				<div css={messageThumbnailStyle} className="message__thumbnail">
					<CometChatAvatar user={this.props.message.sender} />
				</div>
			);

			name = (
				<div css={nameWrapperStyle(avatar)} className="message__name__wrapper">
					<span css={nameStyle(this.context)} className="message__name">
						{this.props.message.sender.name}
					</span>
				</div>
			);
		}

		let messageReactions = null;
		const reactionsData = checkMessageForExtensionsData(this.props.message, "reactions");
		if (reactionsData) {
			if (Object.keys(reactionsData).length) {
				messageReactions = (
					<div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
						<CometChatMessageReactions message={this.props.message} actionGenerated={this.props.actionGenerated} />
					</div>
				);
			}
		}

		let toolTipView = null;
		if (this.state.isHovering) {
			toolTipView = <CometChatMessageActions message={this.props.message} actionGenerated={this.props.actionGenerated} />;
		}

		const documentTitle = `${this.props.message.sender.name} ${Translator.translate("SHARED_COLLABORATIVE_WHITEBOARD", this.context.language)}`;

		return (
			<div css={messageContainerStyle()} className="receiver__message__container message__whiteboard" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				<div css={messageWrapperStyle()} className="message__wrapper">
					{avatar}
					<div css={messageDetailStyle()} className="message__details">
						{name}
						{toolTipView}
						<div css={messageTxtContainerStyle()} className="message__whiteboard__container">
							<div css={messageTxtWrapperStyle(this.context)} className="message__whiteboard__wrapper">
								<div css={messageTxtTitleStyle(this.context)} className="message__whiteboard__title">
									<i css={iconStyle(whiteboardIcon, this.context)} title={Translator.translate("COLLABORATIVE_WHITEBOARD", this.context.language)}></i>
									<p css={messageTxtStyle()} className="whiteboard__title">
										{documentTitle}
									</p>
								</div>

								<ul css={messageBtnStyle(this.context)} className="whiteboard__button">
									<li onClick={this.launchCollaborativeWhiteboard}>
										<p>{Translator.translate("JOIN", this.context.language)}</p>
									</li>
								</ul>
							</div>
						</div>

						{messageReactions}

						<div css={messageInfoWrapperStyle()} className="message__info__wrapper">
							<CometChatReadReceipt message={this.props.message} />
							<CometChatThreadedMessageReplyCount message={this.props.message} actionGenerated={this.props.actionGenerated} />
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatReceiverWhiteboardBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatReceiverWhiteboardBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatReceiverWhiteboardBubble };