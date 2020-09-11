import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChatManager } from "../../util/controller";
import { SharedMediaManager } from "./controller";

import * as enums from '../../util/enums.js';

import {
    sectionStyle,
    sectionHeaderStyle,
    sectionContentStyle,
    mediaBtnStyle,
    buttonStyle,
    mediaItemStyle,
    itemStyle,

} from "./style";

import fileIcon from "./resources/file-blue.svg";

class SharedMediaView extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            messagetype: "image",
            messageList: []
        }

        this.messageContainer = React.createRef();
    }

    componentDidMount() {

        this.SharedMediaManager = new SharedMediaManager(this.props.item, this.props.type, this.state.messagetype);
        this.getMessages(true);
        this.SharedMediaManager.attachListeners(this.messageUpdated);
    }

    componentDidUpdate(prevProps, prevState) {

        if(prevState.messagetype !== this.state.messagetype) {

            this.SharedMediaManager = null;
            this.SharedMediaManager = new SharedMediaManager(this.props.item, this.props.type, this.state.messagetype);
            this.getMessages(true);
            this.SharedMediaManager.attachListeners(this.messageUpdated);
        }
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
        if (this.props.type === 'group' 
        && deletedMessage.getReceiverType() === 'group'
        && deletedMessage.getReceiver().guid === this.props.item.guid
        && messageType === this.state.messagetype) {

            const messageList = [...this.state.messageList];
            const filteredMessages = messageList.filter(message => message.id !== deletedMessage.id);
            this.setState({ messageList: filteredMessages, scrollToBottom: false });
        }
    }
    
    //message is received or composed & sent
    messageReceived = (message) => {

        const messageType = message.data.type;
        if (this.props.type === 'group' 
        && message.getReceiverType() === 'group'
        && message.getReceiver().guid === this.props.item.guid
        && messageType === this.state.messagetype) {

            let messages = [...this.state.messageList];
            messages = messages.concat(message);
            this.setState({ messageList: messages, scrollToBottom: true });
        }
    }

    getMessages = (scrollToBottom = false) => {
        
        new CometChatManager().getLoggedInUser().then((user) => {
          
          this.loggedInUser = user;
          
          this.SharedMediaManager.fetchPreviousMessages().then((messages) => {
    
            const messageList = [...messages, ...this.state.messageList];
            this.setState({ messageList: messageList });

            if(scrollToBottom) {
                this.scrollToBottom();
            }
    
        }).catch((error) => {
            //TODO Handle the erros in contact list.
            console.error("[SharedMediaView] getMessages fetchPrevious error", error);
          });
    
        }).catch((error) => {
            console.log("[SharedMediaView] getMessages getLoggedInUser error", error);
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
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon)}>
                        <img src={message.data.url} alt="Media Item" />
                    </div>
                );

            } else if (this.state.messagetype === "video" && message.data.url) {

                return (
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon)}>
                        <video src={message.data.url} />
                    </div>
                );

            } else if (this.state.messagetype === "file" && message.data.attachments) {

                return (
                    <div id={message.id} key={key} css={itemStyle(this.state, this.props, fileIcon)}>
                    <a href={message.data.attachments[0].url} 
                    target="_blank" 
                    rel="noopener noreferrer">{message.data.attachments[0].name}</a>
                    </div>
                );
            }
        }

        const messages = [...this.state.messageList];
        const messageList = messages.map((message, key) => {
            return (template(message, key));
        });

        return (
            <div css={sectionStyle(this.props)}>
                <h6 css={sectionHeaderStyle(this.props)}>Shared Media</h6>
                <div css={sectionContentStyle(this.props)} data-id="sharedmedia">
                    <div css={mediaBtnStyle()}>
                        <span css={buttonStyle(this.state, "image")} onClick={() => this.mediaClickHandler("image")}>Photos</span>
                        <span css={buttonStyle(this.state, "video")} onClick={() => this.mediaClickHandler("video")}>Videos</span>
                        <span css={buttonStyle(this.state, "file")} onClick={() => this.mediaClickHandler("file")}>Docs</span>
                    </div>
                    <div css={mediaItemStyle()}
                    ref={el => this.messageContainer = el}
                    onScroll={this.handleScroll}>{(messageList.length) ? messageList : "No records found."}
                    </div>
                </div>
            </div>
        );
    }

    componentWillUnmount() {
      this.SharedMediaManager.removeListeners();
      this.SharedMediaManager = null;
    }
}

export default SharedMediaView;
