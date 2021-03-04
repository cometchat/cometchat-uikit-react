import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CallAlertManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";
import { incomingCallAlert } from "../../../resources/audio";

import {
    incomingCallWrapperStyle,
    callContainerStyle,
    headerWrapperStyle,
    callDetailStyle,
    nameStyle,
    callTypeStyle,
    thumbnailStyle,
    headerButtonStyle,
    ButtonStyle
} from "./style";

import audioCallIcon from "./resources/incomingaudiocall.png";
import videoCallIcon from "./resources/incomingvideocall.png";

class CometChatIncomingCall extends React.PureComponent {

    constructor(props) {

        super(props);

        this.state = {
            incomingCall: null,
            callInProgress: null
        }

        this.incomingAlert = new Audio(incomingCallAlert);
    }

    componentDidMount() {

        this.CallAlertManager = new CallAlertManager();
        this.CallAlertManager.attachListeners(this.callScreenUpdated);
    }

    playIncomingAlert = () => {

        //if audio sound is disabled in chat widget
        if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_calls") === false) {
            return false;
        }

        this.incomingAlert.currentTime = 0;
        if (typeof this.incomingAlert.loop == 'boolean') {
            this.incomingAlert.loop = true;
        } else {
            this.incomingAlert.addEventListener('ended', function () {
                this.currentTime = 0;
                this.play();
            }, false);
        }
        this.incomingAlert.play();
    }

    pauseIncomingAlert = () => {

        //if audio sound is disabled in chat widget
        if (validateWidgetSettings(this.props.widgetsettings, "enable_sound_for_calls") === false) {
            return false;
        }
        
        this.incomingAlert.pause();
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

        const activeCall = CometChat.getActiveCall();
        
        //if there is another call in progress
        if (activeCall) {

            CometChat.rejectCall(incomingCall.sessionId, CometChat.CALL_STATUS.BUSY).then(rejectedCall => {

                this.props.actionGenerated("rejectedIncomingCall", incomingCall, rejectedCall);

            }).catch(error => {
                
                this.props.actionGenerated("callError", error);
                console.log("Call rejection failed with error:", error);
            });

        } else if (this.state.incomingCall === null) {

            this.playIncomingAlert();
            this.setState({ incomingCall: incomingCall });
        }
    }

    incomingCallCancelled = (call) => {

        //we are not marking this as read as it will done in messagelist component
        this.pauseIncomingAlert();
        this.setState({ incomingCall: null });
    }

    rejectCall = () => {

        this.pauseIncomingAlert();
        CometChat.rejectCall(this.state.incomingCall.sessionId, CometChat.CALL_STATUS.REJECTED).then(rejectedCall => {
            
            this.props.actionGenerated("rejectedIncomingCall", this.state.incomingCall, rejectedCall);
            this.setState({ incomingCall: null });

        }).catch(error => {

            this.props.actionGenerated("callError", error);
            this.setState({ incomingCall: null });
        });
    }

    acceptCall = () => {
        
        this.pauseIncomingAlert();
        CometChat.acceptCall(this.state.incomingCall.sessionId).then(call => {

            this.props.actionGenerated("acceptedIncomingCall", call);
            this.setState({ incomingCall: null });

        }).catch(error => {

            this.props.actionGenerated("callError", error);
            this.setState({ incomingCall: null });
        });
    }

    render() {
        
        let callScreen = null;
        if (this.state.incomingCall) {
            
            let callType = (
                <React.Fragment>
                    <img src={audioCallIcon} alt={Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)} /><span>{Translator.translate("INCOMING_AUDIO_CALL", this.props.lang)}</span>
                </React.Fragment>
            );
            if (this.state.incomingCall.type === "video") {
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
                            <button type="button" css={ButtonStyle(this.props, 0)} className="button button__decline" onClick={this.rejectCall}>{Translator.translate("DECLINE", this.props.lang)}</button>
                            <button type="button" css={ButtonStyle(this.props, 1)} className="button button__accept" onClick={this.acceptCall}>{Translator.translate("ACCEPT", this.props.lang)}</button>
                        </div>
                    </div>
                </div>
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
