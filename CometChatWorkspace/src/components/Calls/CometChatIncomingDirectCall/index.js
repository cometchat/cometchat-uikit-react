import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";

import { messageAlertManager } from "./controller";

import { CometChatAvatar } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { validateWidgetSettings } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";
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

import videoCallIcon from "./resources/incomingvideocall.png";

class CometChatIncomingDirectCall extends React.PureComponent {

    constructor(props) {

        super(props);
        this._isMounted = false;
        this.state = {
            incomingMessage: null,
        }

        this.incomingAlert = new Audio(incomingCallAlert);
    }

    componentDidMount() {

        this._isMounted = true;

        this.MessageAlertManager = new messageAlertManager();
        this.MessageAlertManager.attachListeners(this.messageListenerCallback);
    }

    componentWillUnmount() {
        this._isMounted = false;
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

    messageListenerCallback = (key, message) => {

        switch (key) {

            case enums.CUSTOM_MESSAGE_RECEIVED://occurs at the callee end
                this.incomingMessageReceived(message);
                break;
            default:
                break;
        }
    }

    incomingMessageReceived = (message) => {

        if (this._isMounted) {

            if (message.type !== enums.CUSTOM_TYPE_MEETING) {
                return false;
            }

            this.playIncomingAlert();
            this.setState({ incomingMessage: message });
        }
    }

    joinDirectCall = () => {

        this.pauseIncomingAlert();
        this.props.actionGenerated(enums.ACTIONS["ACCEPT_DIRECT_CALL"], { ...this.state.incomingMessage });
        this.setState({ incomingMessage: null });
    }

    ignoreCall = () => {

        this.pauseIncomingAlert();
        this.setState({ incomingMessage: null });
    }

    render() {

        let messageScreen = null;
        if (this.state.incomingMessage) {

            let avatar = null;
            if (this.state.incomingMessage) {
                avatar = (
                    <div css={thumbnailStyle()} className="header__thumbnail">
                        <CometChatAvatar cornerRadius="50%" image={this.state.incomingMessage.sender.avatar} />
                    </div>
                );
            }

            const callType = (
                <React.Fragment>
                    <img src={videoCallIcon} alt={Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)} /><span>{Translator.translate("INCOMING_VIDEO_CALL", this.props.lang)}</span>
                </React.Fragment>
            );

            messageScreen = (
                <div css={incomingCallWrapperStyle(this.props, keyframes)} className="callalert__wrapper">
                    <div css={callContainerStyle()} className="callalert__container">
                        <div css={headerWrapperStyle()} className="callalert__header">
                            <div css={callDetailStyle()} className="header__detail">
                                <div css={nameStyle()} className="name">{this.state.incomingMessage.sender.name}</div>
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
        
        return messageScreen;
    }
}

// Specifies the default values for props:
CometChatIncomingDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatIncomingDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatIncomingDirectCall;
