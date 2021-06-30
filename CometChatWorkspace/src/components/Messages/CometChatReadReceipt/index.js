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

	constructor(props) {

		super(props)
		this.state = {
			message: props.message,
			receipts: false,
		};
	}

	componentDidMount() {
		this.toggleReadReceipts();
	}

	componentDidUpdate(prevProps) {

		const previousMessageStr = JSON.stringify(prevProps.message)
		const currentMessageStr = JSON.stringify(this.props.message)

		if (previousMessageStr !== currentMessageStr) {
			this.setState({ message: this.props.message })
		}

    	this.toggleReadReceipts();
	}

  	toggleReadReceipts = () => {

		/**
		 * if delivery receipts feature is disabled
		 */
		this.context.FeatureRestriction.isDeliveryReceiptsEnabled().then(response => {

			if (response !== this.state.receipts) {
				this.setState({receipts: response});
			}

		}).catch(error => {

			if (this.state.receipts !== false) {
				this.setState({ receipts: false })
			}

		});
	}

	render() {

		let ticks, receiptText = null, dateField = null, color = null;
    
		if (this.state.message?.sender?.uid === this.props?.loggedInUser?.uid) {

			if (this.state.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
				if (this.state.message.hasOwnProperty("error")) {
					ticks = errorTick
					receiptText = "ERROR"
					dateField = this.state.message._composedAt;
					color = this.context.theme.color.red;
				} else {
					ticks = sendingTick
					receiptText = "SENDING"
					dateField = this.state.message._composedAt
					color = this.context.theme.secondaryTextColor;
					if (this.state.message.hasOwnProperty("sentAt")) {
						ticks = greyTick
						receiptText = "SENT"
						dateField = this.state.message.sentAt
					}
				}
			} else {
				if (this.state.message.hasOwnProperty("error")) {
					ticks = errorTick
					receiptText = "ERROR"
					dateField = this.state.message._composedAt;
					color = this.context.theme.color.red;
				} else {
					ticks = sendingTick
					receiptText = "SENDING"
					dateField = this.state.message._composedAt
					color = this.context.theme.secondaryTextColor;
					if (this.state.message.hasOwnProperty("sentAt")) {
						ticks = greyTick
						receiptText = "SENT"
						dateField = this.state.message.sentAt
						if (this.state.message.hasOwnProperty("deliveredAt")) {
							ticks = greyDoubleTick
							receiptText = "DELIVERED"
							if (this.state.message.hasOwnProperty("readAt")) {
								ticks = blueDoubleTick
								receiptText = "SEEN"
								color = this.context.theme.primaryColor;
							}
						}
					}
				}
			}

		} else {
			dateField = this.state.message.sentAt
		}

		//if delivery receipts are disabled
		if (this.state.receipts === false) {
			ticks = null
		}

		const receipt = ticks ? (<i css={iconStyle(ticks, color)} title={Translator.translate(receiptText, this.props.lang)}></i>) : null

		const timestamp = getMessageSentTime(dateField, this.props.lang)

		return (
			<>
			<span css={msgTimestampStyle(this.context, this.state)} className="message__timestamp">{timestamp}</span>
			{receipt}
			</>
		)
	}
}

// Specifies the default values for props:
CometChatReadReceipt.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme,
};

CometChatReadReceipt.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export { CometChatReadReceipt };