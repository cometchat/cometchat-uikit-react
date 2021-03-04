import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import { actionMessageStyle, actionMessageTxtStyle } from "./style"

class CometChatActionMessageBubble extends React.Component {

    loggedInUser = null;

    constructor(props) {
        super(props);
        this.loggedInUser = props.loggedInUser;
    }

    getCallActionMessage = (message) => {

        const call = message;
        let actionMessage = null;

        switch (call.status) {

            case CometChat.CALL_STATUS.INITIATED: {

                actionMessage = Translator.translate("CALL_INITIATED", this.props.lang);
                if (call.type === CometChat.CALL_TYPE.AUDIO) {

                    if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {

                        actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("OUTGOING_AUDIO_CALL", this.props.lang) : Translator.translate("INCOMING_AUDIO_CALL", this.props.lang);

                    } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

                        if (call.action === CometChat.CALL_STATUS.INITIATED) {

                            actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("OUTGOING_AUDIO_CALL", this.props.lang) : Translator.translate("INCOMING_AUDIO_CALL", this.props.lang);

                        } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                            actionMessage = (call.sender.uid === this.loggedInUser.uid) ? Translator.translate("CALL_REJECTED", this.props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", this.props.lang)}`);
                        }
                    }

                } else if (call.type === CometChat.CALL_TYPE.VIDEO) {

                    if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {

                        actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("OUTGOING_VIDEO_CALL", this.props.lang) : Translator.translate("INCOMING_VIDEO_CALL", this.props.lang);

                    } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

                        if (call.action === CometChat.CALL_STATUS.INITIATED) {

                            actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("OUTGOING_VIDEO_CALL", this.props.lang) : Translator.translate("INCOMING_VIDEO_CALL", this.props.lang);

                        } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                            actionMessage = (call.sender.uid === this.loggedInUser.uid) ? Translator.translate("CALL_REJECTED", this.props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", this.props.lang)}`);
                        }
                    }
                }
                break;
            }
            case CometChat.CALL_STATUS.ONGOING: {

                if (call.receiverType === CometChat.RECEIVER_TYPE.USER) {

                    actionMessage = Translator.translate("CALL_ACCEPTED", this.props.lang);

                } else if (call.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

                    if (call.action === CometChat.CALL_STATUS.ONGOING) {

                        actionMessage = (call.sender.uid === this.loggedInUser.uid) ? Translator.translate("CALL_ACCEPTED", this.props.lang) : (`${call.sender.name} ${Translator.translate("JOINED", this.props.lang)}`);

                    } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                        actionMessage = (call.sender.uid === this.loggedInUser.uid) ? Translator.translate("CALL_REJECTED", this.props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", this.props.lang)}`);

                    } else if (call.action === "left") {

                        if (call.sender.uid === this.loggedInUser.uid) {

                            actionMessage = `${Translator.translate("YOU", this.props.lang)} ${Translator.translate("LEFT_THE_CALL", this.props.lang)}`;

                        } else {
                            actionMessage = `${call.sender.name} ${Translator.translate("LEFT_THE_CALL", this.props.lang)}`;
                        }
                    }
                }
                break;
            }
            case CometChat.CALL_STATUS.UNANSWERED: {

                actionMessage = Translator.translate("CALL_UNANSWERED", this.props.lang);

                if (call.type === CometChat.CALL_TYPE.AUDIO && (call.receiverType === CometChat.RECEIVER_TYPE.USER || call.receiverType === CometChat.RECEIVER_TYPE.GROUP)) {

                    actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("UNANSWERED_AUDIO_CALL", this.props.lang) : Translator.translate("MISSED_AUDIO_CALL", this.props.lang);

                } else if (call.type === CometChat.CALL_TYPE.VIDEO && (call.receiverType === CometChat.RECEIVER_TYPE.USER || call.receiverType === CometChat.RECEIVER_TYPE.GROUP)) {

                    actionMessage = (call.callInitiator.uid === this.loggedInUser.uid) ? Translator.translate("UNANSWERED_VIDEO_CALL", this.props.lang) : Translator.translate("MISSED_VIDEO_CALL", this.props.lang);
                }
                break;
            }
            case CometChat.CALL_STATUS.REJECTED:
                actionMessage = Translator.translate("CALL_REJECTED", this.props.lang);
                break;
            case CometChat.CALL_STATUS.ENDED:
                actionMessage = Translator.translate("CALL_ENDED", this.props.lang);
                break;
            case CometChat.CALL_STATUS.CANCELLED:
                actionMessage = Translator.translate("CALL_CANCELLED", this.props.lang);
                break;
            case CometChat.CALL_STATUS.BUSY:
                actionMessage = Translator.translate("CALL_BUSY", this.props.lang);
                break;
            default:
                break;
        }

        return actionMessage;
    }

    getActionMessage = (message) => {

        let actionMessage = null;

        if (message.hasOwnProperty("actionBy") === false || message.hasOwnProperty("actionOn") === false) {
            return actionMessage;
        }
        
        if (message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED
        && message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT
        && (message.actionBy.hasOwnProperty("name") === false || message.actionOn.hasOwnProperty("name") === false)) {
            return actionMessage;
        }
        
        if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED) {

            if (message.hasOwnProperty("data") && message.data.hasOwnProperty("extras")) {

                if (message.data.extras.hasOwnProperty("scope")) {

                    if (message.data.extras.scope.hasOwnProperty("new") === false) { return actionMessage; }

                } else { return actionMessage; }

            } else { return actionMessage; }
        }
        
        if (message.action === CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED 
            && (message.data.extras.hasOwnProperty("scope") === false || message.data.extras.scope.hasOwnProperty("new") === false)) {
            return actionMessage;
        }

        const byEntity = message.actionBy;
        const onEntity = message.actionOn;

        const byString = byEntity.name;
        const forString = (message.action !== CometChat.ACTION_TYPE.MEMBER_JOINED && message.action !== CometChat.ACTION_TYPE.MEMBER_LEFT) ? onEntity.name : "";
        
        switch (message.action) {

            case "added":
                actionMessage = `${byString} ${Translator.translate("ADDED", this.props.lang)} ${forString}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_JOINED:
                actionMessage = `${byString} ${Translator.translate("JOINED", this.props.lang)}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_LEFT:
                actionMessage = `${byString} ${Translator.translate("LEFT", this.props.lang)}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_KICKED:
                actionMessage = `${byString} ${Translator.translate("KICKED", this.props.lang)} ${forString}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_BANNED:
                actionMessage = `${byString} ${Translator.translate("BANNED", this.props.lang)} ${forString}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_UNBANNED:
                actionMessage = `${byString} ${Translator.translate("UNBANNED", this.props.lang)} ${forString}`;
                break;
            case CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED: {
                const newScope = message["data"]["extras"]["scope"]["new"];
                actionMessage = `${byString} ${Translator.translate("MADE", this.props.lang)} ${forString} ${Translator.translate(newScope, this.props.lang)}`;
                break;
            }
            default:
                break;
        }

        return actionMessage;
    }

    getMessage = (message) => {

        let actionMessage = null;
        
        if (message.category === CometChat.CATEGORY_CALL) {

            actionMessage = this.getCallActionMessage(message);

        } else if (message.category === CometChat.CATEGORY_ACTION) {
            
            actionMessage = this.getActionMessage(message);
        }

        return actionMessage;
    }

    render () {

        return (
            <div css={actionMessageStyle()} className="action__message">
                <p css={actionMessageTxtStyle()}>{this.getMessage(this.props.message)}</p>
            </div>
        )
    }
}

// Specifies the default values for props:
CometChatActionMessageBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
};

CometChatActionMessageBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
}

export default CometChatActionMessageBubble; 