import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import { callMessageStyle, callMessageTxtStyle } from "./style";

const callmessage = (props) => {

    const getMessage = () => {

        const sender = (props.loggedInUser.uid === props.message.sender.uid) ? "You" : props.message.sender.name;
        const receiver = (props.loggedInUser.uid === props.message.receiver.uid) ? "You" : props.message.receiver.name;

        let message = null;
        switch (props.message.action) {
    
            case CometChat.CALL_STATUS.UNANSWERED:
                message = `${receiver} had missed call from ${sender}`;
                break;
            case CometChat.CALL_STATUS.REJECTED:
                message = `${sender} had rejected call from ${receiver}`;
                break;
            case CometChat.CALL_STATUS.ONGOING:
                message = `${sender} had joined the call with ${receiver}`;
                break;
            case CometChat.CALL_STATUS.INITIATED:
                message = `${sender} had initiated the call with ${receiver}`;
                break;
            case CometChat.CALL_STATUS.ENDED:
                message = `${sender} ended the call with ${receiver}`;
                break;
            case CometChat.CALL_STATUS.CANCELLED:
                message = `${sender} cancelled the call with ${receiver}`;
                break;
            case CometChat.CALL_STATUS.BUSY:
                message = (props.loggedInUser.uid === props.message.sender.uid) ? `${sender} were busy on another call` : `${sender} was busy on another call`;
                break;
            default:
                break;
        }

        return <p css={callMessageTxtStyle}>{message}</p>
    }

    return (
        <div css={callMessageStyle()}>{getMessage()}</div>
    )
}

export default callmessage;