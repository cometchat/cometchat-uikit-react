import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { ID, getUnixTimestamp } from "../../../util/common";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
    callScreenWrapperStyle,
} from "./style";

class CometChatOutgoingDirectCall extends React.Component {

    sessionID;

    constructor(props) {
        super(props);
        this.sessionID = `${props.item.guid}`;
    }

    componentDidMount() {
        this.startCall();
    }

    getReceiverDetails = () => {

        let receiverId;
        let receiverType;

        if (this.props.type === CometChat.RECEIVER_TYPE.USER) {

            receiverId = this.props.item.uid;
            receiverType = CometChat.RECEIVER_TYPE.USER;

        } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {

            receiverId = this.props.item.guid;
            receiverType = CometChat.RECEIVER_TYPE.GROUP;
        }

        return { "receiverId": receiverId, "receiverType": receiverType };
    }

    sendCustomMessage = () => {

        const { receiverId, receiverType } = this.getReceiverDetails();

        const customData = { "sessionID": this.sessionID, "callType": this.props.callType };
        const customType = enums.CUSTOM_TYPE_MEETING;

        let conversationId = null;
        if (this.props.type === CometChat.RECEIVER_TYPE.USER) {

            const users = [this.props.loggedInUser.uid, this.props.item.uid];
            conversationId = users.sort().join("_user_");
            
        } else if (this.props.type === CometChat.RECEIVER_TYPE.GROUP) {
            conversationId = `group_${this.props.item.guid}`
        }

        const customMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
        customMessage.setSender(this.props.loggedInUser);
        customMessage.setReceiver(this.props.type);
        customMessage.setConversationId(conversationId);
        customMessage._composedAt = getUnixTimestamp();
        customMessage._id = ID();

        this.props.actionGenerated(enums.ACTIONS["MESSAGE_COMPOSED"], [customMessage]);
        CometChat.sendCustomMessage(customMessage).then(message => {
            
            const newMessageObj = { ...message, "_id": customMessage._id };
            this.props.actionGenerated(enums.ACTIONS["MESSAGE_SENT"], newMessageObj);

        }).catch(error => {

            console.log("custom message sending failed with error", error);

            const newMessageObj = { ...customMessage, "error": error };
            this.props.actionGenerated(enums.ACTIONS["ERROR_IN_SENDING_MESSAGE"], newMessageObj);
        });

    }

    startCall = () => {

        let sessionID = `${this.props.item.guid}`;
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
                    this.props.actionGenerated(enums.ACTIONS["END_DIRECT_CALL"]);
                },
                onError: error => {
                    console.log("Error :", error);
                }
            })
        );

        //send custom message only when someone starts a direct call
        if (this.props.joinDirectCall === false) {
            this.sendCustomMessage();
        }
    }

    render() {

        return (
            <div css={callScreenWrapperStyle(this.props, keyframes)} className="callscreen__wrapper" ref={el => { this.callScreenFrame = el; }}></div>
        );
    }
}

// Specifies the default values for props:
CometChatOutgoingDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    callType: CometChat.CALL_TYPE.VIDEO,
    open: true,
    close: () => {},
    item: {},
    type: "",
    joinDirectCall: false
};

CometChatOutgoingDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    callType: PropTypes.string,
    open: PropTypes.bool,
    close: PropTypes.func,
    item: PropTypes.object,
    type: PropTypes.string,
    joinDirectCall: PropTypes.bool
}


export default CometChatOutgoingDirectCall;