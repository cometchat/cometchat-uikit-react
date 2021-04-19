import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { messageAlertManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";
import { SoundManager } from "../../../util/SoundManager";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

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

import videoCallIcon from "./resources/incomingvideocall.png";

class CometChatIncomingDirectCall extends React.PureComponent {

    static contextType = CometChatContext;

    constructor(props) {

        super(props);
        this._isMounted = false;
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

        this._isMounted = true;

        this.MessageAlertManager = new messageAlertManager();
        this.MessageAlertManager.attachListeners(this.messageListenerCallback);

        SoundManager.setWidgetSettings(this.props.widgetsettings);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    messageListenerCallback = (key, message) => {

        switch (key) {

            case enums.CUSTOM_MESSAGE_RECEIVED://occurs at the callee end
                this.incomingCallReceived(message);
                break;
            default:
                break;
        }
    }

    incomingCallReceived = (message) => {

        if (this._isMounted) {

            if (message.type !== enums.CUSTOM_TYPE_MEETING) {
                return false;
            }

            if (Object.keys(this.context.callInProgress).length) {
                return;
            }

            SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
            this.setState({ incomingCall: message });
        }
    }

    joinDirectCall = () => {

        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        this.props.actionGenerated(enums.ACTIONS["ACCEPT_DIRECT_CALL"], true);

        if(this.context) {
            this.context.setCallInProgress(this.state.incomingCall, enums.CONSTANTS["INCOMING_DIRECT_CALLING"]);
        }
        this.setState({ incomingCall: null, callInProgress: this.state.incomingCall });

        setTimeout(() => {
            this.startCall();
        }, 5);
    }

    ignoreCall = () => {

        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        this.setState({ incomingCall: null });
    }

    startCall = () => {

        if (this.state.callInProgress && this.state.callInProgress.hasOwnProperty("receiverId") === false) {

            const errorCode = "ERR_EMPTY_CALL_SESSION_ID";
            this.context.setToastMessage("error", errorCode);
            return false;
        }
        
        let sessionID = `${this.state.callInProgress.receiverId}`;
        let audioOnly = false;
        let defaultLayout = true;

        let callSettings = new CometChat.CallSettingsBuilder()
            .enableDefaultLayout(defaultLayout)
            .setSessionID(sessionID)
            .setIsAudioOnlyCall(audioOnly)
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
                onCallEnded: call => {

                    if (this.context) {
                        this.context.setCallInProgress({}, "");
                    }
                    this.setState({ callInProgress: null });
                    this.props.actionGenerated(enums.ACTIONS["DIRECT_CALL_ENDED"]);
                },
                onError: error => {
                    
                    if (this.context) {
                        this.context.setCallInProgress(null, "");
                    }
                    this.setState({ callInProgress: null });
                    this.props.actionGenerated(enums.ACTIONS["DIRECT_CALL_ERROR"]);
                    
                    const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
                    this.context.setToastMessage("error", errorCode);
                }
            })
        );
    }

    render() {

        let callScreen = null;
        if (this.state.incomingCall) {

            let avatar = (
                <div css={thumbnailStyle()} className="header__thumbnail">
                    <CometChatAvatar cornerRadius="50%" image={this.state.incomingCall.sender.avatar} />
                </div>
            );

            const callType = (
                <React.Fragment>
                    <img src={videoCallIcon} alt={Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)} /><span>{Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)}</span>
                </React.Fragment>
            );

            callScreen = (
                <div css={incomingCallWrapperStyle(this.props, keyframes)} className="callalert__wrapper">
                    <div css={callContainerStyle()} className="callalert__container">
                        <div css={headerWrapperStyle()} className="callalert__header">
                            <div css={callDetailStyle()} className="header__detail">
                                <div css={nameStyle()} className="name">{this.state.incomingCall.sender.name}</div>
                                <div css={callTypeStyle(this.props)} className="calltype">{callType}</div>
                            </div>
                            {avatar}
                        </div>
                        <div css={headerButtonStyle()} className="callalert__buttons">
                            <button type="button" css={ButtonStyle(this.props, 0)} className="button button__ignore" onClick={this.ignoreCall}>{Translator.translate("IGNORE", this.props.lang)}</button>
                            <button type="button" css={ButtonStyle(this.props, 1)} className="button button__join" onClick={this.joinDirectCall}>{Translator.translate("JOIN", this.props.lang)}</button>
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
CometChatIncomingDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
};

CometChatIncomingDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
}

export default CometChatIncomingDirectCall;
