import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt, CometChatLinkPreview} from "../";
import { CometChatMessageReactions } from "../Extensions";
import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import { linkify, checkMessageForExtensionsData } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageThumbnailStyle,
	messageDetailStyle,
	nameWrapperStyle,
	nameStyle,
	messageTxtContainerStyle,
	messageTxtWrapperStyle,
	messageTxtStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle
} from "./style";

class CometChatReceiverTextMessageBubble extends React.Component {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.state = {
			translatedMessage: "",
			isHovering: false,
			enableLargerSizeEmojis: false,
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (currentMessageStr !== nextMessageStr 
		|| this.state.isHovering !== nextState.isHovering
		|| this.state.enableLargerSizeEmojis !== nextState.enableLargerSizeEmojis) {
			return true;
		}
		return false;
	}

	componentDidMount() {
		this.enableLargerSizeEmojis();
	}

	componentDidUpdate(prevProps) {
		const previousMessageStr = JSON.stringify(prevProps.message);
		const currentMessageStr = JSON.stringify(this.props.message);

		if (previousMessageStr !== currentMessageStr) {
			this.setState({ translatedMessage: "" });
		}

		this.enableLargerSizeEmojis();
	}

	getMessageText = () => {
		let messageText = this.props.message.text;

		//xss extensions data
		const xssData = checkMessageForExtensionsData(this.props.message, "xss-filter");
		if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
			messageText = xssData.sanitized_text;
		}

		//datamasking extensions data
		const maskedData = checkMessageForExtensionsData(this.props.message, "data-masking");
		if (maskedData && maskedData.hasOwnProperty("data") && maskedData.data.hasOwnProperty("sensitive_data") && maskedData.data.hasOwnProperty("message_masked") && maskedData.data.sensitive_data === "yes") {
			messageText = maskedData.data.message_masked;
		}

		//profanity extensions data
		const profaneData = checkMessageForExtensionsData(this.props.message, "profanity-filter");
		if (profaneData && profaneData.hasOwnProperty("profanity") && profaneData.hasOwnProperty("message_clean") && profaneData.profanity === "yes") {
			messageText = profaneData.message_clean;
		}

		const formattedText = linkify(messageText);

		const emojiParsedMessage = twemoji.parse(formattedText, { folder: "svg", ext: ".svg" });
		const parsedMessage = ReactHtmlParser(emojiParsedMessage, { decodeEntities: false });
		const emojiMessage = parsedMessage.filter(message => message instanceof Object && message.type === "img");

		let showVariation = true;
		//if larger size emojis feature is disabled
		if (this.state.enableLargerSizeEmojis === false) {
			showVariation = false;
		}

		messageText = (
			<div css={messageTxtWrapperStyle(this.context)} className="message__txt__wrapper">
				<p css={messageTxtStyle(parsedMessage, emojiMessage, showVariation, this.context)} className="message__txt">
					{parsedMessage}
					{this.state.translatedMessage}
				</p>
			</div>
		);

		return messageText;
	};

	translateMessage = message => {
		const messageId = message.id;
		const messageText = message.text;

		const browserLanguageCode = Translator.getBrowserLanguage().toLowerCase();
		let translateToLanguage = browserLanguageCode;
		if (browserLanguageCode.indexOf("-") !== -1) {
			const browserLanguageArray = browserLanguageCode.split("-");
			translateToLanguage = browserLanguageArray[0];
		}

		let translatedMessage = "";
		CometChat.callExtension("message-translation", "POST", "v2/translate", {
			msgId: messageId,
			text: messageText,
			languages: [translateToLanguage],
		})
			.then(result => {
				if (result && result.hasOwnProperty("language_original") && result["language_original"] !== translateToLanguage) {
					if (result.hasOwnProperty("translations") && result.translations.length) {
						const messageTranslation = result.translations[0];
						if (messageTranslation.hasOwnProperty("message_translated")) {
							translatedMessage = `\n(${messageTranslation["message_translated"]})`;
						}
					} else {
						this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
					}
				} else {
					this.props.actionGenerated(enums.ACTIONS["INFO"], [], "SAME_LANGUAGE_MESSAGE");
				}

				this.setState({ translatedMessage: translatedMessage });
			})
			.catch(error => this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG"));
	};

	enableLargerSizeEmojis = () => {
		this.context.FeatureRestriction.isLargerSizeEmojisEnabled()
			.then(response => {
				if (response !== this.state.enableLargerSizeEmojis) {
					this.setState({ enableLargerSizeEmojis: response });
				}
			})
			.catch(error => {
				if (this.state.enableLargerSizeEmojis !== false) {
					this.setState({ enableLargerSizeEmojis: false });
				}
			});
	};

	handleMouseHover = () => {
		this.setState(this.toggleHoverState);
	};

	toggleHoverState = state => {
		return {
			isHovering: !state.isHovering,
		};
	};

	actionHandler = (action, message) => {
		switch (action) {
			case enums.ACTIONS["REACT_TO_MESSAGE"]:
				this.props.actionGenerated(action, message);
				break;
			case enums.ACTIONS["VIEW_THREADED_MESSAGE"]:
				this.props.actionGenerated(action, message);
				break;
			case enums.ACTIONS["DELETE_MESSAGE"]:
				this.props.actionGenerated(action, message);
				break;
			case enums.ACTIONS["EDIT_MESSAGE"]:
				this.props.actionGenerated(action, message);
				break;
			case enums.ACTIONS["TRANSLATE_MESSAGE"]:
				this.translateMessage(message);
				break;
			default:
				break;
		}
	};

	render() {

		let avatar = null,
			name = null;
		if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
			avatar = (
				<div css={messageThumbnailStyle()} className="message__thumbnail">
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

		let messageText = this.getMessageText();
		//linkpreview extensions data
		const linkPreviewData = checkMessageForExtensionsData(this.props.message, "link-preview");
		if (linkPreviewData && linkPreviewData.hasOwnProperty("links") && linkPreviewData["links"].length) {
			messageText = <CometChatLinkPreview message={this.props.message} messageText={messageText} />;
		}

		//messagereactions extensions data
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
			toolTipView = <CometChatMessageActions message={this.props.message} actionGenerated={this.actionHandler} />;
		}

		return (
			<div css={messageContainerStyle()} className="receiver__message__container message__text" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				<div css={messageWrapperStyle()} className="message__wrapper">
					{avatar}
					<div css={messageDetailStyle()} className="message__details">
						{name}
						{toolTipView}
						<div css={messageTxtContainerStyle()} className="message__text__container">
							{messageText}
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
CometChatReceiverTextMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatReceiverTextMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatReceiverTextMessageBubble };
