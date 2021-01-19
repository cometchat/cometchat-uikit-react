import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';
import { CometChat } from "@cometchat-pro/chat";

import { checkMessageForExtensionsData } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import Avatar from "../Avatar";
import { SvgAvatar } from '../../util/svgavatar';
import RegularReactionView from "../RegularReactionView";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle,
    messageTxtContainerStyle,
    messageTxtWrapperStyle,
    messageTxtTitleStyle,
    messageTxtStyle,
    messageBtnStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle
} from "./style";

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

import callIcon from "./resources/receivervideocall.png";

class ReceiverDirectCallBubble extends React.Component {

    messageFrom = "receiver";

    constructor(props) {

        super(props);

        const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });
        if (message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

            if (!message.sender.avatar) {

                const uid = message.sender.getUid();
                const char = message.sender.getName().charAt(0).toUpperCase();

                message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
            }
        }

        this.state = {
            message: message,
            isHovering: false
        }
    }

    componentDidUpdate(prevProps) {

        const previousMessageStr = JSON.stringify(prevProps.message);
        const currentMessageStr = JSON.stringify(this.props.message);

        if (previousMessageStr !== currentMessageStr) {

            const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
            this.setState({ message: message })
        }
    }

    handleMouseHover = () => {
        this.setState(this.toggleHoverState);
    }

    toggleHoverState = (state) => {

        return {
            isHovering: !state.isHovering,
        };
    }

    render () {

        let avatar = null, name = null;
        if (this.state.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

            avatar = (
                <div css={messageThumbnailStyle} className="message__thumbnail">
                    <Avatar borderColor={this.props.theme.borderColor.primary} image={this.state.message.sender.avatar} />
                </div>
            );

            name = (<div css={nameWrapperStyle(avatar)} className="message__name__wrapper">
                <span css={nameStyle(this.props)} className="message__name">{this.props.message.sender.name}</span>
            </div>);
        }

        let messageReactions = null;
        const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
        if (reactionsData) {

            if (Object.keys(reactionsData).length) {
                messageReactions = (
                    <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
                        <RegularReactionView  {...this.props} message={this.state.message} reaction={reactionsData} />
                    </div>
                );
            }
        }

        let toolTipView = null;
        if (this.state.isHovering) {
            toolTipView = (<ToolTip {...this.props} message={this.state.message} name={name} />);
        }

        const messageTitle = `${this.state.message.sender.name} ${Translator.translate("INITIATED_GROUP_CALL", this.props.lang)}`;

        return (
            <div css={messageContainerStyle()} 
            className="receiver__message__container message__directcall"
            onMouseEnter={this.handleMouseHover}
            onMouseLeave={this.handleMouseHover}>

                <div css={messageWrapperStyle()} className="message__wrapper">
                    {avatar}
                    <div css={messageDetailStyle()} className="message__details">
                        {name}
                        {toolTipView}
                        <div css={messageTxtContainerStyle()} className="message__directcall__container">
                            <div css={messageTxtWrapperStyle(this.props)} className="message__directcall__wrapper">
                                <div css={messageTxtTitleStyle(this.props)} className="message__directcall__title">
                                    <img src={callIcon} alt={Translator.translate("VIDEO_CALL", this.props.lang)} />
                                    <p css={messageTxtStyle()} className="directcall__title">{messageTitle}</p>
                                </div>

                                <ul css={messageBtnStyle(this.props)} className="directcall__button">
                                    <li onClick={() => this.props.actionGenerated("joinDirectCall", this.state.message)}>
                                        <p>{Translator.translate("JOIN", this.props.lang)}</p>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {messageReactions}

                        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
                            <ReadReciept {...this.props} message={this.state.message} />
                            <ReplyCount {...this.props} message={this.state.message} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

// Specifies the default values for props:
ReceiverDirectCallBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme,
    message: {},
    loggedInUser: {}
};

ReceiverDirectCallBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object,
    message: PropTypes.object,
    loggedInUser: PropTypes.object
}

export default ReceiverDirectCallBubble;