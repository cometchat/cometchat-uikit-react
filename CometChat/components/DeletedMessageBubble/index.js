import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { SvgAvatar } from '../../util/svgavatar';
import Avatar from "../Avatar";

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

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

const deletedmessagebubble = (props) => {

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

        if(props.message.receiverType === 'group') {

            if (!props.message.sender.avatar) {

                const uid = props.message.sender.getUid();
                const char = props.message.sender.getName().charAt(0).toUpperCase();

                props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
            }

            avatar = (
                <div css={messageThumbnailStyle()} className="message__thumbnail">
                    <Avatar
                    cornerRadius="50%"
                    borderColor={props.theme.color.secondary}
                    borderWidth="1px"
                    image={props.message.sender.avatar} />
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
deletedmessagebubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

deletedmessagebubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default deletedmessagebubble;