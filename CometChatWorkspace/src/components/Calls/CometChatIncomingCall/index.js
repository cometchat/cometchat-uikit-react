import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CallAlertManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { SoundManager } from "../../../util/SoundManager";

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
    callScreenWrapperStyle
} from "./style";

import audioCallIcon from "./resources/incomingaudiocall.png";
import videoCallIcon from "./resources/incomingvideocall.png";

class CometChatIncomingCall extends React.PureComponent {

    static contextType = CometChatContext;

    constructor(props) {

        super(props);

        this.state = {
            incomingCall: null,
            callInProgress: null
        }

        this.callScreenFrame = React.createRef();

        CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
            console.error(error);
        });
    }

    componentDidMount() {

        this.CallAlertManager = new CallAlertManager();
        this.CallAlertManager.attachListeners(this.callScreenUpdated);

        SoundManager.setWidgetSettings(this.props.widgetsettings);
    }

    callScreenUpdated = (key, call) => {
        
        switch (key) {

            case enums.INCOMING_CALL_RECEIVED://occurs at the callee end
                this.incomingCallReceived(call);
                break;
            case enums.INCOMING_CALL_CANCELLED://occurs(call dismissed) at the callee end, caller cancels the call
                this.incomingCallCancelled(call);
                break;
            default:
                break;
        }
    }

    incomingCallReceived = (incomingCall) => {

        //if there is another call in progress
        if (CometChat.getActiveCall()) {

            this.rejectCall(CometChat.CALL_STATUS.BUSY);

        } else if (this.state.incomingCall === null) {

            SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
            this.setState({ incomingCall: incomingCall });
        }
    }

    incomingCallCancelled = (call) => {

        //we are not marking this as read as it will done in messagelist component
        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        this.setState({ incomingCall: null });
    }

    rejectCall = (callStatus = CometChat.CALL_STATUS.REJECTED) => {

        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        CometChat.rejectCall(this.state.incomingCall.sessionId, callStatus).then(rejectedCall => {
            
            this.props.actionGenerated(enums.ACTIONS["INCOMING_CALL_REJECTED"], rejectedCall);
            this.setState({ incomingCall: null, callInProgress: null });

        }).catch(error => {

            this.setState({ incomingCall: null, callInProgress: null });
            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    acceptCall = () => {
        
        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        CometChat.acceptCall(this.state.incomingCall.sessionId).then(call => {

            if(this.context) {
                this.context.setCallInProgress(call, enums.CONSTANTS["INCOMING_DEFAULT_CALLING"]);
            }
            this.props.actionGenerated(enums.ACTIONS["INCOMING_CALL_ACCEPTED"], call);
            this.setState({ incomingCall: null, callInProgress: call });
            this.startCall();

        }).catch(error => {

            this.context.setCallInProgress(null, "");
            this.setState({ incomingCall: null, callInProgress: null });

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }
    
    startCall = () => {

        const call = this.state.callInProgress;
        const sessionId = call.getSessionId();
        const callType = (call.type === CometChat.CALL_TYPE.AUDIO) ? true : false;

        const callSettings = new CometChat.CallSettingsBuilder()
            .setSessionID(sessionId)
            .enableDefaultLayout(true)
            .setMode(CometChat.CALL_MODE.DEFAULT)
            .setIsAudioOnlyCall(callType)
            .setLocalizedStringObject({
                "SELECT_VIDEO_SOURCE": Translator.translate("SELECT_VIDEO_SOURCE", this.props.lang),
                "SELECT_INPUT_AUDIO_SOURCE": Translator.translate("SELECT_INPUT_AUDIO_SOURCE", this.props.lang),
                "SELECT_OUTPUT_AUDIO_SOURCE": Translator.translate("SELECT_OUTPUT_AUDIO_SOURCE", this.props.lang)
            }).build();

        const el = this.callScreenFrame;
        CometChat.startCall(
            callSettings,
            el,
            new CometChat.OngoingCallListener({
                onUserJoined: user => {

                    /* Notification received here if another user joins the call. */
                    /* this method can be use to display message or perform any actions if someone joining the call */
                    //call initiator gets the same info in outgoingcallaccpeted event
                    if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

                        const callMessage = {
                            "category": call.category,
                            "type": call.type,
                            "action": call.action,
                            "status": call.status,
                            "callInitiator": call.callInitiator,
                            "callReceiver": call.callReceiver,
                            "receiverId": call.receiverId,
                            "receiverType": call.receiverType,
                            "sentAt": call.sentAt,
                            "sender": { ...user }
                        };
                        this.props.actionGenerated(enums.ACTIONS["USER_JOINED_CALL"], callMessage);
                    }
                },
                onUserLeft: user => {
                    /* Notification received here if another user left the call. */
                    /* this method can be use to display message or perform any actions if someone leaving the call */
                    //call initiator gets the same info in outgoingcallaccpeted event
                    if (call.callInitiator.uid !== this.loggedInUser.uid && call.callInitiator.uid !== user.uid) {

                        const callMessage = {
                            "category": call.category,
                            "type": call.type,
                            "action": "left",
                            "status": call.status,
                            "callInitiator": call.callInitiator,
                            "callReceiver": call.callReceiver,
                            "receiverId": call.receiverId,
                            "receiverType": call.receiverType,
                            "sentAt": call.sentAt,
                            "sender": { ...user }
                        };

                        this.props.actionGenerated(enums.ACTIONS["USER_LEFT_CALL"], callMessage);
                    }
                },
                onCallEnded: endedCall => {

                    /* Notification received here if current ongoing call is ended. */
                    this.setState({ callInProgress: null });
                    if (this.context) {
                        this.context.setCallInProgress(null, "");
                    }
                    this.props.actionGenerated(enums.ACTIONS["INCOMING_CALL_ENDED"], endedCall);
                    /* hiding/closing the call screen can be done here. */
                }
            })
        );
    }

    render() {
        
        let callScreen = null;
        if (this.state.incomingCall) {
            
            let callType = (
                <React.Fragment>
                    <img src={audioCallIcon} alt={Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)} /><span>{Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)}</span>
                </React.Fragment>
            );
            if (this.state.incomingCall.type === CometChat.CALL_TYPE.VIDEO) {
                callType = (
                    <React.Fragment>
                        <img src={videoCallIcon} alt={Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)} /><span>{Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)}</span>
                    </React.Fragment>
                );
            }
            
            callScreen = (
                <div css={incomingCallWrapperStyle(this.props, keyframes)} className="callalert__wrapper">
                    <div css={callContainerStyle()} className="callalert__container">
                        <div css={headerWrapperStyle()} className="callalert__header">
                            <div css={callDetailStyle()} className="header__detail">
                                <div css={nameStyle()} className="name">{this.state.incomingCall.sender.name}</div>
                                <div css={callTypeStyle(this.props)} className="calltype">{callType}</div>
                            </div>
                            <div css={thumbnailStyle()} className="header__thumbnail">
                                <CometChatAvatar user={this.state.incomingCall.sender} />
                            </div>
                        </div>
                        <div css={headerButtonStyle()} className="callalert__buttons">
                            <button type="button" css={ButtonStyle(this.props, 0)} className="button button__decline" onClick={() => this.rejectCall(CometChat.CALL_STATUS.REJECTED)}>{Translator.translate("DECLINE", this.props.lang)}</button>
                            <button type="button" css={ButtonStyle(this.props, 1)} className="button button__accept" onClick={this.acceptCall}>{Translator.translate("ACCEPT", this.props.lang)}</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (this.state.callInProgress) {

            callScreen = (
                <div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}></div>
            );
        }
        
        return callScreen;
    }
}

// Specifies the default values for props:
CometChatIncomingCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatIncomingCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatIncomingCall;