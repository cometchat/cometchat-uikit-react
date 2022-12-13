import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";

import {
	CometChatMessageActions,
	CometChatThreadedMessageReplyCount,
	CometChatReadReceipt,
} from "../../";
import { CometChatMessageReactions } from "../";

import { CometChatContext } from "../../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../../util/common";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageTxtWrapperStyle,
	pollQuestionStyle,
	pollAnswerStyle,
	pollTotalStyle,
	pollPercentStyle,
	answerWrapperStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle,
} from "./style";

class CometChatSenderPollMessageBubble extends React.Component {
	pollId;
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
		const pollExtensionData = checkMessageForExtensionsData(
			this.props.message,
			"polls"
		);
		if (!pollExtensionData) {
			return null;
		}

		const pollOptions = [];

		this.pollId = pollExtensionData.id;
		const total = pollExtensionData.results.total;
		let totalText = Translator.translate("NO_VOTE", this.context.language);

		if (total === 1) {
			totalText = `${total} ${Translator.translate(
				"VOTE",
				this.context.language
			)}`;
		} else if (total > 1) {
			totalText = `${total} ${Translator.translate(
				"VOTES",
				this.context.language
			)}`;
		}

		for (const option in pollExtensionData.results.options) {
			const optionData = pollExtensionData.results.options[option];
			const vote = optionData["count"];

			let width = "0%";
			if (total) {
				const fraction = vote / total;
				width = fraction.toLocaleString("en", { style: "percent" });
			}

			const template = (
				<li key={option}>
					<div css={pollPercentStyle(this.context, width)}> </div>
					<div css={answerWrapperStyle(this.context, width)}>
						<span>{width}</span>
						<p>{optionData.text}</p>
					</div>
				</li>
			);
			pollOptions.push(template);
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
				className='sender__message__container message__poll'
				onMouseEnter={this.handleMouseHover}
				onMouseLeave={this.handleMouseHover}
			>
				{toolTipView}

				<div css={messageWrapperStyle()} className='message__wrapper'>
					<div
						css={messageTxtWrapperStyle(this.context)}
						className='message__poll__wrapper'
					>
						<p css={pollQuestionStyle()} className='poll__question'>
							{pollExtensionData.question}
						</p>
						<ul css={pollAnswerStyle(this.context)} className='poll__options'>
							{pollOptions}
						</ul>
						<p css={pollTotalStyle()} className='poll__votes'>
							{totalText}
						</p>
					</div>
				</div>

				{messageReactions}

				<div css={messageInfoWrapperStyle()} className='message__info__wrapper'>
					<CometChatThreadedMessageReplyCount
						message={this.props.message}
						actionGenerated={this.props.actionGenerated}
					/>
					<CometChatReadReceipt message={this.props.message} />
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatSenderPollMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderPollMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderPollMessageBubble };
