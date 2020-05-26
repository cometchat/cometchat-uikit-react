import React from "react";

import { CometChat } from '@cometchat-pro/chat';

import "./style.scss";

import Avatar from "../Avatar";
import BadgeCount from "../BadgeCount";

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

    if(type === CometChat.MESSAGE_TYPE.VIDEO) {
      message = "Video call";
    } else if(type === CometChat.MESSAGE_TYPE.AUDIO) {
      message = "Audio call";
    }
    
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
        message = props.conversation.lastMessage.message;
      break;
      case "custom":
        message = "Some Custom Message";
      break;
      default:
      break;
    }
    
    return message;
  }

  const getAvatar = () => {

    let avatar = "";
    if(props.conversation.getConversationType() === "user") {
      avatar = props.conversation.getConversationWith().getAvatar();
    } else if (props.conversation.getConversationType() === "group") {
      avatar = props.conversation.getConversationWith().getIcon();
    }
    return avatar;
  }
    
  return (
    <div className="cp-conversationview">
      <div className="row">
        <div className="col-xs-1 cp-conversation-avatar">
          <Avatar 
          image={getAvatar()}
          cornerRadius="50%" 
          borderColor="#CCC"
          borderWidth="1px"></Avatar>
        </div>
        <div className="col cp-user-info">
          <div className="row cp-no-padding">
            <div className="col-lg-9 col-sm-9 cp-no-padding">
              <div className="cp-username  cp-ellipsis font-bold">{props.conversation.conversationWith.name}</div>
            </div>
            <div className="col-lg-3 col-sm-3 cp-no-padding">
              <div className="cp-time text-muted"> {new Date(props.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</div>
            </div>
          </div>
          <div className="row cp-userstatus">
            <div className="col cp-no-padding">
              <div className="text-muted cp-ellipsis">
                {getLastMessage()} 
              </div>
            </div>
            <div className="col cp-no-padding">
              <BadgeCount count={props.conversation.unreadMessageCount}></BadgeCount>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default conversationview;