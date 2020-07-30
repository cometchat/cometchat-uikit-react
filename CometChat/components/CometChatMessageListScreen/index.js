import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../util/controller";

import MessageHeader from "../MessageHeader";
import MessageList from "../MessageList";
import MessageComposer from "../MessageComposer";
import CallScreen from "../CallScreen";

class CometChatMessageListScreen extends React.PureComponent {

  state = {
    messageList: [],
    scrollToBottom: true,
    outgoingCall: null
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
    }

  }

  messageHeaderActionHandler = (action) => {
    
    switch(action) {
      case "audioCall":
        this.audioCall();
      break;
      case "videoCall":
        this.videoCall();
      break;
      case "viewDetail":
        this.props.actionGenerated("viewDetail");
      break;
      case "menuClicked":
        this.props.actionGenerated("menuClicked");
      break;
      default:
      break;
    }
  }

  audioCall = () => {

    let receiverId, receiverType;
    if(this.props.type === "user") {

      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if(this.props.type === "group") {

      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }

    let callType = CometChat.CALL_TYPE.AUDIO;

    CometChatManager.audioCall(receiverId, receiverType, callType).then(call => {

      this.callScreenAction("callStarted", call);
      this.setState({ outgoingCall: call });

    }).catch(error => {
      console.log("Call initialization failed with exception:", error);
    });

  }

  videoCall = () => {

    let receiverId, receiverType;
    if(this.props.type === "user") {

      receiverId = this.props.item.uid;
      receiverType = CometChat.RECEIVER_TYPE.USER;

    } else if(this.props.type === "group") {
      receiverId = this.props.item.guid;
      receiverType = CometChat.RECEIVER_TYPE.GROUP;
    }
   
    let callType = CometChat.CALL_TYPE.VIDEO;

    CometChatManager.videoCall(receiverId, receiverType, callType).then(call => {

      this.callScreenAction("callStarted", call);
      this.setState({ outgoingCall: call });

    }).catch(error => {
      console.log("Call initialization failed with exception:", error);
    });

  }

  actionHandler = (action, messages, key, group, options) => {
    
    switch(action) {
      case "messageReceived": {

        const message = messages[0];
        if(message.parentMessageId) {
          this.updateReplyCount(messages);
        } else {
          this.appendMessage(messages);
        }
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
      case "messageDeleted":
        this.removeMessages(messages);
      break;
      case "viewMessageThread":
        this.props.actionGenerated("viewMessageThread", messages);
      break;
      case "groupUpdated":
        this.groupUpdated(messages, key, group, options);
      break;
      default:
      break;
    }
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

  groupUpdated = (message, key, group, options) => {

    this.appendMessage([message]);
    this.props.actionGenerated("groupUpdated", message, key, group, options);
  }

  callScreenAction = (action, call) => {

    switch(action) {
      case "callStarted":
      case "callEnded":
        if(!call) return;
        this.appendMessage(call);
      break;
      default:
      break;
    }

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

    return (

      <React.Fragment>
        <MessageHeader 
          item={this.props.item} 
          type={this.props.type} 
          viewdetail={this.props.viewdetail === false ? false : true}
          audiocall={this.props.audiocall === false ? false : true}
          videocall={this.props.videocall === false ? false : true}
          actionGenerated={this.messageHeaderActionHandler}></MessageHeader>
        <MessageList 
          messages={this.state.messageList} 
          item={this.props.item} 
          type={this.props.type}
          scrollToBottom={this.state.scrollToBottom}
          messageconfig={this.props.messageconfig}
          widgetconfig={this.props.widgetconfig}
          actionGenerated={this.actionHandler}></MessageList>
        <MessageComposer 
          item={this.props.item} 
          type={this.props.type}
          actionGenerated={this.actionHandler}></MessageComposer>
        <CallScreen className="callscreen"
          item={this.props.item} 
          type={this.props.type}
          actionGenerated={this.callScreenAction} 
          outgoingCall={this.state.outgoingCall} />
      </React.Fragment>
    )
  }
}

export default CometChatMessageListScreen;