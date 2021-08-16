import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { getMessageSentTime } from "../../../util/common";
import { CometChatContext } from "../../../util/CometChatContext"

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import { msgTimestampStyle, iconStyle } from "./style";

import blueDoubleTick from "./resources/message-read.svg";
import greyDoubleTick from "./resources/message-delivered.svg";
import greyTick from "./resources/message-sent.svg";
import sendingTick from "./resources/wait.svg";
import errorTick from "./resources/warning-small.svg";

class CometChatReadReceipt extends React.PureComponent {
	static contextType = CometChatContext;
	loggedInUser;

	constructor(props, context) {
		super(props, context);
		this.state = {
			receipts: false,
		};

		this.context.getLoggedinUser().then(user => {
			this.loggedInUser = { ...user };
		});
	}

	componentDidMount() {
		this.toggleReadReceipts();
	}

	componentDidUpdate() {
		this.toggleReadReceipts();
	}

	toggleReadReceipts = () => {
		/**
		 * if delivery receipts feature is disabled
		 */
		this.context.FeatureRestriction.isDeliveryReceiptsEnabled()
			.then(response => {
				if (response !== this.state.receipts) {
					this.setState({ receipts: response });
				}
			})
			.catch(error => {
				if (this.state.receipts !== false) {
					this.setState({ receipts: false });
				}
			});
	};

	render() {
		
		let ticks,
			receiptText = null,
			dateField = null,
			color = null;
		
		if (this.props.message?.sender?.uid === this.loggedInUser?.uid) {

			if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
				if (this.props.message.hasOwnProperty("error")) {
					ticks = errorTick;
					receiptText = "ERROR";
					dateField = this.props.message._composedAt;
					color = this.context.theme.color.red;
				} else {
					ticks = sendingTick;
					receiptText = "SENDING";
					dateField = this.props.message._composedAt;
					color = this.context.theme.secondaryTextColor;
					if (this.props.message.hasOwnProperty("sentAt")) {
						ticks = greyTick;
						receiptText = "SENT";
						dateField = this.props.message.sentAt;
					}
				}
			} else {
				if (this.props.message.hasOwnProperty("error")) {
					ticks = errorTick;
					receiptText = "ERROR";
					dateField = this.props.message._composedAt;
					color = this.context.theme.color.red;
				} else {
					ticks = sendingTick;
					receiptText = "SENDING";
					dateField = this.props.message._composedAt;
					color = this.context.theme.secondaryTextColor;

					if (this.props.message.hasOwnProperty("readAt")) {

						ticks = blueDoubleTick;
						receiptText = "SEEN";
						color = this.context.theme.primaryColor;
						dateField = this.props.message.readAt;

					} else if (this.props.message.hasOwnProperty("deliveredAt")) {

						ticks = greyDoubleTick;
						receiptText = "DELIVERED";
						dateField = this.props.message.deliveredAt;

					} else if (this.props.message.hasOwnProperty("sentAt")) {

						ticks = greyTick;
						receiptText = "SENT";
						dateField = this.props.message.sentAt;
					}
				}
			}
		} else {
			dateField = this.props.message.sentAt;
		}

		//if delivery receipts are disabled
		if (this.state.receipts === false) {
			ticks = null;
		}

		const receipt = ticks ? <i css={iconStyle(ticks, color)} title={Translator.translate(receiptText, this.context.language)}></i> : null;

		const timestamp = getMessageSentTime(dateField, this.context.language);

		return (
			<React.Fragment>
				<span css={msgTimestampStyle(this.context, this.props, this.loggedInUser)} className="message__timestamp">
					{timestamp}
				</span>
				{receipt}
			</React.Fragment>
		);
	}
}

// Specifies the default values for props:
CometChatReadReceipt.defaultProps = {
	theme: theme,
};

CometChatReadReceipt.propTypes = {
	theme: PropTypes.object,
	message: PropTypes.object.isRequired,
};

export { CometChatReadReceipt };