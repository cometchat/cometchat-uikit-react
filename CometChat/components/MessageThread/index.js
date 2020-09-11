import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";

import {
  wrapperStyle,
  headerStyle,
  headerWrapperStyle,
  headerDetailStyle,
  headerTitleStyle,
  headerNameStyle,
  headerCloseStyle,
  messageContainerStyle,
  parentMessageStyle,
  parentMessageContainerStyle,
  parentMessageWrapperStyle,
  messageTxtStyle,
  messageTimestampStyle,
  messageSeparatorStyle,
  messageReplyStyle,
} from "./style";

import clearIcon from "./resources/clear.svg";
import blueFile from "./resources/file-blue.svg";

class MessageThread extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        messageList: [],
        scrollToBottom: false,
        replyCount: 0
      }
    }

    componentDidMount() {

      if(this.props.parentMessage.replyCount) {
        this.setState({replyCount: this.props.parentMessage.replyCount});
      }
    }

    componentDidUpdate(prevProps, prevState) {

      if(prevProps.parentMessage.id !== this.props.parentMessage.id) {
        this.setState({ messageList: [], scrollToBottom: true });

        if(this.props.parentMessage.replyCount) {
          this.setState({replyCount: this.props.parentMessage.replyCount});
        }
      }
    }

    actionHandler = (action, messages) => {
        
        switch(action) {

            case "messageReceived": {
              const message = messages[0];
              if(message.parentMessageId && message.parentMessageId === this.props.parentMessage.id) {
                this.appendMessage(messages);
              }
            }
            break;
            case "messageComposed": {

              let replyCount = this.state.replyCount;

              this.setState({replyCount: ++replyCount})
              this.appendMessage(messages);
              this.props.actionGenerated("threadMessageComposed", messages);
            }
            break;
            case "messageUpdated":
              this.updateMessages(messages);
            break;
            case "messageFetched":
              this.prependMessages(messages);
            break;
            case "messageDeleted":
              this.removeMessages(messages);
            break;
            default:
            break;
        }
    }

    //message is received or composed & sent
    appendMessage = (message) => {
      let messages = [...this.state.messageList];
      messages = messages.concat(message);
      this.setState({ messageList: messages, scrollToBottom: true });
    }

    //message status is updated
    updateMessages = (messages) => {
      this.setState({ messageList: messages });
    }

    //messages are fetched from backend
    prependMessages = (messages) => {
      const messageList = [...messages, ...this.state.messageList];
      this.setState({ messageList: messageList, scrollToBottom: false });
    }

    //messages are deleted
    removeMessages = (messages) => {
  
      const messageList = [...this.state.messageList];
      const filteredMessages = messageList.filter(message => message.id !== messages[0].id);
      this.setState({ messageList: filteredMessages, scrollToBottom: false });
    }

    getMessageComponent = (message) => {

      let component = null;

      let messageComponent = null;
      switch(message.type) {
        case CometChat.MESSAGE_TYPE.TEXT:
          messageComponent =  (
            <p css={messageTxtStyle()}>{message.text}</p>
          );
        break;
        case CometChat.MESSAGE_TYPE.IMAGE:
          messageComponent =  (
            <img src={message.data.url} alt="sender" />
          );
        break;
        case CometChat.MESSAGE_TYPE.FILE:
          messageComponent =  (
            <a href={message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">
              {message.data.attachments[0].name} <img src={blueFile} alt="file"/>
            </a>
          );
        break;
        case CometChat.MESSAGE_TYPE.VIDEO:
          messageComponent =  (
            <video controls>
              <source src={message.data.url} />
            </video>      
          );
        break;
        case CometChat.MESSAGE_TYPE.AUDIO:
          messageComponent =  (
            <audio controls>
              <source src={message.data.url} />
            </audio> 
          );
        break;
        default:
        break;
      }

      component = (
        <div css={parentMessageContainerStyle(message, this.props)}>                                
          <div css={parentMessageWrapperStyle(message, this.props)}>{messageComponent}</div>
          <div>
            <span css={messageTimestampStyle()}>
              {new Date(message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
            </span>
          </div>
        </div>                            
      );
      return component;
    }

    render() {

      let parentMessage = this.getMessageComponent(this.props.parentMessage);
      
      let seperator = (<div css={messageSeparatorStyle(this.props)}><hr/></div>);
      if(this.state.replyCount) {

        const replyCount = this.state.replyCount;
        const replyText = (replyCount === 1) ? `${replyCount} reply` : `${replyCount} replies`;

        seperator = (
          <div css={messageSeparatorStyle(this.props)}>
            <span css={messageReplyStyle()}>{replyText}</span>
            <hr/>
          </div>
        );
      }

      return (
        <div css={wrapperStyle(this.props)}>
          <div css={headerStyle(this.props)}>
            <div css={headerWrapperStyle()}>    
              <div css={headerDetailStyle()}>
                <h6 css={headerTitleStyle()}>Thread</h6>
                <span css={headerNameStyle()}>{this.props.item.name}</span>
              </div>
              <div css={headerCloseStyle(clearIcon)} onClick={() => this.props.actionGenerated("closeThreadClicked")}></div>
            </div>
          </div>
          <div css={messageContainerStyle()}>
            <div css={parentMessageStyle()}>{parentMessage}</div>
            {seperator}
            <MessageList
            theme={this.props.theme}
            messages={this.state.messageList} 
            item={this.props.item} 
            type={this.props.type}
            scrollToBottom={this.state.scrollToBottom}
            config={this.props.config}
            parentMessageId={this.props.parentMessage.id}
            actionGenerated={this.actionHandler} />
            <MessageComposer
            theme={this.props.theme}
            item={this.props.item} 
            type={this.props.type}
            parentMessageId={this.props.parentMessage.id}
            actionGenerated={this.actionHandler} />
          </div>
        </div>
      );
    }
}

export default MessageThread;