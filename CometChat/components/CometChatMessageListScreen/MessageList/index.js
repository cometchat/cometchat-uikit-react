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

    } else if (previousMessageStr !== currentMessageStr) {
      
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
        component =  (message.text ? <SenderMessageBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component =  (message.data.url ? <SenderImageBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        component =  (message.data.attachments ? <SenderFileBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component =  (message.data.url ? <SenderVideoBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component =  (message.data.url ? <SenderAudioBubble message={message} /> : null);
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
        component = (message.text ? <ReceiverMessageBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        component = (message.data.url ? <ReceiverImageBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        component = (message.data.attachments ? <ReceiverFileBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        component = (message.data.url ? <ReceiverAudioBubble message={message} /> : null);
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        component = (message.data.url ? <ReceiverVideoBubble message={message} /> : null);
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
          component = (message.message ? <div className="cc1-chat-win-action-msg-wrap"><p className="chat-txt-msg">{message.message}</p></div> : "");
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
          component = (message.message ? <div className="cc1-chat-win-action-msg-wrap"><p className="chat-txt-msg">{message.message}</p></div> : "");
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
        <div id={message.id} key={key}>
          {this.getComponent(message)}
        </div>
      );
    });

    return (
      <div ref={(el) => { this.messagesEnd = el; }} className="cc1-chat-win-conver-wrap" onScroll={this.handleScroll}>
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