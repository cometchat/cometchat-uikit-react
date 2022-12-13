import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatCallScreen } from "../CometChatCallScreen";

import { CometChatContext } from "../../../util/CometChatContext";
import { ID, getUnixTimestamp } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

class CometChatOutgoingDirectCall extends React.Component {
	sessionID;
	static contextType = CometChatContext;

	constructor(props) {
		super(props);

		this.state = {
			callInProgress: null,
		};

		this.callScreenRef = React.createRef();

		CometChat.getLoggedinUser()
			.then((user) => (this.loggedInUser = user))
			.catch((error) => {
				console.error(error);
			});
	}

	actionHandler = (action) => {
		switch (action) {
			case enums.ACTIONS["DIRECT_CALL_ENDED"]:
			case enums.ACTIONS["DIRECT_CALL_ERROR"]:
				this.setState({ callInProgress: null });
				break;
			default:
				break;
		}
	};

	startCall = (sessionID) => {
		this.sessionID = sessionID;
		if (!this.sessionID) {
			const errorCode = "ERR_EMPTY_CALL_SESSION_ID";
			this.context.setToastMessage("error", errorCode);
			return false;
		}

		const customMessage = this.prepareCustomMessageData();
		this.setState({ callInProgress: customMessage });
		if (this.context) {
			this.context.setCallInProgress(
				customMessage,
				enums.CONSTANTS["OUTGOING_DIRECT_CALLING"]
			);
		}

		setTimeout(() => {
			this.sendCustomMessage();
		}, 5);
	};

	joinCall = (sessionID) => {
		this.sessionID = sessionID;
		if (this.sessionID === null) {
			const errorCode = "ERR_EMPTY_CALL_SESSION_ID";
			this.context.setToastMessage("error", errorCode);
			return false;
		}

		const customMessage = this.prepareCustomMessageData();
		this.setState({ callInProgress: customMessage });
		if (this.context) {
			this.context.setCallInProgress(
				customMessage,
				enums.CONSTANTS["OUTGOING_DIRECT_CALLING"]
			);
		}
	};

	prepareCustomMessageData = () => {
		const receiverType = CometChat.RECEIVER_TYPE.GROUP;
		const customData = {
			sessionID: this.sessionID,
			sessionId: this.sessionID,
			callType: CometChat.CALL_TYPE.VIDEO,
		};
		const customType = enums.CUSTOM_TYPE_MEETING;
		const conversationId = `group_${this.sessionID}`;

		const customMessage = new CometChat.CustomMessage(
			this.sessionID,
			receiverType,
			customType,
			customData
		);
		customMessage.setSender(this.loggedInUser);
		customMessage.setReceiver(receiverType);
		customMessage.setConversationId(conversationId);
		customMessage._composedAt = getUnixTimestamp();
		customMessage._id = ID();

		return customMessage;
	};

	sendCustomMessage = () => {
		const customMessage = this.prepareCustomMessageData();
		this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [
			customMessage,
		]);

		CometChat.sendCustomMessage(customMessage)
			.then((message) => {
				const newMessageObj = { ...message, _id: customMessage._id };
				this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], [
					newMessageObj,
				]);
			})
			.catch((error) => {
				const newMessageObj = { ...customMessage, error: error };
				this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], [
					newMessageObj,
				]);

				const errorCode =
					error && error.hasOwnProperty("code") ? error.code : "ERROR";
				this.context.setToastMessage("error", errorCode);
			});
	};

	render() {
		let callScreen = null;
		if (this.state.callInProgress) {
			callScreen = (
				<CometChatCallScreen
					ref={(el) => (this.callScreenRef = el)}
					loggedInUser={this.loggedInUser}
					call={this.state.callInProgress}
					lang={this.props.lang}
					actionGenerated={this.actionHandler}
				/>
			);
		}
		return callScreen;
	}
}

// Specifies the default values for props:
CometChatOutgoingDirectCall.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
};

CometChatOutgoingDirectCall.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
};

export { CometChatOutgoingDirectCall };
