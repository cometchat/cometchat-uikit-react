import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatContext } from "../../../util/CometChatContext";
import { ID, getUnixTimestamp } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    callScreenWrapperStyle,
} from "./style";

class CometChatOutgoingDirectCall extends React.Component {

    sessionID;
    static contextType = CometChatContext;
    
    constructor(props) {

        super(props);

        this.state = {
            callInProgress: null,
        }

        CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
            console.error(error);
        });
    }

    getSessionId = () => {

        if (this.props.group === null) {
            return false;
        }

        if (this.props.group.hasOwnProperty("guid") === false) {
            return false;
        }

        return `${this.props.group.guid}`;
    }

    startCall = (sessionID) => {

        this.sessionID = sessionID;
        if (this.sessionID === null) {
            const errorCode = "ERR_EMPTY_CALL_SESSION_ID";
            this.context.setToastMessage("error", errorCode);
            return false;
        }

        this.setState({ callInProgress: true });
        if(this.context) {
            this.context.setCallInProgress({"directCall": true}, enums.CONSTANTS["OUTGOING_DIRECT_CALLING"]);
        }

        setTimeout(() => {

            this.startDirectCall();
            this.sendCustomMessage();

        }, 5);
    }

    joinCall = (sessionID) => {

        this.sessionID = sessionID;
        if (this.sessionID === null) {
            const errorCode = "ERR_EMPTY_CALL_SESSION_ID";
            this.context.setToastMessage("error", errorCode);
            return false;
        }

        this.setState({ callInProgress: true });
        if (this.context) {
            this.context.setCallInProgress(true, enums.CONSTANTS["OUTGOING_DIRECT_CALLING"]);
        }

        setTimeout(() => {

            this.startDirectCall();

        }, 5);
    }

    sendCustomMessage = () => {

        const receiverType = CometChat.RECEIVER_TYPE.GROUP;
        const customData = { "sessionID": this.sessionID, "callType": CometChat.CALL_TYPE.VIDEO };
        const customType = enums.CUSTOM_TYPE_MEETING;

        const conversationId = `group_${this.sessionID}`

        const customMessage = new CometChat.CustomMessage(this.sessionID, receiverType, customType, customData);
        customMessage.setSender(this.loggedInUser);
        customMessage.setReceiver(receiverType);
        customMessage.setConversationId(conversationId);
        customMessage._composedAt = getUnixTimestamp();
        customMessage._id = ID();

        this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [customMessage]);
        CometChat.sendCustomMessage(customMessage).then(message => {

            const newMessageObj = { ...message, "_id": customMessage._id };
            this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

        }).catch(error => {

            const newMessageObj = { ...customMessage, "error": error };
            this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    startDirectCall = () => {

        let audioOnly = (this.props.callType === CometChat.CALL_TYPE.VIDEO) ? false : true;
        let defaultLayout = true;

        let callSettings = new CometChat.CallSettingsBuilder()
            .enableDefaultLayout(defaultLayout)
            .setSessionID(this.sessionID)
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
                        this.context.setCallInProgress(null, "");
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
        if(this.state.callInProgress) {
            callScreen = (
                <div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}></div>
            );
        }
        return callScreen;
    }
}

// Specifies the default values for props:
CometChatOutgoingDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    callType: CometChat.CALL_TYPE.VIDEO,
    group: null,
};

CometChatOutgoingDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    callType: PropTypes.string,
    group: PropTypes.oneOfType([PropTypes.object, PropTypes.shape(CometChat.Group)]),
}

export default CometChatOutgoingDirectCall;