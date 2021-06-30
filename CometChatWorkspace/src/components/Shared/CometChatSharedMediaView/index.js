import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";


import { CometChatContext } from "../../../util/CometChatContext";

import { SharedMediaManager } from "./controller";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    sectionStyle,
    sectionHeaderStyle,
    sectionContentStyle,
    mediaBtnStyle,
    buttonStyle,
    mediaItemStyle,
    itemStyle,

} from "./style";

import fileIcon from "./resources/file-upload.svg";

class CometChatSharedMediaView extends React.Component {

    static contextType = CometChatContext;

    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            messagetype: "image",
            messageList: []
        }

        this.messageContainer = React.createRef();

        CometChat.getLoggedinUser().then(user => this.loggedInUser = user).catch(error => {
            console.error(error);
        });
    }

    componentDidMount() {

        this._isMounted = true;
        this.SharedMediaManager = new SharedMediaManager(this.context.item, this.context.type, this.state.messagetype);
        this.getMessages(true);
        this.SharedMediaManager.attachListeners(this.messageUpdated);
    }

    componentDidUpdate(prevProps, prevState) {

        if(prevState.messagetype !== this.state.messagetype) {

            this.SharedMediaManager = null;
            this.SharedMediaManager = new SharedMediaManager(this.context.item, this.context.type, this.state.messagetype);
            this.getMessages(true);
            this.SharedMediaManager.attachListeners(this.messageUpdated);
        }
    }

    componentWillUnmount() {
        this.SharedMediaManager.removeListeners();
        this.SharedMediaManager = null;
        this._isMounted = false;
    }

    //callback for listener functions
    messageUpdated = (key, message) => {

        switch(key) {

            case enums.MESSAGE_DELETED:
              this.messageDeleted(message);
              break;
            case enums.MEDIA_MESSAGE_RECEIVED:
              this.messageReceived(message);
              break;
            default:
              break;
        }
    }

    messageDeleted = (deletedMessage) => {
  
        const messageType = deletedMessage.data.type;
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP
        && deletedMessage.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
        && deletedMessage.getReceiver().guid === this.context.item.guid
        && messageType === this.state.messagetype) {

            const messageList = [...this.state.messageList];
            const filteredMessages = messageList.filter(message => message.id !== deletedMessage.id);
            this.setState({ messageList: filteredMessages, scrollToBottom: false });
        }
    }
    
    //message is received or composed & sent
    messageReceived = (message) => {

        const messageType = message.data.type;
        if (this.context.type === CometChat.ACTION_TYPE.TYPE_GROUP
        && message.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP
        && message.getReceiver().guid === this.context.item.guid
        && messageType === this.state.messagetype) {

            let messages = [...this.state.messageList];
            messages = messages.concat(message);
            this.setState({ messageList: messages, scrollToBottom: true });
        }
    }

    getMessages = (scrollToBottom = false) => {
        
        this.SharedMediaManager.fetchPreviousMessages().then(messages => {
    
            const messageList = [...messages, ...this.state.messageList];
            if (this._isMounted) {

                this.setState({messageList: messageList});
                if(scrollToBottom) {
                    this.scrollToBottom();
                }
            } 
    
        }).catch(error => {

            const errorCode = (error && error.hasOwnProperty("code")) ? error.code : "ERROR";
            this.context.setToastMessage("error", errorCode);
        });
    }

    scrollToBottom = () => {
      
        if (this.messageContainer) {
            this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        }
    }

    handleScroll = (e) => {

        const top = Math.round(e.currentTarget.scrollTop) === 0;
        if (top && this.state.messageList.length) {
            this.getMessages();
        }
    }

    mediaClickHandler = (type) => {
        this.setState({messagetype: type, messageList: []});
    }

    render() {

        const template = (message, key) => {

            if(this.state.messagetype === "image" && message.data.url) {

                return (
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon, this.context)} className="item item__image">
                        <img src={message.data.url} alt={Translator.translate("SHARED_MEDIA", this.props.lang)} />
                    </div>
                );

            } else if (this.state.messagetype === "video" && message.data.url) {

                return (
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon, this.context)} className="item item__video">
                        <video src={message.data.url} />
                    </div>
                );

            } else if (this.state.messagetype === "file" && message.data.attachments) {

                return (
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon, this.context)} className="item item__file">
                        <a href={message.data.attachments[0].url} 
                        target="_blank" 
                        rel="noopener noreferrer">
                            <i></i>
                           <span>{message.data.attachments[0].name}</span>
                        </a>
                    </div>
                );
            }
        }

        const messages = [...this.state.messageList];
        const messageList = messages.map((message, key) => {
            return (template(message, key));
        });

        return (
            <div css={sectionStyle(this.props)} className="section section__sharedmedia">
                <h6 css={sectionHeaderStyle(this.props)} className="section__header">{Translator.translate("SHARED_MEDIA", this.props.lang)}</h6>
                <div css={sectionContentStyle(this.props)} data-id="sharedmedia" className="section__content">
                    <div css={mediaBtnStyle()} className="media__button">
                        <span css={buttonStyle(this.state, "image")} onClick={() => this.mediaClickHandler("image")}>{Translator.translate("PHOTOS", this.props.lang)}</span>
                        <span css={buttonStyle(this.state, "video")} onClick={() => this.mediaClickHandler("video")}>{Translator.translate("VIDEOS", this.props.lang)}</span>
                        <span css={buttonStyle(this.state, "file")} onClick={() => this.mediaClickHandler("file")}>{Translator.translate("DOCS", this.props.lang)}</span>
                    </div>
                    <div css={mediaItemStyle()} className="media_items" 
                    ref={el => this.messageContainer = el}
                    onScroll={this.handleScroll}>{(messageList.length) ? messageList : Translator.translate("NO_RECORDS_FOUND", this.props.lang)}
                    </div>
                </div>
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatSharedMediaView.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatSharedMediaView.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export { CometChatSharedMediaView };