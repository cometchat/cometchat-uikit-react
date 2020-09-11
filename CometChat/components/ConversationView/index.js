import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from '@cometchat-pro/chat';

import Avatar from "../Avatar";
import BadgeCount from "../BadgeCount";
import StatusIndicator from "../StatusIndicator";

import {
  listItem,
  itemThumbnailStyle,
  itemDetailStyle,
  itemRowStyle,
  itemNameStyle,
  itemLastMsgStyle,
  itemLastMsgTimeStyle
} from "./style";

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

    let message = props.conversation.lastMessage.message;

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

  let lastMessageTimeStamp = null;
  if(props.conversation.lastMessage) {
    lastMessageTimeStamp = (
      <span css={itemLastMsgTimeStyle(props)}>{new Date(props.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
    );
  }

  let presence;
  if(props.conversation.conversationType === "user") {
    const status = props.conversation.conversationWith.status;
    presence = (
      <StatusIndicator
      widgetsettings={props.widgetsettings}
      status={status}
      cornerRadius="50%" 
      borderColor={props.theme.color.darkSecondary}
      borderWidth="1px" />
    );
  }

  const toggleTooltip = (event, flag) => {

    const elem = event.target;

    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;
    
    if(scrollWidth <= clientWidth) {
      return false;
    }

    if(flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
  }

  return (
    <div css={listItem(props)} onClick={() => props.handleClick(props.conversation, props.conversationKey)}>
      <div css={itemThumbnailStyle()}>
        <Avatar 
        image={getAvatar()}
        cornerRadius="18px" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px" />
        {presence}
      </div>
      <div css={itemDetailStyle()}>
        <div css={itemRowStyle()}>
          <div css={itemNameStyle()}
          onMouseEnter={event => toggleTooltip(event, true)} 
          onMouseLeave={event => toggleTooltip(event, false)}>{props.conversation.conversationWith.name}</div>
          <BadgeCount theme={props.theme} count={props.conversation.unreadMessageCount}></BadgeCount>
        </div>
        <div css={itemRowStyle()}>
          <div css={itemLastMsgStyle(props)}
          onMouseEnter={event => toggleTooltip(event, true)} 
          onMouseLeave={event => toggleTooltip(event, false)}>{getLastMessage()}</div>
          {lastMessageTimeStamp}
        </div>
      </div>
    </div>
  )
}

export default conversationview;