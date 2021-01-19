import React from "react";
/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";


import * as enums from '../../util/enums.js';

import Translator from "../../resources/localization/translator";
import { theme } from "../../resources/theme";

import {
    callScreenWrapperStyle,
} from "./style";

class CometChatDirectCall extends React.Component {

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

        const customMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
        CometChat.sendCustomMessage(customMessage).then(message => {
            this.props.actionGenerated("messageComposed", [message]);
        }).catch(error => {
          console.log("custom message sending failed with error", error);
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
                                .build();

        const el = this.callScreenFrame;
        CometChat.startCall(
            callSettings,
            el,
            new CometChat.OngoingCallListener({
                onCallEnded: call => {
                    this.props.actionGenerated("directCallEnded");
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
CometChatDirectCall.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    callType: CometChat.CALL_TYPE.VIDEO,
    open: true,
    close: () => {},
    item: {},
    type: "",
    joinDirectCall: false
};

CometChatDirectCall.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    callType: PropTypes.string,
    open: PropTypes.bool,
    close: PropTypes.func,
    item: PropTypes.object,
    type: PropTypes.string,
    joinDirectCall: PropTypes.bool
}


export default CometChatDirectCall;