import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../";
import { CometChatMessageReactions } from "../Extensions";

import { CometChatContext } from "../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    messageTxtContainerStyle,
    messageTxtStyle,
    messageBtnStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle,
    iconStyle
} from "./style";

import callIcon from "./resources/video-call.svg";

class CometChatSenderDirectCallBubble extends React.Component {
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

		let callMessage = null;
		const joinCallMessage = Translator.translate("YOU_ALREADY_ONGOING_CALL", this.context.language);

		if (this.context.checkIfDirectCallIsOngoing() === enums.CONSTANTS.CALLS["ONGOING_CALL_SAME_GROUP"]) {
			//ongoing call in same group
			callMessage = (
				<li className="directcall__row" title={joinCallMessage}>
					<p className="directcall__text">{Translator.translate("JOIN", this.context.language)}</p>
				</li>
			);
		} else if (this.context.checkIfDirectCallIsOngoing() === enums.CONSTANTS.CALLS["ONGOING_CALL_DIFF_GROUP"]) {
			//ongoing call in different group

			callMessage = (
				<li className="directcall__row" title={joinCallMessage}>
					<p className="directcall__text">{Translator.translate("JOIN", this.context.language)}</p>
				</li>
			);
		} else if (this.context.checkIfCallIsOngoing()) {
			//ongoing call

			callMessage = (
				<li className="directcall__row" title={joinCallMessage}>
					<p className="directcall__text">{Translator.translate("JOIN", this.context.language)}</p>
				</li>
			);
		} else {
			callMessage = (
				<li className="directcall__row" onClick={() => this.props.actionGenerated(enums.ACTIONS["JOIN_DIRECT_CALL"], this.props.message)}>
					<p className="directcall__text">{Translator.translate("JOIN", this.context.language)}</p>
				</li>
			);
		}

		const messageTitle = Translator.translate("YOU_INITIATED_GROUP_CALL", this.context.language);
		return (
			<div css={messageContainerStyle()} className="sender__message__container message__directcall" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				{toolTipView}

				<div css={messageWrapperStyle()} className="message__wrapper">
					<div css={messageTxtWrapperStyle(this.context)} className="message__directcall__wrapper">
						<div css={messageTxtContainerStyle()} className="message__directcall__container">
							<i css={iconStyle(callIcon, this.context)} alt={Translator.translate("VIDEO_CALL", this.context.language)}></i>
							<p css={messageTxtStyle()} className="directcall__title">
								{messageTitle}
							</p>
						</div>
						<ul css={messageBtnStyle(this.context)} className="directcall__button">
							{callMessage}
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
CometChatSenderDirectCallBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderDirectCallBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderDirectCallBubble };