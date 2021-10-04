import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core"
import PropTypes from "prop-types";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../";
import { CometChatMessageReactions } from "../Extensions";

import { checkMessageForExtensionsData, getMessageFileMetadata } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";

import {
	messageContainerStyle,
	messageWrapperStyle,
	messageAudioWrapperStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle
} from "./style";

class CometChatSenderAudioMessageBubble extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isHovering: false,
			fileData: {},
		};
	}

	componentDidMount() {
		
		const fileData = this.getFileData();
		this.setState({ fileData: fileData });
	}

	shouldComponentUpdate(nextProps, nextState) {

		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (currentMessageStr !== nextMessageStr 
		|| this.state.isHovering !== nextState.isHovering 
		|| this.state.fileData !== nextState.fileData) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {

		const previousMessageStr = JSON.stringify(prevProps.message);
		const currentMessageStr = JSON.stringify(this.props.message);

		if (previousMessageStr !== currentMessageStr) {
			const fileData = this.getFileData();

			const previousfileData = JSON.stringify(this.state.fileData);
			const currentfileData = JSON.stringify(fileData);

			if (previousfileData !== currentfileData) {
				this.setState({ fileData: fileData });
			}
		}
	}

	getFileData = () => {

		const metadataKey = enums.CONSTANTS["FILE_METADATA"];
		const fileMetadata = getMessageFileMetadata(this.props.message, metadataKey);
		
		if (fileMetadata instanceof Blob) {
			return { fileName: fileMetadata["name"] };
		} else if (this.props.message.data.hasOwnProperty("attachments") && this.props.message.data.attachments.length) {
			const fileName = this.props.message.data.attachments[0]?.name;
			const fileUrl = this.props.message.data.attachments[0]?.url;

			return { fileName, fileUrl: fileUrl };
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
		if (!Object.keys(this.state.fileData).length) {
			return null;
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
			<div css={messageContainerStyle()} className="sender__message__container message__audio" onMouseEnter={this.handleMouseHover} onMouseLeave={this.handleMouseHover}>
				{toolTipView}
				<div css={messageWrapperStyle()} className="message__wrapper">
					<div css={messageAudioWrapperStyle()} className="message__audio__wrapper">
						<audio controls src={this.state.fileData?.fileUrl}></audio>
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
CometChatSenderAudioMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderAudioMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderAudioMessageBubble };
