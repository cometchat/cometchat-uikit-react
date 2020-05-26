import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../../util/controller";
import { ChatWindowManager } from "./controller";

import SenderMessageBubble from "./SenderMessageBubble";
import ReceiverMessageBubble from "./ReceiverMessageBubble";
import SenderImageBubble from "./SenderImageBubble";
import ReceiverImageBubble from "./ReceiverImageBubble";
import SenderFileBubble from "./SenderFileBubble";
import ReceiverFileBubble from "./ReceiverFileBubble";
import SenderAudioBubble from "./SenderAudioBubble";
import ReceiverAudioBubble from "./ReceiverAudioBubble";
import SenderVideoBubble from "./SenderVideoBubble";
import ReceiverVideoBubble from "./ReceiverVideoBubble";

import CallMessage from "./CallMessage";


class ChatWindow extends React.PureComponent {
  loggedInUser = null;
  updateScrollBar = true;
  lastScrollTop = 0;

  constructor(props) {

    super(props);
    this.state = {
      onItemClick: null
    }

    this.messagesEnd = React.createRef();
  }

  componentDidMount() {

    this.ChatWindowManager = new ChatWindowManager(this.props.item, this.props.type);
    this.getMessages();
    this.ChatWindowManager.attachListeners(this.messageUpdated);
    
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {

      this.updateScrollBar = true;
      this.ChatWindowManager.removeListeners();
      this.ChatWindowManager = new ChatWindowManager(this.props.item, this.props.type);
      this.getMessages();
      this.ChatWindowManager.attachListeners(this.messageUpdated);

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid){

      this.updateScrollBar = true;
      this.ChatWindowManager.removeListeners();
      this.ChatWindowManager = new ChatWindowManager(this.props.item, this.props.type);
      this.getMessages();
      this.ChatWindowManager.attachListeners(this.messageUpdated);

    } else if (prevProps.messages !== this.props.messages) {
      
      if(this.updateScrollBar) {
        this.scrollToBottom();
      } else {
        this.scrollToBottom(this.lastScrollTop);
      }
      
    }
  }

  scrollToBottom = (scrollHeight = 0) => {
    
    if (this.messagesEnd) {
      this.messagesEnd.scrollTop = (this.messagesEnd.scrollHeight - scrollHeight);
    }
  }

  getMessages = () => {

    new CometChatManager().getLoggedInUser().then((user) => {

      this.ChatWindowManager.fetchPreviousMessages().then((messageList) => {

        messageList.forEach((message) => {

          //if the sender of the message is not the loggedin user, mark it as read.
          if (message.getSender().uid !== user.uid) {
            CometChat.markAsRead(message.id, message.getSender().getUid(), 'user');
          }

        });
        
        this.loggedInUser = user;
        this.lastScrollTop = this.messagesEnd.scrollHeight;
        this.props.actionGenerated("messageFetched", messageList);
          
      }).catch((error) => {
        //TODO Handle the erros in contact list.
        console.error("[ChatWindow] getMessages fetchPrevious error", error);
      });

    }).catch((error) => {
      console.log("[ChatWindow] getMessages getLoggedInUser error", error);
    });

  }
 
  //callback for listener functions
  messageUpdated = (key, message, isReceipt) => {

    if (this.props.type === 'group' 
    && message.receiverType === 'group' 
    && message.receiver.guid === this.props.item.guid 
    && !isReceipt) {

      CometChat.markAsRead(message.messageId, message.receiver.guid, 'group');
      this.props.actionGenerated("messageReceived", [message]);
      this.scrollToBottom();
        
    } else if (this.props.type === 'user' 
    && message.receiverType === 'user'
    && message.sender.uid === this.props.item.uid 
    && !isReceipt) {

      CometChat.markAsRead(message.id, message.sender.uid, 'user');
      this.props.actionGenerated("messageReceived", [message]);
      this.scrollToBottom();
    }

    if (isReceipt) {

      let messageList = [...this.props.messages];
      if (message.receiptType === "delivery") {

        //search for same message
        let msg = messageList.find((m, k) => m.id === message.messageId);

        //if found, update state
        if(msg) {
          msg.deliveredAt = message.deliveredAt;
          this.props.actionGenerated("messageFetched", messageList);
        }

      } else if (message.receiptType === "read") {

        //search for same message
        let msg = messageList.find((m, k) => m.id === message.messageId);
        //if found, update state
        if(msg && !msg.readAt) {
          msg.readAt = message.readAt;
          this.props.actionGenerated("messageFetched", messageList);
        }
      }
    }
  }

  handleScroll = (e) => {
    
    const top = Math.round(e.currentTarget.scrollTop) === 0;
    if (top && this.props.messages.length) {
      this.updateScrollBar = false;
      this.getMessages();
    }
  }

  handleClick = (message) => {
    this.props.onItemClick(message, 'message');
  }

  messageComponentforSender = (message) => {

    let component;
    switch (message.type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        component =  (<SenderMessageBubble message={message} ></SenderMessageBubble>);
      break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component =  (<SenderImageBubble message={message} ></SenderImageBubble>);
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        component =  (<SenderFileBubble message={message} ></SenderFileBubble>);
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component =  (<SenderAudioBubble message={message} ></SenderAudioBubble>);
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component =  (<SenderVideoBubble message={message} ></SenderVideoBubble>);
      break;
      default:
      break;
    }

    return component;
  }

  messageComponentforReceiver = (message) => {

    let component;
    switch (message.type) {
      case "message":
      case CometChat.MESSAGE_TYPE.TEXT:
        component = (<ReceiverMessageBubble message={message}></ReceiverMessageBubble>);
      break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = (<ReceiverImageBubble message={message} ></ReceiverImageBubble>);
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = (<ReceiverFileBubble message={message} ></ReceiverFileBubble>);
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = (<ReceiverAudioBubble message={message} ></ReceiverAudioBubble>);
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = (<ReceiverVideoBubble message={message} ></ReceiverVideoBubble>);
      break;
      default:
      break;
    }
    return component;
  }
  
  getComponent = (message) => {

    let component;

    if(this.loggedInUser.uid === message.sender.uid) {
      
      switch(message.category) {
        case "message":
          component = this.messageComponentforSender(message);
        break;
        case "call":
          component = (<CallMessage message={message} ></CallMessage>);
        break;
        case "action":
          component = (<div className="cp-call-message-container"><p>{message.message}</p></div>);
        break;
        default:
        break;
      }

    } else {

      switch(message.category) {
        case "message":
          component = this.messageComponentforReceiver(message);
        break;
        case "call":
          component = (<CallMessage message={message} ></CallMessage>);
        break;
        case "action":
          component = (<div className="cp-call-message-container"><p>{message.message}</p></div>);
        break;
        default:
        break;
      }

    }
    
    return component;
  }

  render() {
    
    let messages;
    messages = this.props.messages.map((message, key) => {
      return (
        <div id={key} key={key}>
          {this.getComponent(message)}
        </div>
      );
    });

    return (
      <div ref={(el) => { this.messagesEnd = el; }} className="cp-chat-window" onScroll={this.handleScroll}>
        {messages}
      </div>
    );
  }

  componentWillUnmount() {
    this.ChatWindowManager.removeListeners();
    this.ChatWindowManager = null;
  }
}


export default ChatWindow;