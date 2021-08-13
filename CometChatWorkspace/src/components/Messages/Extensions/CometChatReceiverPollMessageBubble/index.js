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
import * as enums from "../../../../util/enums.js";

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
    pollQuestionStyle,
    pollAnswerStyle,
    pollPercentStyle,
    answerWrapperStyle,
    checkIconStyle,
    pollTotalStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle
} from "./style";


import checkImg from "./resources/checkmark.svg";

class CometChatReceiverPollMessageBubble extends React.Component {
	pollId;
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);

		this.state = {
			isHovering: false,
			loggedInUser: null
		};
	}

	componentDidMount() {

		this.context.getLoggedinUser().then(user => {
			this.setState({ loggedInUser: {...user} });
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
        
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (currentMessageStr !== nextMessageStr 
        || this.state.isHovering !== nextState.isHovering) {
			return true;
		}
		return false;
	}

	answerPollQuestion = (event, selectedOption) => {
		CometChat.callExtension("polls", "POST", "v2/vote", {
			vote: selectedOption,
			id: this.pollId,
		})
			.then(response => {
				if (response.hasOwnProperty("success") === false || (response.hasOwnProperty("success") && response["success"] === false)) {
					this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
				}
			})
			.catch(error => this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG"));
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
		const pollExtensionData = checkMessageForExtensionsData(this.props.message, "polls");
		if (!pollExtensionData) {
			return null;
		}

		// if (!this.props.message.hasOwnProperty("metadata")) {
		//     return null;
		// }

		// if (!this.props.message.metadata.hasOwnProperty("@injected")) {
		//     return null;
		// }

		// if (!this.props.message.metadata["@injected"].hasOwnProperty("extensions")) {
		//     return null;
		// }

		// if (!this.props.message.metadata["@injected"]["extensions"].hasOwnProperty("polls")) {
		//     return null;
		// }

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

		const pollOptions = [];
		//const pollExtensionData = this.props.message.metadata["@injected"]["extensions"]["polls"];

		this.pollId = pollExtensionData.id;
		const total = pollExtensionData.results.total;
		let totalText = Translator.translate("NO_VOTE", this.context.language);

		if (total === 1) {
			totalText = `${total} ${Translator.translate("VOTE", this.context.language)}`;
		} else if (total > 1) {
			totalText = `${total} ${Translator.translate("VOTES", this.context.language)}`;
		}

		for (const option in pollExtensionData.options) {
			const optionData = pollExtensionData.results.options[option];
			const vote = optionData["count"];

			let width = "0%";
			if (total) {
				const fraction = vote / total;
				width = fraction.toLocaleString("en", { style: "percent" });
			}

			let checkIcon = null;
			if (optionData.hasOwnProperty("voters") && optionData.voters.hasOwnProperty(this.loggedInUser?.uid)) {
				checkIcon = <i css={checkIconStyle(checkImg, this.context)}></i>;
			}

			const template = (
				<li key={option} onClick={event => this.answerPollQuestion(event, option)}>
					<div css={pollPercentStyle(this.context, width)}> </div>
					<div css={answerWrapperStyle(this.state, optionData, this.context)}>
						{checkIcon}
						<span>{width}</span>
						<p>{optionData.text}</p>
					</div>
				</li>
			);
			pollOptions.push(template);
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

		return (
			<div css={messageContainerStyle()} className="receiver__message__container message__poll" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				<div css={messageWrapperStyle()} className="message__wrapper">
					{avatar}
					<div css={messageDetailStyle()} className="message__details">
						{name}
						{toolTipView}
						<div css={messageTxtContainerStyle()} className="message__poll__container">
							<div css={messageTxtWrapperStyle(this.context)} className="message__poll__wrapper">
								<p css={pollQuestionStyle()} className="poll__question">
									{pollExtensionData.question}
								</p>
								<ul css={pollAnswerStyle(this.context)} className="poll__options">
									{pollOptions}
								</ul>
								<p css={pollTotalStyle()} className="poll__votes">
									{totalText}
								</p>
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
CometChatReceiverPollMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatReceiverPollMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatReceiverPollMessageBubble };