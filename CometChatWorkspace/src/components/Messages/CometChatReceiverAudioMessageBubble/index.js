import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
	CometChatMessageActions,
	CometChatThreadedMessageReplyCount,
	CometChatReadReceipt,
} from "../";
import { CometChatMessageReactions } from "../Extensions";
import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../util/common";

import { theme } from "../../../resources/theme";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageThumbnailStyle,
	messageDetailStyle,
	nameWrapperStyle,
	nameStyle,
	messageAudioContainerStyle,
	messageAudioWrapperStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle,
} from "./style";

class CometChatReceiverAudioMessageBubble extends React.Component {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.state = {
			isHovering: false,
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (
			currentMessageStr !== nextMessageStr ||
			this.state.isHovering !== nextState.isHovering
		) {
			return true;
		}
		return false;
	}

	handleMouseHover = () => {
		this.setState(this.toggleHoverState);
	};

	toggleHoverState = (state) => {
		return {
			isHovering: !state.isHovering,
		};
	};

	render() {
		let avatar = null,
			name = null;
		if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
			avatar = (
				<div css={messageThumbnailStyle()} className='message__thumbnail'>
					<CometChatAvatar user={this.props.message.sender} />
				</div>
			);

			name = (
				<div css={nameWrapperStyle(avatar)} className='message__name__wrapper'>
					<span css={nameStyle(this.context)} className='message__name'>
						{this.props.message.sender.name}
					</span>
				</div>
			);
		}

		let messageReactions = null;
		const reactionsData = checkMessageForExtensionsData(
			this.props.message,
			"reactions"
		);
		if (reactionsData) {
			if (Object.keys(reactionsData).length) {
				messageReactions = (
					<div
						css={messageReactionsWrapperStyle()}
						className='message__reaction__wrapper'
					>
						<CometChatMessageReactions
							message={this.props.message}
							actionGenerated={this.props.actionGenerated}
						/>
					</div>
				);
			}
		}

		let toolTipView = null;
		if (this.state.isHovering) {
			toolTipView = (
				<CometChatMessageActions
					message={this.props.message}
					actionGenerated={this.props.actionGenerated}
				/>
			);
		}

		return (
			<div
				css={messageContainerStyle()}
				className='receiver__message__container message__audio'
				onMouseEnter={this.handleMouseHover}
				onMouseLeave={this.handleMouseHover}
			>
				<div css={messageWrapperStyle()} className='message__wrapper'>
					{avatar}
					<div css={messageDetailStyle()} className='message__details'>
						{name}
						{toolTipView}
						<div
							css={messageAudioContainerStyle()}
							className='message__audio__container'
						>
							<div
								css={messageAudioWrapperStyle()}
								className='message__audio__wrapper'
							>
								<audio controls>
									<source src={this.props.message.data.attachments[0].url} />
								</audio>
							</div>
						</div>

						{messageReactions}

						<div
							css={messageInfoWrapperStyle()}
							className='message__info__wrapper'
						>
							<CometChatReadReceipt message={this.props.message} />
							<CometChatThreadedMessageReplyCount
								message={this.props.message}
								actionGenerated={this.props.actionGenerated}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatReceiverAudioMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatReceiverAudioMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatReceiverAudioMessageBubble };
