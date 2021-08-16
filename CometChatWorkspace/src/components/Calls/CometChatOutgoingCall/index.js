import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import { CallScreenManager } from "./controller";

import { CometChatCallScreen } from "../CometChatCallScreen";
import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { SoundManager } from "../../../util/SoundManager";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
	callScreenWrapperStyle,
	callScreenContainerStyle,
	headerStyle,
	headerDurationStyle,
	headerNameStyle,
	thumbnailWrapperStyle,
	thumbnailStyle,
	headerIconStyle,
	iconWrapperStyle,
	iconStyle,
	errorContainerStyle
} from "./style"; 

import callIcon from "./resources/end-call.svg";

class CometChatOutgoingCall extends React.PureComponent {

	static contextType = CometChatContext;

	constructor(props) {

		super(props);

		this.callScreenFrame = React.createRef();

		this.state = {
			errorScreen: false,
			errorMessage: null,
			outgoingCallScreen: false,
			callInProgress: null,
		}

		CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
			console.error(error);
		});
	}

	componentDidMount() {

		this.CallScreenManager = new CallScreenManager();
		this.CallScreenManager.attachListeners(this.callScreenUpdated);
	}

	componentWillUnmount() {
		this.CallScreenManager.removeListeners();
		this.CallScreenManager = null;
	}

	callScreenUpdated = (key, call) => {

		switch (key) {

			case enums.OUTGOING_CALL_ACCEPTED://occurs at the caller end
				this.outgoingCallAccepted(call);
			break;
			case enums.OUTGOING_CALL_REJECTED://occurs at the caller end, callee rejects the call
				this.outgoingCallRejected(call);
			break;
			default:
			break;
		}
	}

	outgoingCallAccepted = (call) => {

		if (this.state.outgoingCallScreen === true) {

			this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_ACCEPTED"], call);

			SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"], this.context);
			this.setState({ outgoingCallScreen: false, callInProgress: call, errorScreen: false, errorMessage: null });

			if(this.context) {
				this.context.setCallInProgress(call, enums.CONSTANTS["OUTGOING_DEFAULT_CALLING"]);
			}
		}
	}

	outgoingCallRejected = (call) => {

		SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"], this.context);
		if (call.hasOwnProperty("status") && call.status === CometChat.CALL_STATUS.BUSY) {

			//show busy message.
			const errorMessage = `${call.sender.name} ${Translator.translate("ON_ANOTHER_CALL", this.props.lang)}`;
			this.setState({ errorScreen: true, errorMessage: errorMessage });
			this.clearCallInProgress();

		} else {

			this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_REJECTED"], call);
			this.setState({ outgoingCallScreen: false, callInProgress: null, errorScreen: false, errorMessage: null });
			this.clearCallInProgress();

		}
	}

	startCall = (call) => {

		SoundManager.play(enums.CONSTANTS.AUDIO["OUTGOING_CALL"], this.context);
		this.setState({ outgoingCallScreen: true, callInProgress: call, errorScreen: false, errorMessage: null });
	}

	actionHandler = (action, call) => {

		switch (action) {

			case enums.ACTIONS["OUTGOING_CALL_ENDED"]:
				this.setState({ callInProgress: null });
			break;
			case enums.ACTIONS["USER_JOINED_CALL"]:
			case enums.ACTIONS["USER_LEFT_CALL"]:
				this.props.actionGenerated(action, call);
			break;
			default:
			break;
		}
	}

	//cancelling an outgoing call
	cancelCall = () => {

		SoundManager.pause(enums.CONSTANTS.AUDIO["OUTGOING_CALL"], this.context);
		//if user busy error, just close the callscreen, no need to reject the call
		if (this.state.errorScreen) {

			this.setState({ errorScreen: false, errorMessage: null, outgoingCallScreen: false, callInProgress: null });
			this.clearCallInProgress();
			this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_CANCELLED"]);

		} else {

			CometChat.rejectCall(this.state.callInProgress.sessionId, CometChat.CALL_STATUS.CANCELLED).then(call => {

				this.setState({ outgoingCallScreen: false, callInProgress: null });
				this.clearCallInProgress();
				this.props.actionGenerated(enums.ACTIONS["OUTGOING_CALL_CANCELLED"]);

			}).catch(error => {

				this.setState({ outgoingCallScreen: false, callInProgress: null });
				this.clearCallInProgress();

			});
		}
	}

	clearCallInProgress = () => {
		if (this.context) {
			this.context.setCallInProgress(null, "");
		}
	}

	render() {

		let callScreen = null, errorScreen = null;
		if (this.state.callInProgress) {

			let avatar = (<CometChatAvatar user={this.state.callInProgress.receiver} />);
			if (this.state.errorScreen) {
				errorScreen = (
					<div css={errorContainerStyle()} className="callscreen__error__wrapper"><div>{this.state.errorMessage}</div></div>
				);
			}

			if (this.state.outgoingCallScreen) {
				callScreen = (
					<div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}>
						<div css={callScreenContainerStyle()} className="callscreen__container">
							<div css={headerStyle()} className="callscreen__header">
								<span css={headerDurationStyle()} className="header__calling">{Translator.translate("CALLING", this.props.lang)}</span>
								<h6 css={headerNameStyle()} className="header__name">{this.state.callInProgress.receiver.name}</h6>
							</div>
							<div css={thumbnailWrapperStyle()} className="callscreen__thumbnail__wrapper">
								<div css={thumbnailStyle()} className="callscreen__thumbnail">{avatar}</div>
							</div>
							{errorScreen}
							<div css={headerIconStyle()} className="callscreen__icons">
								<div css={iconWrapperStyle()} className="icon__block" onClick={this.cancelCall}>
									<div css={iconStyle(callIcon)} className="icon icon__end"><i></i></div>
								</div>
							</div>
						</div>
					</div>
				);
			} else {
				callScreen = <CometChatCallScreen loggedInUser={this.loggedInUser} call={this.state.callInProgress} lang={this.props.lang} actionGenerated={this.actionHandler} />;
			}
		}
		return callScreen;
	}
}

// Specifies the default values for props:
CometChatOutgoingCall.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
};

CometChatOutgoingCall.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
}

export { CometChatOutgoingCall };
