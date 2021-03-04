import React from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar } from "../../Shared";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    messageTxtStyle,
    messageInfoWrapperStyle,
    messageTimeStampStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle
} from "./style";

const CometChatDeleteMessageBubble = (props) => {

    let message = null;
    const messageDate = (props.message.sentAt * 1000);
    if(props.messageOf === "sender") {

        message = (
            <React.Fragment>
                <div css={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
                    <p css={messageTxtStyle(props)} className="message__txt">{Translator.translate("YOU_DELETED_THIS_MESSAGE", props.lang)}</p>                         
                </div>
                <div css={messageInfoWrapperStyle(props)} className="message__info__wrapper">
                    <span css={messageTimeStampStyle(props)} className="message__timestamp">{dateFormat(messageDate, "shortTime")}</span>
                </div>
            </React.Fragment>
        );

    } else if(props.messageOf === "receiver") {

        let avatar = null, name = null;

        if (props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

            avatar = (
                <div css={messageThumbnailStyle()} className="message__thumbnail">
                    <CometChatAvatar user={props.message.sender} />
                </div>
            )
            name = (
            <div css={nameWrapperStyle(props)} className="message__name__wrapper">
                <span css={nameStyle(props)} className="message__name">{props.message.sender.name}</span>
            </div>);
        } 

        message = (
            <React.Fragment>
                {avatar}
                <div css={messageDetailStyle(props)} className="message__details">
                    {name}
                    <div css={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
                        <p css={messageTxtStyle(props)} className="message__txt">{Translator.translate("THIS_MESSAGE_DELETED", props.lang)}</p>
                    </div>
                    <div css={messageInfoWrapperStyle(props)} className="message__info__wrapper">
                        <span css={messageTimeStampStyle(props)} className="message__timestamp">{dateFormat(messageDate, "shortTime")}</span>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    return (
        <div css={messageContainerStyle(props)} className="message__deleted">
            <div css={messageWrapperStyle(props)} className="message__wrapper">{message}</div>                            
        </div>
    )
}

// Specifies the default values for props:
CometChatDeleteMessageBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatDeleteMessageBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default CometChatDeleteMessageBubble;
