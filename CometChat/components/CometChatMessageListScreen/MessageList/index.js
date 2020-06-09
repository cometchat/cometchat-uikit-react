import React from "react";
import "./style.scss";

import { CometChat } from "@cometchat-pro/chat";

import { CometChatManager } from "../../../util/controller";
import { MessageListManager } from "./controller";

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


class MessageList extends React.PureComponent {
  loggedInUser = null;
  lastScrollTop = 0;

  constructor(props) {

    super(props);
    this.state = {
      onItemClick: null
    }

    this.messagesEnd = React.createRef();
  }

  componentDidMount() {
    this.MessageListManager = new MessageListManager(this.props.item, this.props.type);
    this.getMessages();
    this.MessageListManager.attachListeners(this.messageUpdated);
    
  }

  componentDidUpdate(prevProps, prevState) {

    const previousMessageStr = JSON.stringify(prevProps.messages);
    const currentMessageStr = JSON.stringify(this.props.messages);

    if (this.props.type === 'user' && prevProps.item.uid !== this.props.item.uid) {
      
      this.MessageListManager.removeListeners();
      this.MessageListManager = new MessageListManager(this.props.item, this.props.type);
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if (this.props.type === 'group' && prevProps.item.guid !== this.props.item.guid){

      this.MessageListManager.removeListeners();
      this.MessageListManager = new MessageListManager(this.props.item, this.props.type);
      this.getMessages();
      this.MessageListManager.attachListeners(this.messageUpdated);

    } else if (previousMessageStr !== currentMessageStr) {//to avoid re-render when message status is updated
      
      if(this.props.scrollToBottom) {
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
      
      this.loggedInUser = user;
      this.MessageListManager.fetchPreviousMessages().then((messageList) => {

        messageList.forEach((message) => {

          //if the sender of the message is not the loggedin user, mark it as read.
          if (message.getSender().getUid() !== user.getUid() && !message.getReadAt()) {
            
            if(message.getReceiverType() === "user") {
              CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());
            } else if(message.getReceiverType() === "group") {
              CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
            }
          }

        });
        
        this.lastScrollTop = this.messagesEnd.scrollHeight;
        this.props.actionGenerated("messageFetched", messageList);
          
      }).catch((error) => {
        //TODO Handle the erros in contact list.
        console.error("[MessageList] getMessages fetchPrevious error", error);
      });

    }).catch((error) => {
      console.log("[MessageList] getMessages getLoggedInUser error", error);
    });

  }

  //callback for listener functions
  messageUpdated = (key, message, isReceipt) => {

    //new messages
    if (this.props.type === 'group' 
    && message.getReceiverType() === 'group'
    && message.getReceiver().guid === this.props.item.guid 
    && !isReceipt) {

      if(!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
      this.props.actionGenerated("messageReceived", [message]);
        
    } else if (this.props.type === 'user' 
    && message.getReceiverType() === 'user'
    && message.getSender().getUid() === this.props.item.uid 
    && !isReceipt) {

      if(!message.getReadAt()) {
        CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());
      }

      this.props.actionGenerated("messageReceived", [message]);
    }

    //read receipts
    if (isReceipt 
      && message.getReceiverType() === 'user'
      && message.getSender().getUid() === this.props.item.uid
      && message.getReceiver() === this.loggedInUser.uid) {

        let messageList = [...this.props.messages];
        if (message.getReceiptType() === "delivery") {

          //search for same message
          let msg = messageList.find((m, k) => m.id === message.messageId);
          
          //if found, update state
          if(msg) {
            msg["deliveredAt"] = message.getDeliveredAt();
            this.props.actionGenerated("messageUpdated", messageList);
          }

        } else if (message.getReceiptType() === "read") {

          //search for same message
          let msg = messageList.find((m, k) => m.id === message.messageId);
          //if found, update state
          if(msg) {
            msg["readAt"] = message.getReadAt();
            this.props.actionGenerated("messageUpdated", messageList);
          }
        }

    } else if (isReceipt 
      && message.getReceiverType() === 'group' 
      && message.getReceiver() === this.props.item.guid) {
        //not implemented
    }
    
  }
  handleScroll = (e) => {
    
    const top = Math.round(e.currentTarget.scrollTop) === 0;
    if (top && this.props.messages.length) {
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
    this.MessageListManager.removeListeners();
    this.MessageListManager = null;
  }
}

export default MessageList;