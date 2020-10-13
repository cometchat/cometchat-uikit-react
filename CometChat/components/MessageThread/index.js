import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";

import SenderMessageBubble from "../SenderMessageBubble";
import ReceiverMessageBubble from "../ReceiverMessageBubble";
import SenderImageBubble from "../SenderImageBubble";
import ReceiverImageBubble from "../ReceiverImageBubble";
import SenderFileBubble from "../SenderFileBubble";
import ReceiverFileBubble from "../ReceiverFileBubble";
import SenderAudioBubble from "../SenderAudioBubble";
import ReceiverAudioBubble from "../ReceiverAudioBubble";
import SenderVideoBubble from "../SenderVideoBubble";
import ReceiverVideoBubble from "../ReceiverVideoBubble";

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
        replyCount: 0,
        replyPreview: null,
        messageToBeEdited: null,
      }
    }

    componentDidMount() {

      if(this.props.parentMessage.replyCount) {
        this.setState({replyCount: this.props.parentMessage.replyCount});
      }
    }

    componentDidUpdate(prevProps) {

      if(prevProps.parentMessage.id !== this.props.parentMessage.id) {

        this.setState({ messageList: [], scrollToBottom: true });

        if(this.props.parentMessage.replyCount) {
          this.setState({replyCount: this.props.parentMessage.replyCount});
        } else {
          this.setState({ replyCount: 0 });
        }

      } 
    }

    actionHandler = (action, messages) => {
        
      switch(action) {

        case "messageReceived": {
          const message = messages[0];
          if(message.parentMessageId && message.parentMessageId === this.props.parentMessage.id) {

            const replyCount = this.state.replyCount + 1;
            this.setState({ replyCount: replyCount });
            this.smartReplyPreview(messages);
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
        case "editMessage":
          this.editMessage(messages);
          break;
        case "messageEdited":
          this.messageEdited(messages);
        break;
        case "clearEditPreview":
          this.clearEditPreview();
        break;
        case "deleteMessage":
          this.deleteMessage(messages);
        break;
        default:
        break;
      }
    }

    editMessage = (message) => {
      this.setState({ "messageToBeEdited": message });
    }

    messageEdited = (message) => {

      const messageList = [...this.state.messageList];
      let messageKey = messageList.findIndex(m => m.id === message.id);
      if (messageKey > -1) {

        const messageObj = messageList[messageKey];

        const newMessageObj = { ...messageObj, ...message };

        messageList.splice(messageKey, 1, newMessageObj);
        this.updateMessages(messageList);
      }
    }

    clearEditPreview = () => {
      this.setState({ "messageToBeEdited": null });
    }

    deleteMessage = (message) => {

      const messageId = message.id;
      CometChat.deleteMessage(messageId).then(deletedMessage => this.removeMessages([deletedMessage])).catch(error => {
        console.log("Message delete failed with error:", error);
      });
    }

    smartReplyPreview = (messages) => {

      const message = messages[0];
      
      if (message.hasOwnProperty("metadata")) {

        const metadata = message.metadata;
        if (metadata.hasOwnProperty("@injected")) {

          const injectedObject = metadata["@injected"];
          if (injectedObject.hasOwnProperty("extensions")) {

            const extensionsObject = injectedObject["extensions"];
            if (extensionsObject.hasOwnProperty("smart-reply")) {

              const smartReply = extensionsObject["smart-reply"];
              if (smartReply.hasOwnProperty("error") === false) {
                this.setState({ replyPreview: message });
              } else {
                this.setState({ replyPreview: null });
              }

            }
          }
        }
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
  
      const deletedMessage = messages[0];
      const messagelist = [...this.state.messageList];

      let messageKey = messagelist.findIndex(message => message.id === deletedMessage.id);
      if (messageKey > -1) {

        let messageObj = { ...messagelist[messageKey] };
        let newMessageObj = Object.assign({}, messageObj, deletedMessage);

        messagelist.splice(messageKey, 1, newMessageObj);
        this.setState({ messageList: messagelist, scrollToBottom: false });
      }
  }

  getSenderMessageComponent = (message, key) => {

    let component;

    switch (message.type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        component = <SenderMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = <SenderImageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = <SenderFileBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = <SenderVideoBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = <SenderAudioBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      default:
        break;
    }

    return component;
  }

  getReceiverMessageComponent = (message, key) => {

    let component;

    switch (message.type) {
      case "message":
      case CometChat.MESSAGE_TYPE.TEXT:
        component = <ReceiverMessageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = <ReceiverImageBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = <ReceiverFileBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = <ReceiverAudioBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = <ReceiverVideoBubble theme={this.props.theme} key={key} item={this.props.item} type={this.props.type} message={message} widgetsettings={this.props.widgetsettings} actionGenerated={this.props.actionGenerated} />;
        break;
      default:
        break;
    }

    return component;
  }

    getMessageComponent = (message) => {

      let component = null;
      const key = 1;
      
      if (this.props.loggedInUser.uid === message.sender.uid) {
        component = this.getSenderMessageComponent(message, key);
      } else {
        component = this.getReceiverMessageComponent(message, key);
      }
      
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
            <div css={parentMessageStyle(this.props.parentMessage)}>{parentMessage}</div>
            {seperator}
            <MessageList
            theme={this.props.theme}
            messages={this.state.messageList} 
            item={this.props.item} 
            type={this.props.type}
            scrollToBottom={this.state.scrollToBottom}
            config={this.props.config}
            parentMessageId={this.props.parentMessage.id}
            loggedInUser={this.props.loggedInUser}
            actionGenerated={this.actionHandler} />
            <MessageComposer
            theme={this.props.theme}
            item={this.props.item} 
            type={this.props.type}
            parentMessageId={this.props.parentMessage.id}
            messageToBeEdited={this.state.messageToBeEdited}
            replyPreview={this.state.replyPreview}
            actionGenerated={this.actionHandler} />
          </div>
        </div>
      );
    }
}

export default MessageThread;