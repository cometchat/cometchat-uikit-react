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
                <div css={messageTxtWrapperStyle(props)}>
                    <p css={messageTxtStyle(props)}>You deleted this message.</p>                         
                </div>
                <div css={messageInfoWrapperStyle(props)}>
                    <span css={messageTimeStampStyle(props)}>{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
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
                <div css={messageThumbnailStyle()}>
                    <Avatar
                    cornerRadius="50%"
                    borderColor={props.theme.color.secondary}
                    borderWidth="1px"
                    image={props.message.sender.avatar} />
                </div>
            )

            name = (<div css={nameWrapperStyle()}><span css={nameStyle(props)}>{props.message.sender.name}</span></div>);

            message = (
                <React.Fragment>
                    {avatar}
                    <div css={messageDetailStyle(props)}>
                        {name}
                        <div css={messageTxtWrapperStyle(props)}>
                            <p css={messageTxtStyle(props)}>This message was deleted.</p>                             
                        </div>
                        <div css={messageInfoWrapperStyle(props)}>
                            <span css={messageTimeStampStyle(props)}>{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                        </div>
                    </div>
                </React.Fragment>
            );

        } else {
            message = (
                <React.Fragment>
                    {avatar}
                    <div css={messageDetailStyle(props)}>
                        <div css={messageTxtWrapperStyle(props)}>
                            <p css={messageTxtStyle(props)}>This message was deleted.</p>                             
                        </div>
                        <div css={messageInfoWrapperStyle(props)}>
                            <span css={messageTimeStampStyle(props)}>{new Date(props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                        </div>
                    </div>
                </React.Fragment>
            );
        }
    }

    // const wrapperClassName = classNames({
    //     "receiver__message": (props.messageOf === "receiver"),
    //     "sender__message": (props.messageOf === "sender")
    // }); 

    return (
        <div css={messageContainerStyle(props)}>
            <div css={messageWrapperStyle(props)}>{message}</div>                            
        </div>
    )
}

export default deletedmessagebubble;