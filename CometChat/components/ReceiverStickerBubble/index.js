import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle,
    messageImgContainerStyle,
    messageImgWrapperStyle,
    messageInfoWrapperStyle,
    messageTimestampStyle
} from "./style";

class ReceiverStickerBubble extends React.Component {

    messageFrom = "receiver";

    constructor(props) {

        super(props);

        const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });
        if (message.receiverType === 'group') {

            if (!message.sender.avatar) {

                const uid = message.sender.getUid();
                const char = message.sender.getName().charAt(0).toUpperCase();

                message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
            }
        }
        this.state = {message: message}
    }

    componentDidUpdate(prevProps) {

        const previousMessageStr = JSON.stringify(prevProps.message);
        const currentMessageStr = JSON.stringify(this.props.message);

        if (previousMessageStr !== currentMessageStr) {

            const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
            this.setState({ message: message })
        }
    }

    render() {

        let avatar = null, name = null;
        if (this.props.message.receiverType === 'group') {

            avatar = (
                <div css={messageThumbnailStyle()} className="message__thumbnail">
                    <Avatar
                        cornerRadius="50%"
                        borderColor={this.props.theme.color.secondary}
                        borderWidth="1px"
                        image={this.state.message.sender.avatar}></Avatar>
                </div>
            );

            name = (<div css={(nameWrapperStyle(avatar))} className="message__name__wrapper"><span css={nameStyle(this.props)} className="message__name">{this.state.message.sender.name}</span></div>);
        }

        let stickerData = null;
        let stickerImg = null;
        if (this.state.message.hasOwnProperty("data") && this.state.message.data.hasOwnProperty("customData")) {

            stickerData = this.state.message.data.customData;
            
            if (stickerData.hasOwnProperty("sticker_url")) {
                const stickerName = (stickerData.hasOwnProperty("sticker_name")) ? stickerData.sticker_name : "Sticker";
                stickerImg = (<img src={stickerData.sticker_url} alt={stickerName} />);
            }
        }

        return (
            <div css={messageContainerStyle()} className="receiver__message__container message__sticker">
                <ToolTip {...this.props} message={this.state.message} name={name} />
                <div css={messageWrapperStyle()} className="message__wrapper">
                    {avatar}
                    <div css={messageDetailStyle(name)} className="message__details">
                        {name}
                        <div css={messageImgContainerStyle()} className="message__image__container">
                            <div css={messageImgWrapperStyle(this.props)} className="message__image__wrapper">{stickerImg}</div>
                        </div>
                        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
                            <span css={messageTimestampStyle(this.props)} className="message__timestamp">{new Date(this.props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                            <ReplyCount {...this.props} message={this.state.message} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ReceiverStickerBubble;