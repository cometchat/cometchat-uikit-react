import React from "react";
import "./style.scss";
import blueDoubleTick from "./resources/blue-double-tick-icon.png";
import greyDoubleTick from "./resources/grey-double-tick-icon.png";
import greyTick from "./resources/grey-tick-icon.png";
import { CometChat } from "@cometchat-pro/chat";


class CallMessage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }

    }
    static getDerivedStateFromProps(props, state) {
        return props;
    }
    printMessage = (message) => {
        switch (message.action) {
            case CometChat.CALL_STATUS.UNANSWERED:
                return <p>{message.receiver.name + " had missed call from " + message.sender.name}</p>
                break;
            case CometChat.CALL_STATUS.REJECTED:
                return <p>{message.sender.name + " had rejected call with " + message.receiver.name} </p>
                break;
            case CometChat.CALL_STATUS.ONGOING:
                return <p>{message.sender.name + " had joined the call with " + message.receiver.name}</p>
                break;
            case CometChat.CALL_STATUS.INITIATED:
                return <p>{message.sender.name + " had initiated the call with " + message.receiver.name}</p>
                break;
            case CometChat.CALL_STATUS.ENDED:
                return <p>{message.sender.name + " ended the call with " + message.receiver.name}</p>
                break;
            case CometChat.CALL_STATUS.CANCELLED:
                return <p>{message.sender.name + " rejected the call with " + message.receiver.name}</p>
                break;

            default:
                break;
        }
    }

    render() {
        return (

            <div className="cp-call-message-container" >

                {this.printMessage(this.state.message)}

            </div>

        );
    }
}



export default CallMessage;
export const senderVideoBubble = CallMessage;
