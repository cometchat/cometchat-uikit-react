import React from "react";
import classNames from "classnames";

import { CometChatManager } from "../../util/controller";
import { SharedMediaManager } from "./controller";

import * as enums from '../../util/enums.js';

import "./style.scss";

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

        this.SharedMediaManager = new SharedMediaManager(this.props.item.guid, this.state.messagetype);
        this.getMessages(true);
        this.SharedMediaManager.attachListeners(this.messageUpdated);
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
        this.SharedMediaManager = null;
        this.SharedMediaManager = new SharedMediaManager(this.props.item.guid, type);
        this.getMessages(true);
    }

    render() {

        const photoClassName = classNames({
            "ccl-dtls-panel-media-fltr-btn": true,
            "active": (this.state.messagetype === "image")
        });

        const videoClassName = classNames({
            "ccl-dtls-panel-media-fltr-btn": true,
            "active": (this.state.messagetype === "video")
        });

        const fileClassName = classNames({
            "ccl-dtls-panel-media-fltr-btn": true,
            "active": (this.state.messagetype === "file")
        });

        const template = (message, key) => {

            if(this.state.messagetype === "image" && message.data.url) {

                return (
                    <div id={message.id} key={key} className="ccl-dtls-panel-media-item">
                        <img src={message.data.url} alt="Media Item" />
                    </div>
                );

            } else if (this.state.messagetype === "video" && message.data.url) {

                return (
                    <div id={message.id} key={key} className="ccl-dtls-panel-media-item">
                        <video src={message.data.url} />
                    </div>
                );

            } else if (this.state.messagetype === "file" && message.data.attachments) {

                return (
                    <div id={message.id} key={key} className="ccl-dtls-panel-media-item">
                    <a href={message.data.attachments[0].url} 
                    target="_blank" 
                    rel="noopener noreferrer">{message.data.attachments[0].name}</a>
                    </div>
                );
            }
        }

        const messages = [...this.state.messageList];
        const messageList = messages.map((message, key) => {
            return (
                template(message, key)
            );
        });

        return (
            <React.Fragment>
                <h6 className="ccl-dtls-panel-section-head">Shared Media</h6>
                <div className="ccl-dtls-panel-media-fltr-wrap">
                    <div className="ccl-dtls-panel-media-fltrs">
                        <span className={photoClassName} onClick={() => this.mediaClickHandler("image")}>Photos</span>
                        <span className={videoClassName} onClick={() => this.mediaClickHandler("video")}>Videos</span>
                        <span className={fileClassName} onClick={() => this.mediaClickHandler("file")}>Docs</span>
                    </div>
                    <div className="ccl-dtls-panel-media-type-wrap">
                        <div 
                        className="ccl-dtls-panel-media-type-wrap photos" 
                        ref={el => this.messageContainer = el}
                        onScroll={this.handleScroll}>
                            {(messageList.length) ? messageList : "No records found."}
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }

    componentWillUnmount() {
      this.SharedMediaManager.removeListeners();
      this.SharedMediaManager = null;
    }
}

export default SharedMediaView;