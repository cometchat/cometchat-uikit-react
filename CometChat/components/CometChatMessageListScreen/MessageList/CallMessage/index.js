import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

const callmessage = (props) => {

    const getMessage = () => {

        switch (props.message.action) {
    
            case CometChat.CALL_STATUS.UNANSWERED:
                return <p>{props.message.receiver.name + " had missed call from " + props.message.sender.name}</p>
            case CometChat.CALL_STATUS.REJECTED:
                return <p>{props.message.sender.name + " had rejected call with " + props.message.receiver.name} </p>
            case CometChat.CALL_STATUS.ONGOING:
                return <p>{props.message.sender.name + " had joined the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.INITIATED:
                return <p>{props.message.sender.name + " had initiated the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.ENDED:
                return <p>{props.message.sender.name + " ended the call with " + props.message.receiver.name}</p>
            case CometChat.CALL_STATUS.CANCELLED:
                return <p>{props.message.sender.name + " cancelled the call with " + props.message.receiver.name}</p>
            default:
                break;
        }
    }

    return (
        <div className="cp-call-message-container">{getMessage()}</div>
    )
}

export default callmessage;