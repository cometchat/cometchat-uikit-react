import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

const callmessage = (props) => {

    const getMessage = () => {

        switch (props.message.action) {
    
            case CometChat.CALL_STATUS.UNANSWERED:
                return <p className="chat-txt-msg">{props.message.receiver.name + " had missed call from " + props.message.sender.name}</p>
            case CometChat.CALL_STATUS.REJECTED:
                return <p className="chat-txt-msg">{props.message.sender.name + " had rejected call with " + props.message.receiver.name} </p>
            case CometChat.CALL_STATUS.ONGOING:
                return <p className="chat-txt-msg">{props.message.sender.name + " had joined the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.INITIATED:
                return <p className="chat-txt-msg">{props.message.sender.name + " had initiated the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.ENDED:
                return <p className="chat-txt-msg">{props.message.sender.name + " ended the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.CANCELLED:
                return <p className="chat-txt-msg">{props.message.sender.name + " cancelled the call with " + props.message.receiver.name}</p>
            default:
                break;
        }
    }

    return (
    <div className="cc1-chat-win-action-msg-wrap">{getMessage()}</div>
    )
}

export default callmessage;