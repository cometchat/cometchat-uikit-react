import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

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

const deletedmessagebubble = (props) => {

    let message = null;
    if(props.messageOf === "sender") {

        message = (
            <React.Fragment>
                <div css={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
                    <p css={messageTxtStyle(props)} className="message__txt">You deleted this message.</p>                         
                </div>
                <div css={messageInfoWrapperStyle(props)} className="message__info__wrapper">
                    <span css={messageTimeStampStyle(props)} className="message__timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
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
            name = (<div css={nameWrapperStyle(props)} className="message__name__wrapper"><span css={nameStyle(props)} className="message__name">{props.message.sender.name}</span></div>);
        } 

        message = (
            <React.Fragment>
                {avatar}
                <div css={messageDetailStyle(props)} className="message__details">
                    {name}
                    <div css={messageTxtWrapperStyle(props)} className="message__txt__wrapper">
                        <p css={messageTxtStyle(props)} className="message__txt">This message was deleted.</p>
                    </div>
                    <div css={messageInfoWrapperStyle(props)} className="message__info__wrapper">
                        <span css={messageTimeStampStyle(props)} className="message__timestamp">{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
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

export default deletedmessagebubble;