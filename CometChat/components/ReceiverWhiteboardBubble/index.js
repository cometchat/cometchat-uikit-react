import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

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

import whiteboardIcon from "./resources/receiverwhiteboard.png";

class ReceiverWhiteboardBubble extends React.PureComponent {

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

        this.state = {
            message: message
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

    launchCollaborativeWhiteboard = () => {

        let whiteboardUrl = null;
        let whiteboardData = checkMessageForExtensionsData(this.state.message, "whiteboard");
        if (whiteboardData
        && whiteboardData.hasOwnProperty("board_url")
        && whiteboardData.board_url.length) {

            let username = this.props.loggedInUser.name.split(' ').join('_');
            // Appending the username to the board_url
            whiteboardUrl = whiteboardData.board_url + '&username=' + username;
            window.open(whiteboardUrl, '', 'fullscreen=yes, scrollbars=auto');
        }
    }

    render() {

        let avatar = null, name = null;
        if (this.state.message.receiverType === 'group') {

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

        const documentTitle = `${this.state.message.sender.name} ${Translator.translate("SHARED_COLLABORATIVE_WHITEBOARD", this.props.lang)}`;

        return (
            <div css={messageContainerStyle()} className="receiver__message__container message__whiteboard">

                <div css={messageWrapperStyle()} className="message__wrapper">
                    {avatar}
                    <div css={messageDetailStyle()} className="message__details">
                        {name}
                        <ToolTip {...this.props} message={this.state.message} name={name} />
                        <div css={messageTxtContainerStyle()} className="message__whiteboard__container">
                            <div css={messageTxtWrapperStyle(this.props)} className="message__whiteboard__wrapper">
                                <div css={messageTxtTitleStyle(this.props)} className="message__whiteboard__title">
                                    <img src={whiteboardIcon} alt={Translator.translate("COLLABORATIVE_WHITEBOARD", this.props.lang)} />
                                    <p css={messageTxtStyle()} className="whiteboard__title">{documentTitle}</p>
                                </div>
                                
                                <ul css={messageBtnStyle(this.props)} className="whiteboard__button">
                                    <li onClick={this.launchCollaborativeWhiteboard}>
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
ReceiverWhiteboardBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

ReceiverWhiteboardBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default ReceiverWhiteboardBubble;