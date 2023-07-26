import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CallAlertManager } from "./controller";

import { CometChatCallScreen } from "../CometChatCallScreen";
import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { SoundManager } from "../../../util/SoundManager";
import { Storage } from "../../../util/Storage";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	incomingCallWrapperStyle,
	callContainerStyle,
	headerWrapperStyle,
	callDetailStyle,
	nameStyle,
	callTypeStyle,
	thumbnailStyle,
	headerButtonStyle,
	ButtonStyle,
	callIconStyle,
} from "./style";

import audioCallIcon from "./resources/incoming-call.svg";
import videoCallIcon from "./resources/incoming-video-call.svg";

class CometChatIncomingCall extends React.PureComponent {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			incomingCall: null,
			callInProgress: null,
		};

		this.callButtonRef = React.createRef();

		CometChat.getLoggedinUser()
			.then((user) => (this.loggedInUser = user))
			.catch((error) => {
				console.error(error);
			});
	}

	componentDidMount() {
		this._isMounted = true;

		this.CallAlertManager = new CallAlertManager();
		this.CallAlertManager.attachListeners(this.callScreenUpdated);

		Storage.attachChangeDetection(this.logStorageChange);
	}

	componentDidUpdate() {
		if (this.state.incomingCall) {
			this.adjustFontSize();
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
		Storage.detachChangeDetection(this.logStorageChange);
	}

	adjustFontSize = () => {
		if (this.callButtonRef && this.callButtonRef.current) {
			let reduceFontSize = false;
			const buttonNodeList =
				this.callButtonRef.current.querySelectorAll("button");

			buttonNodeList.forEach((buttonNode) => {
				const parentContainerWidth = buttonNode.clientWidth;
				const currentTextWidth = buttonNode.scrollWidth;

				if (parentContainerWidth < currentTextWidth) {
					reduceFontSize = true;
				}
			});

			if (reduceFontSize) {
				buttonNodeList.forEach((buttonNode) => {
					buttonNode.style.fontSize = "85%";
				});
			}
		}
	};

	callScreenUpdated = (key, call) => {
		switch (key) {
			case enums.INCOMING_CALL_RECEIVED: //occurs at the callee end
				this.incomingCallReceived(call);
				break;
			case enums.INCOMING_CALL_CANCELLED: //occurs(call dismissed) at the callee end, caller cancels the call
				this.incomingCallCancelled(call);
				break;
			case enums.OUTGOING_CALL_ACCEPTED: //occurs(call dismissed) at the callee end, caller cancels the call
				this.outgoingCallAccepted(call);
				break;
			default:
				break;
		}
	};

	incomingCallReceived = (incomingCall) => {
		if (this._isMounted) {
			if (this.state.incomingCall === null) {
				if (incomingCall?.callInitiator.uid !== this.loggedInUser?.uid) {
					SoundManager.play(
						enums.CONSTANTS.AUDIO["INCOMING_CALL"],
						this.context
					);
					this.setState({ incomingCall: incomingCall });
				}
			}
		}
	};

	incomingCallCancelled = (call) => {
		if (this._isMounted) {
			//we are not marking this as read as it will done in messagelist component
			SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"], this.context);
			this.setState({ incomingCall: null });
		}
	};

	outgoingCallAccepted = (call) => {
		if (call.sender?.uid === this.loggedInUser?.uid) {
			if (this._isMounted) {
				//we are not marking this as read as it will done in messagelist component
				SoundManager.pause(
					enums.CONSTANTS.AUDIO["INCOMING_CALL"],
					this.context
				);
				this.setState({ incomingCall: null });
			}
		}
	};

	rejectCall = () => {
		SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"], this.context);
		let callStatus = this.isCallActive()
			? CometChat.CALL_STATUS.BUSY
			: CometChat.CALL_STATUS.REJECTED;

		CometChat.rejectCall(this.state.incomingCall.sessionId, callStatus)
			.then((rejectedCall) => {
				if (this.isCallActive() === false) {
					if (this.context) {
						this.context.setCallInProgress(null, "");
					}
					Storage.setItem(enums.CONSTANTS["ACTIVECALL"], rejectedCall);
					this.props.actionGenerated(
						enums.ACTIONS["INCOMING_CALL_REJECTED"],
						rejectedCall
					);
					this.setState({ callInProgress: null });
				}

				this.setState({ incomingCall: null });
			})
			.catch((error) => {
				this.setState({ incomingCall: null, callInProgress: null });
				const errorCode =
					error && error.hasOwnProperty("code") ? error.code : "ERROR";
				this.context.setToastMessage("error", errorCode);
			});
	};

	acceptCall = () => {
		this.checkForActiveCallAndEndCall()
			.then((response) => {
				SoundManager.pause(
					enums.CONSTANTS.AUDIO["INCOMING_CALL"],
					this.context
				);
				CometChat.acceptCall(this.state.incomingCall.sessionId)
					.then((call) => {
						if (this.context) {
							this.context.setCallInProgress(
								call,
								enums.CONSTANTS["INCOMING_DEFAULT_CALLING"]
							);
						}
						Storage.setItem(enums.CONSTANTS["ACTIVECALL"], call);
						this.props.actionGenerated(
							enums.ACTIONS["INCOMING_CALL_ACCEPTED"],
							call
						);
						this.setState({ incomingCall: null, callInProgress: call });
					})
					.catch((error) => {
						if (this.context) {
							this.context.setCallInProgress(null, "");
						}
						this.setState({ incomingCall: null, callInProgress: null });

						const errorCode =
							error && error.hasOwnProperty("code") ? error.code : "ERROR";
						this.context.setToastMessage("error", errorCode);
					});
			})
			.catch((error) => {
				const errorCode =
					error && error.hasOwnProperty("code") ? error.code : "ERROR";
				this.context.setToastMessage("error", errorCode);
			});
	};

	isCallActive = () => {
		if (Object.keys(this.context.callInProgress).length === 0) {
			return false;
		}

		let sessionID = this.getActiveCallSessionID();
		if (!sessionID) {
			return false;
		}

		return true;
	};

	getActiveCallSessionID = () => {
		return this.context.getActiveCallSessionID();
	};

	checkForActiveCallAndEndCall = () => {
		const promise = new Promise((resolve, reject) => {
			if (this.isCallActive() === false) {
				return resolve({ success: true });
			}

			let sessionID = this.getActiveCallSessionID();
			CometChat.endCall(sessionID)
				.then((response) => {
					return resolve(response);
				})
				.catch((error) => {
					return reject(error);
				});
		});

		return promise;
	};

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
	};

	logStorageChange = (event) => {
		if (event?.key !== enums.CONSTANTS["ACTIVECALL"]) {
			return false;
		}

		if (event.newValue || event.oldValue) {
			let call;
			if (event.newValue) {
				call = JSON.parse(event.newValue);
			} else if (event.oldValue) {
				call = JSON.parse(event.oldValue);
			}

			if (this.state.incomingCall?.getSessionId() === call?.sessionId) {
				SoundManager.pause(
					enums.CONSTANTS.AUDIO["INCOMING_CALL"],
					this.context
				);
				this.setState({ incomingCall: null });
			}
		}
	};

	render() {
		let callScreen = null,
			incomingCallAlert = null;
		if (this.state.incomingCall) {
			let callType = (
				<React.Fragment>
					<i
						css={callIconStyle(audioCallIcon, this.context)}
						title={Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)}
					></i>
					<span>
						{Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)}
					</span>
				</React.Fragment>
			);
			if (this.state.incomingCall.type === CometChat.CALL_TYPE.VIDEO) {
				callType = (
					<React.Fragment>
						<i
							css={callIconStyle(videoCallIcon, this.context)}
							title={Translator.translate(
								"INCOMING_VIDEO_CALL",
								this.props.lang
							)}
						></i>
						<span>
							{Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)}
						</span>
					</React.Fragment>
				);
			}

			incomingCallAlert = (
				<div
					css={incomingCallWrapperStyle(this.props, keyframes)}
					className='callalert__wrapper'
				>
					<div css={callContainerStyle()} className='callalert__container'>
						<div css={headerWrapperStyle()} className='callalert__header'>
							<div css={callDetailStyle()} className='header__detail'>
								<div css={nameStyle()} className='name'>
									{this.state.incomingCall.sender.name}
								</div>
								<div css={callTypeStyle(this.props)} className='calltype'>
									{callType}
								</div>
							</div>
							<div css={thumbnailStyle()} className='header__thumbnail'>
								<CometChatAvatar user={this.state.incomingCall.sender} />
							</div>
						</div>
						<div
							css={headerButtonStyle()}
							className='callalert__buttons'
							ref={this.callButtonRef}
						>
							<button
								type='button'
								css={ButtonStyle(this.props, 0)}
								className='button button__decline'
								onClick={() =>
									this.rejectCall(
										this.state.incomingCall,
										CometChat.CALL_STATUS.REJECTED
									)
								}
							>
								{Translator.translate("DECLINE", this.props.lang)}
							</button>
							<button
								type='button'
								css={ButtonStyle(this.props, 1)}
								className='button button__accept'
								onClick={this.acceptCall}
							>
								{Translator.translate("ACCEPT", this.props.lang)}
							</button>
						</div>
					</div>
				</div>
			);
		}

		if (this.state.callInProgress) {
			callScreen = (
				<CometChatCallScreen
					loggedInUser={this.loggedInUser}
					call={this.state.callInProgress}
					lang={this.props.lang}
					actionGenerated={this.actionHandler}
					widgetsettings={this.props.widgetsettings}
				/>
			);
		}

		return (
			<React.Fragment>
				{incomingCallAlert}
				{callScreen}
			</React.Fragment>
		);
	}
}

// Specifies the default values for props:
CometChatIncomingCall.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
	widgetsettings: {}
};

CometChatIncomingCall.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
	widgetsettings: PropTypes.object,
};

export { CometChatIncomingCall };
