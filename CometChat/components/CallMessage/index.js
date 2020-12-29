import { useCallback } from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";

import Translator from "../../resources/localization/translator";

import { callMessageStyle, callMessageTxtStyle } from "./style";

const CallMessage = (props) => {

    const getMessage = useCallback(() => {

        const call = props.message;
        const loggedInUser = props.loggedInUser;

        let message = null;
        switch (call.status) {
    
            case CometChat.CALL_STATUS.INITIATED: {

                message = Translator.translate("CALL_INITIATED", props.lang);
                if (call.type === "audio") {

                    if (call.receiverType === "user") {

                        message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("OUTGOING_AUDIO_CALL", props.lang) : Translator.translate("INCOMING_AUDIO_CALL", props.lang);

                    } else if (call.receiverType === "group") {

                        if (call.action === CometChat.CALL_STATUS.INITIATED) {

                            message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("OUTGOING_AUDIO_CALL", props.lang) : Translator.translate("INCOMING_AUDIO_CALL", props.lang);

                        } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                            message = (call.sender.uid === loggedInUser.uid) ? Translator.translate("CALL_REJECTED", props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", props.lang)}`);
                        }
                    }
                    
                } else if (call.type === "video") {

                    if (call.receiverType === "user") {

                        message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("OUTGOING_VIDEO_CALL", props.lang) : Translator.translate("INCOMING_VIDEO_CALL", props.lang);

                    } else if (call.receiverType === "group") {

                        if (call.action === CometChat.CALL_STATUS.INITIATED) {

                            message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("OUTGOING_VIDEO_CALL", props.lang) : Translator.translate("INCOMING_VIDEO_CALL", props.lang);

                        } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                            message = (call.sender.uid === loggedInUser.uid) ? Translator.translate("CALL_REJECTED", props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", props.lang)}`);
                        }
                    }
                }
                break;
            }
            case CometChat.CALL_STATUS.ONGOING: {

                if (call.receiverType === "user") {

                    message = Translator.translate("CALL_ACCEPTED", props.lang);

                } else if (call.receiverType === "group") {

                    if (call.action === CometChat.CALL_STATUS.ONGOING) {

                        message = (call.sender.uid === loggedInUser.uid) ? Translator.translate("CALL_ACCEPTED", props.lang) : (`${call.sender.name} ${Translator.translate("JOINED", props.lang)}`);

                    } else if (call.action === CometChat.CALL_STATUS.REJECTED) {

                        message = (call.sender.uid === loggedInUser.uid) ? Translator.translate("CALL_REJECTED", props.lang) : (`${call.sender.name} ${Translator.translate("REJECTED_CALL", props.lang)}`);

                    } else if(call.action === "left") {

                        if (call.sender.uid === loggedInUser.uid) {

                            message = `${Translator.translate("YOU", props.lang)} ${Translator.translate("LEFT_THE_CALL", props.lang)}`;

                        } else {
                            message = `${call.sender.name} ${Translator.translate("LEFT_THE_CALL", props.lang)}`;
                        }
                    }
                }
                break;
            }
            case CometChat.CALL_STATUS.UNANSWERED: {

                message = Translator.translate("CALL_UNANSWERED", props.lang);

                if (call.type === "audio" && (call.receiverType === "user" || call.receiverType === "group")) {

                    message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("UNANSWERED_AUDIO_CALL", props.lang) : Translator.translate("MISSED_AUDIO_CALL", props.lang);

                } else if (call.type === "video" && (call.receiverType === "user" || call.receiverType === "group")) {

                    message = (call.callInitiator.uid === loggedInUser.uid) ? Translator.translate("UNANSWERED_VIDEO_CALL", props.lang) : Translator.translate("MISSED_VIDEO_CALL", props.lang);
                }
                break;
            }
            case CometChat.CALL_STATUS.REJECTED: 
                message = Translator.translate("CALL_REJECTED", props.lang);
                break;
            case CometChat.CALL_STATUS.ENDED:
                message = Translator.translate("CALL_ENDED", props.lang);
                break;
            case CometChat.CALL_STATUS.CANCELLED:
                message = Translator.translate("CALL_CANCELLED", props.lang);
                break;
            case CometChat.CALL_STATUS.BUSY:
                message = Translator.translate("CALL_BUSY", props.lang);
                break;
            default:
                break;
        }

        return <p css={callMessageTxtStyle}>{message}</p>
    }, [props]);

    return (
        <div css={callMessageStyle()} className="call__message">{getMessage()}</div>
    )
}

// Specifies the default values for props:
CallMessage.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CallMessage.propTypes = {
    lang: PropTypes.string,
}

export default CallMessage;