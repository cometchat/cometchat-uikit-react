import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { messageAlertManager } from "./controller";

import { CometChatAvatar } from "../../Shared";
import { CometChatCallScreen } from "../CometChatCallScreen";

import { CometChatContext } from "../../../util/CometChatContext";
import { UIKitSettings } from "../../../util/UIKitSettings";
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
} from "./style";

import videoCallIcon from "./resources/incomingvideocall.png";

class CometChatIncomingDirectCall extends React.PureComponent {

    static contextType = CometChatContext;

    constructor(props) {

        super(props);
        this._isMounted = false;
        this.state = {
            incomingCall: null,
            callInProgress: null,
            maximize: true
        }

        UIKitSettings.setWidgetSettings(this.props.widgetsettings);

        this.callScreenRef = React.createRef();

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

                if (this.context.checkIfDirectCallIsOngoing() && this.context.getActiveCallSessionID() === message.data.customData.sessionID) {
                    return false;
                }                
            }

            SoundManager.play(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
            this.setState({ incomingCall: message });
        }
    }

    joinCall = () => {

        this.checkForActiveCallAndEndCall().then(response => {

            SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
            this.props.actionGenerated(enums.ACTIONS["ACCEPT_DIRECT_CALL"], true);

            if(this.context) {
                this.context.setCallInProgress(this.state.incomingCall, enums.CONSTANTS["INCOMING_DIRECT_CALLING"]);
            }
            this.setState({ incomingCall: null, callInProgress: this.state.incomingCall });

        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    ignoreCall = () => {

        SoundManager.pause(enums.CONSTANTS.AUDIO["INCOMING_CALL"]);
        this.setState({ incomingCall: null });
    }

    checkForActiveCallAndEndCall = () => {

        const promise = new Promise((resolve, reject) => {

            if (this.isCallActive() === false) {
                return resolve({ "success": true });
            }

            let sessionID = this.getActiveCallSessionID();
            CometChat.endCall(sessionID).then(response => {
                return resolve(response);
            }).catch(error => {
                return reject(error);
            });
        });

        return promise;
    }

    isCallActive = () => {

        if (Object.keys(this.context.callInProgress).length === 0) {
            return false;
        }

        let sessionID = this.getActiveCallSessionID();
        if (!sessionID) {
            return false;
        }

        return true;
    }

    getActiveCallSessionID = () => {

        return this.context.getActiveCallSessionID();
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
    }

    render() {

        let callScreen = null, incomingCallAlert = null;
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

            incomingCallAlert = (
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
                            <button type="button" css={ButtonStyle(this.props, 1)} className="button button__join" onClick={this.joinCall}>{Translator.translate("JOIN", this.props.lang)}</button>
                        </div>
                    </div>
                </div>
            );
        }

        if (this.state.callInProgress) {

            callScreen = (
                <CometChatCallScreen ref={this.callScreenRef} loggedInUser={this.loggedInUser} call={this.state.callInProgress} actionGenerated={this.actionHandler} />
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
CometChatIncomingDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
};

CometChatIncomingDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
}

export default CometChatIncomingDirectCall;