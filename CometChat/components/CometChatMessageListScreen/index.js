import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import MessageHeader from "../MessageHeader";
import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";

import { theme } from "../../resources/theme";
import { validateWidgetSettings } from "../../util/common";

import { chatWrapperStyle } from "./style";

import { incomingMessageAlert } from "../../resources/audio/";

class CometChatMessageListScreen extends React.PureComponent {

  constructor(props) {

    super(props);

    this.state = {
      messageList: [],
      scrollToBottom: true,
      messageToBeEdited: null,
      replyPreview: null
    }

    this.theme = Object.assign({}, theme, this.props.theme);
  }

  componentDidMount() {
    this.audio = new Audio(incomingMessageAlert);
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: null});

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: null });

    } else if(prevProps.type !== this.props.type) {
      
      this.setState({ messageList: [], scrollToBottom: true, messageToBeEdited: null });

    } else if(prevProps.composedthreadmessage !== this.props.composedthreadmessage) {

      this.updateReplyCount(this.props.composedthreadmessage);

    } else if(prevProps.callmessage !== this.props.callmessage) {

      this.actionHandler("callUpdated", this.props.callmessage);

    } else if (prevProps.groupmessage !== this.props.groupmessage) {

      if (validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") !== true) {
        this.appendMessage(this.props.groupmessage);
      }
    }
  }

  playAudio = () => {

    //if it is disabled for chat wigdet in dashboard
    if (this.props.hasOwnProperty("widgetsettings")
    && this.props.widgetsettings
    && this.props.widgetsettings.hasOwnProperty("main")
    && (this.props.widgetsettings.main.hasOwnProperty("enable_sound_for_messages") === false
    || (this.props.widgetsettings.main.hasOwnProperty("enable_sound_for_messages")
    && this.props.widgetsettings.main["enable_sound_for_messages"] === false))) {
      return false;
    }

    this.audio.currentTime = 0;
    this.audio.play();
  }

  actionHandler = (action, messages, key, group, options) => {
    
    switch(action) {
      case "customMessageReceived":
      case "messageReceived": {

        const message = messages[0];
        if(message.parentMessageId) {
          this.updateReplyCount(messages);
        } else {

          this.smartReplyPreview(messages);
          this.appendMessage(messages);
        }

        this.playAudio();
      }
      break;
      case "messageRead":
        this.props.actionGenerated(action, messages);
      break;
      case "messageComposed": {
        this.appendMessage(messages);
        this.props.actionGenerated("messageComposed", messages);
        break;
      }
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
      case "deleteMessage":
        this.deleteMessage(messages);
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
      case "viewActualImage":
        this.props.actionGenerated("viewActualImage", messages);
      break;
      default:
      break;
    }
  }

  deleteMessage = (message) => {

    const messageId = message.id;
    CometChat.deleteMessage(messageId).then(deletedMessage => {

      this.removeMessages([deletedMessage]);

      const messageList = [...this.state.messageList];
      let messageKey = messageList.findIndex(m => m.id === message.id);

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.props.actionGenerated("messageDeleted", [deletedMessage]);
      }
      
    }).catch(error => {
      console.log("Message delete failed with error:", error);
    });
  }

  editMessage = (message) => {
    this.setState({ messageToBeEdited: message, replyPreview: null });
  }

  messageEdited = (message) => {
    
    const messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m.id === message.id);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey];

      const newMessageObj = { ...messageObj, ...message };

      messageList.splice(messageKey, 1, newMessageObj);
      this.updateMessages(messageList);

      if (messageList.length - messageKey === 1 && !message.replyCount) {
        this.props.actionGenerated("messageEdited", [newMessageObj]);
      }
      
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

    if (validateWidgetSettings(this.props.widgetsettings, "hide_join_leave_notifications") !== true) {
      this.appendMessage([message]);
    }

    this.props.actionGenerated("groupUpdated", message, key, group, options);
  }

  callUpdated = (message) => {

    if (validateWidgetSettings(this.props.widgetsettings, "show_call_notifications") === false) {
      return false;
    }

    this.appendMessage([message]);
  }

  updateReplyCount = (messages) => {

    const receivedMessage = messages[0];
  
    let messageList = [...this.state.messageList];
    let messageKey = messageList.findIndex(m => m.id === receivedMessage.parentMessageId);
    if (messageKey > -1) {

      const messageObj = messageList[messageKey];
      let replyCount = (messageObj.replyCount) ? messageObj.replyCount : 0;
      replyCount = replyCount + 1;
      const newMessageObj = Object.assign({}, messageObj, { "replyCount": replyCount });
      
      messageList.splice(messageKey, 1, newMessageObj);
      this.setState({ messageList: messageList, scrollToBottom: false });
    }
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

  clearEditPreview = () => {
    this.setState({ "messageToBeEdited":  null });
  }

  render() {

    let messageComposer = (
      <MessageComposer 
      theme={this.theme}
      item={this.props.item} 
      type={this.props.type}
      widgetsettings={this.props.widgetsettings}
      messageToBeEdited={this.state.messageToBeEdited}
      replyPreview={this.state.replyPreview}
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
      <div css={chatWrapperStyle(this.theme)} className="main__chat">
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
        loggedInUser={this.props.loggedInUser}
        actionGenerated={this.actionHandler} />
        {messageComposer}
      </div>
    )
  }
}

export default CometChatMessageListScreen;