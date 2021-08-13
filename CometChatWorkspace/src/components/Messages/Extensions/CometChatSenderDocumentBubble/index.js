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
    messageBtnStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle,
    iconStyle,
} from "./style";

import documentIcon from "./resources/collaborative-document.svg";

class CometChatSenderDocumentBubble extends React.Component {
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

		if (currentMessageStr !== nextMessageStr 
        || this.state.isHovering !== nextState.isHovering) {
            
			return true;
		}
		return false;
	}

	launchCollaborativeDocument = () => {
		let documentUrl = null;
		let documentData = checkMessageForExtensionsData(this.props.message, "document");
		if (documentData && documentData.hasOwnProperty("document_url") && documentData.document_url.length) {
			documentUrl = documentData.document_url;
			window.open(documentUrl, "", "fullscreen=yes, scrollbars=auto");
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

		const documentTitle = Translator.translate("CREATED_DOCUMENT", this.context.language);
		return (
			<div css={messageContainerStyle()} className="sender__message__container message__document" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				{toolTipView}

				<div css={messageWrapperStyle()} className="message__wrapper">
					<div css={messageTxtWrapperStyle(this.context)} className="message__document__wrapper">
						<div css={messageTxtContainerStyle()} className="message__document__container">
							<i css={iconStyle(documentIcon, this.context)} title={Translator.translate("COLLABORATIVE_DOCUMENT", this.context.language)}></i>
							<p css={messageTxtStyle()} className="document__title">
								{documentTitle}
							</p>
						</div>
						<ul css={messageBtnStyle(this.context)} className="document__button">
							<li onClick={this.launchCollaborativeDocument}>
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
CometChatSenderDocumentBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderDocumentBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderDocumentBubble };
