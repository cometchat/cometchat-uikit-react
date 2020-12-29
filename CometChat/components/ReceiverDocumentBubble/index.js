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

import documentIcon from "./resources/receiverdocument.png";

class ReceiverDocumentBubble extends React.PureComponent {

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

    launchCollaborativeDocument = () => {

        let documentUrl = null;
        let documentData = checkMessageForExtensionsData(this.state.message, "document");
        if (documentData
        && documentData.hasOwnProperty("document_url")
        && documentData.document_url.length) {

            documentUrl = documentData.document_url;
            window.open(documentUrl, '', 'fullscreen=yes, scrollbars=auto');
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
                        <RegularReactionView {...this.props} message={this.state.message} reaction={reactionsData} />
                    </div>
                );
            }
        }

        const documentTitle = `${this.state.message.sender.name} ${Translator.translate("SHARED_COLLABORATIVE_DOCUMENT", this.props.lang)}`;

        return (
            <div css={messageContainerStyle()} className="receiver__message__container message__document">

                <div css={messageWrapperStyle()} className="message__wrapper">
                    {avatar}
                    <div css={messageDetailStyle()} className="message__details">
                        {name}
                        <ToolTip {...this.props} message={this.state.message} name={name} />
                        <div css={messageTxtContainerStyle()} className="message__document__container">
                            <div css={messageTxtWrapperStyle(this.props)} className="message__document__wrapper">
                                <div css={messageTxtTitleStyle(this.props)} className="message__document__title">
                                    <img src={documentIcon} alt={Translator.translate("COLLABORATIVE_DOCUMENT", this.props.lang)} />
                                    <p css={messageTxtStyle()} className="document__title">{documentTitle}</p>
                                </div>
                                
                                <ul css={messageBtnStyle(this.props)} className="document__button">
                                    <li onClick={this.launchCollaborativeDocument}>
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
ReceiverDocumentBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

ReceiverDocumentBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export default ReceiverDocumentBubble;