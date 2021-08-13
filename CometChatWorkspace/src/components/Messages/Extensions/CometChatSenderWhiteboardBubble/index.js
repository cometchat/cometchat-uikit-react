import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../../";
import { CometChatMessageReactions } from "../";

import { CometChatContext } from "../../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../../util/common";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    messageTxtContainerStyle,
    messageTxtStyle,
    messageTxtIconStyle,
    messageBtnStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle,
} from "./style";

import whiteboardIcon from "./resources/collaborative-whiteboard.svg";

class CometChatSenderWhiteboardBubble extends React.Component {
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

		const documentTitle = Translator.translate("CREATED_WHITEBOARD", this.context.language);
		return (
			<div css={messageContainerStyle()} className="sender__message__container message__whiteboard" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				{toolTipView}

				<div css={messageWrapperStyle()} className="message__wrapper">
					<div css={messageTxtWrapperStyle(this.context)} className="message__whiteboard__wrapper">
						<div css={messageTxtContainerStyle()} className="message__whiteboard__container">
							<i css={messageTxtIconStyle(whiteboardIcon, this.context)}></i>
							<p css={messageTxtStyle()} className="document__title">
								{documentTitle}
							</p>
						</div>
						<ul css={messageBtnStyle(this.context)} className="document__button">
							<li onClick={this.launchCollaborativeWhiteboard}>
								<p>{Translator.translate("LAUNCH", this.context.language)}</p>
							</li>
						</ul>
					</div>
				</div>

				{messageReactions}

				<div css={messageInfoWrapperStyle()} className="message__info__wrapper">
					<CometChatThreadedMessageReplyCount message={this.props.message} actionGenerated={this.props.actionGenerated} />
					<CometChatReadReceipt message={this.props.message} />
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatSenderWhiteboardBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderWhiteboardBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderWhiteboardBubble };