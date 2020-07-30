import React from "react";

import { CometChat } from '@cometchat-pro/chat';

import "./style.scss";

import Avatar from "../Avatar";
import BadgeCount from "../BadgeCount";
import StatusIndicator from "../StatusIndicator";

const conversationview = (props) => {

  const getMessage = () => {

    let message = "";
    const type = props.conversation.lastMessage.type;

    switch(type) {
      case CometChat.MESSAGE_TYPE.TEXT:
        message = props.conversation.lastMessage.text;
      break;
      case CometChat.MESSAGE_TYPE.MEDIA:
        message = "Media message";
      break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        message = "Image message";
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        message = "File message";
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = "Video message";
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = "Audio message";
      break;
      case CometChat.MESSAGE_TYPE.CUSTOM:
        message = "Custom message";
      break;
      default:
      break;
    }

    return message;
  }

  const getCallMessage = () => {

    let message = "";
    const type = props.conversation.lastMessage.type;

    switch(type) {
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = "Video call";
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = "Audio call";
      break;
      default:
      break;
    }
    
    return message;
  }

  const getActionMessage = () => {

    const message = props.conversation.lastMessage.message;

    //if action messages are set to hide in config
    if(props.config) {

      const found = props.config.find(cfg => {
        return (cfg.action === message.action && cfg.category === message.category);
      });

      if(found && found.enabled === false) {
        message = "";
      }
    }

    return message;
  }

  const getCustomMessage = () => {

    const message = "Some Custom Message";
    return message;
  }

  const getLastMessage = () => {

    if(!props.conversation.lastMessage)
      return false;

    let message = "";

    switch(props.conversation.lastMessage.category) {
      case "message":
        message = getMessage();
      break;
      case "call":
        message = getCallMessage();
      break;
      case "action":
        message = getActionMessage();
      break;
      case "custom":
        message = getCustomMessage();
      break;
      default:
      break;
    }
    
    return message;
  }

  const getAvatar = () => {

    let avatar;
    if(props.conversation.conversationType === "user") {
      avatar = props.conversation.conversationWith.avatar;
    } else if (props.conversation.conversationType === "group") {
      avatar = props.conversation.conversationWith.icon;
    }
    return avatar;
  }

  let lastMessageTimeStamp = "";
  if(props.conversation.lastMessage) {
    lastMessageTimeStamp = (
      <span className="chat-listitem-time">{new Date(props.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
    );
  }

  let presence;
  if(props.conversation.conversationType === "user") {
    const status = props.conversation.conversationWith.status;
    presence = (
      <StatusIndicator
      status={status}
      cornerRadius="50%" 
      borderColor="rgb(238, 238, 238)" 
      borderWidth="1px" />
    );
  }
  
  return (
    <div className="chat-listitem" onClick={() => props.handleClick(props.conversation, props.conversationKey)}>
      <div className="chat-thumbnail-wrap">
        <Avatar 
        image={getAvatar()}
        cornerRadius="18px" 
        borderColor="#CCC"
        borderWidth="1px" />
        {presence}
      </div>
      <div className="chat-listitem-dtls">
        <div className="chat-listitem-name">{props.conversation.conversationWith.name}</div>
        <p className="chat-listitem-txt">{getLastMessage()} </p>
      </div>
      {lastMessageTimeStamp}
      <BadgeCount count={props.conversation.unreadMessageCount}></BadgeCount>
    </div>
  )
}

export default conversationview;