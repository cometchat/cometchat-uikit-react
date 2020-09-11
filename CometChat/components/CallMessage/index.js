import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from "@cometchat-pro/chat";

import { callMessageStyle, callMessageTxtStyle } from "./style";

const callmessage = (props) => {

    const getMessage = () => {

        switch (props.message.action) {
    
            case CometChat.CALL_STATUS.UNANSWERED:
                return <p css={callMessageTxtStyle}>{props.message.receiver.name + " had missed call from " + props.message.sender.name}</p>
            case CometChat.CALL_STATUS.REJECTED:
                return <p css={callMessageTxtStyle}>{props.message.sender.name + " had rejected call with " + props.message.receiver.name} </p>
            case CometChat.CALL_STATUS.ONGOING:
                return <p css={callMessageTxtStyle}>{props.message.sender.name + " had joined the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.INITIATED:
                return <p css={callMessageTxtStyle}>{props.message.sender.name + " had initiated the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.ENDED:
                return <p css={callMessageTxtStyle}>{props.message.sender.name + " ended the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.CANCELLED:
                return <p css={callMessageTxtStyle}>{props.message.sender.name + " cancelled the call with " + props.message.receiver.name}</p>
            default:
                break;
        }
    }

    return (
        <div css={callMessageStyle()}>{getMessage()}</div>
    )
}

export default callmessage;