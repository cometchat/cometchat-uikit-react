import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import MessageHeader from "../MessageHeader";
import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";

import { theme } from "../../resources/theme";

import { chatWrapperStyle } from "./style";

class CometChatMessageListScreen extends React.PureComponent {

  constructor(props) {

    super(props);

    this.state = {
      messageList: [],
      scrollToBottom: true
    }

    this.theme = Object.assign({}, theme, this.props.theme);
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      
      this.setState({ messageList: [], scrollToBottom: true});

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid) {
      
      this.setState({ messageList: [], scrollToBottom: true });

    } else if(prevProps.type !== this.props.type) {
      
      this.setState({ messageList: [], scrollToBottom: true });

    } else if(prevProps.composedthreadmessage !== this.props.composedthreadmessage) {

      this.updateReplyCount(this.props.composedthreadmessage);
    } else if(prevProps.callmessage !== this.props.callmessage) {

      this.actionHandler("callUpdated", this.props.callmessage);
    }

  }

  actionHandler = (action, messages, key, group, options) => {
    
    switch(action) {
      case "customMessageReceived":
      case "messageReceived": {

        const message = messages[0];
        if(message.parentMessageId) {
          this.updateReplyCount(messages);
        } else {
          this.appendMessage(messages);
        }

        this.props.actionGenerated(action, messages);
      }
      break;
      case "messageComposed":
        this.appendMessage(messages); 
      break;
      case "messageUpdated":
        this.updateMessages(messages);
      break;
      case "messageFetched":
        this.prependMessages(messages);
      break;
      case "messageFetchedAgain": 
        this.prependMessagesAndScrollBottom(messages);
      break;
      case "messageDeleted":
        this.removeMessages(messages);
      break;
      case "viewMessageThread":
        this.props.actionGenerated("viewMessageThread", messages);
      break;
      case "groupUpdated":
        this.groupUpdated(messages, key, group, options);
      break;
      case "callUpdated":
        this.callUpdated(messages);
      break;
      case "pollAnswered": 
        this.updatePollMessage(messages)
      break;
      case "pollCreated":
        this.appendPollMessage(messages)
      break;
      default:
      break;
    }
  }

  updatePollMessage = (message) => {

    const messageList = [...this.state.messageList];
    const messageId = message.poll.id;
    let messageKey = messageList.findIndex((m, k) => m.id === messageId);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey]; 

      const metadataObj = { "@injected": { "extensions": { "polls": message.poll }}};

      const newMessageObj = { ...messageObj, "metadata": metadataObj };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);
    }
  }

  appendPollMessage = (messages) => {

    this.appendMessage(messages); 
  }

  //messages are deleted
  removeMessages = (messages) => {

    const messageList = [...this.state.messageList];
    const filteredMessages = messageList.filter(message => message.id !== messages[0].id);
    this.setState({ messageList: filteredMessages, scrollToBottom: false });
  }

  //messages are fetched from backend
  prependMessages = (messages) => {

    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: false });
  }

  prependMessagesAndScrollBottom = (messages) => {
    const messageList = [...messages, ...this.state.messageList];
    this.setState({ messageList: messageList, scrollToBottom: true });
  }

  //message is received or composed & sent
  appendMessage = (message) => {

    let messages = [...this.state.messageList];
    messages = messages.concat(message);
    this.setState({ messageList: messages, scrollToBottom: true });
  }

  //message status is updated
  updateMessages = (messages) => {
    this.setState({ messageList: messages, scrollToBottom: false });
  }

  groupUpdated = (message, key, group, options) => {

    this.appendMessage([message]);
    this.props.actionGenerated("groupUpdated", message, key, group, options);
  }

  callUpdated = (message) => {
    this.appendMessage([message]);
  }

  updateReplyCount = (messages) => {

    const receivedMessage = messages[0];

    const messageList = [...this.state.messageList];

    let messageIndex = -1, messageFound = {};
    messageList.forEach((message, index) => {

      if(message.id === receivedMessage.parentMessageId) {

        messageIndex = index;
        let replyCount = (message.replyCount) ? message.replyCount : 0;
        messageFound = Object.assign({}, message, {"replyCount": ++replyCount});
      }

    });
    
    messageList.splice(messageIndex, 1, messageFound);
    this.setState({messageList: [...messageList], scrollToBottom: false});
  }

  render() {

    let messageComposer = (
      <MessageComposer 
      theme={this.theme}
      item={this.props.item} 
      type={this.props.type}
      widgetsettings={this.props.widgetsettings}
      enableCreatePoll={this.props.enableCreatePoll}
      actionGenerated={this.actionHandler} />
    );
    if(this.props.hasOwnProperty("widgetsettings")
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main") 
    && this.props.widgetsettings.main.hasOwnProperty("enable_sending_messages")
    && this.props.widgetsettings.main["enable_sending_messages"] === false) {
      messageComposer = null;
    }

    return (
      <div css={chatWrapperStyle(this.theme)}>
        <MessageHeader 
        sidebar={this.props.sidebar}
        theme={this.theme}
        item={this.props.item} 
        type={this.props.type} 
        viewdetail={this.props.viewdetail === false ? false : true}
        audiocall={this.props.audiocall === false ? false : true}
        videocall={this.props.videocall === false ? false : true}
        widgetsettings={this.props.widgetsettings}
        loggedInUser={this.props.loggedInUser}
        actionGenerated={this.props.actionGenerated} />
        <MessageList 
        theme={this.theme}
        messages={this.state.messageList} 
        item={this.props.item} 
        type={this.props.type}
        scrollToBottom={this.state.scrollToBottom}
        messageconfig={this.props.messageconfig}
        widgetsettings={this.props.widgetsettings}
        widgetconfig={this.props.widgetconfig}
        actionGenerated={this.actionHandler} />
        {messageComposer}
      </div>
    )
  }
}

export default CometChatMessageListScreen;