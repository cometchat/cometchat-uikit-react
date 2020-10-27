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
        message = "📷 Image ";
      break;
      case CometChat.MESSAGE_TYPE.FILE:
        message = "📁 File";
      break;
      case CometChat.MESSAGE_TYPE.VIDEO:
        message = "🎥 Video";
      break;
      case CometChat.MESSAGE_TYPE.AUDIO:
        message = "🎵 Audio";
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

    const message = "Custom Message";
    return message;
  }

  const getLastMessage = () => {

    if(!props.conversation.lastMessage)
      return false;

    const lastMessage = props.conversation.lastMessage;

    let message = null;
    if (lastMessage.hasOwnProperty("deletedAt")) {

      message = (props.loggedInUser.uid === lastMessage.sender.uid) ? "⚠ You deleted this message." : "⚠ This message was deleted.";

    } else {
    
      switch (lastMessage.category) {
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
      <span css={itemLastMsgTimeStyle(props)} className="item__details__timestamp">{new Date(props.conversation.lastMessage.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
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
    <div css={listItem(props)} className="list__item" onClick={() => props.handleClick(props.conversation, props.conversationKey)}>
      <div css={itemThumbnailStyle()} className="list__item__thumbnail">
        <Avatar 
        image={getAvatar()}
        cornerRadius="18px" 
        borderColor={props.theme.color.secondary}
        borderWidth="1px" />
        {presence}
      </div>
      <div css={itemDetailStyle()} className="list__item__details">
        <div css={itemRowStyle()} className="item__details_block_one">
          <div css={itemNameStyle()} className="item__details__name"
          onMouseEnter={event => toggleTooltip(event, true)} 
          onMouseLeave={event => toggleTooltip(event, false)}>{props.conversation.conversationWith.name}</div>
          {lastMessageTimeStamp}
        </div>
        <div css={itemRowStyle()} className="item__details_block_two">
          <div css={itemLastMsgStyle(props)} className="item__details__last-message"
          onMouseEnter={event => toggleTooltip(event, true)} 
          onMouseLeave={event => toggleTooltip(event, false)}>{getLastMessage()}</div>
          <BadgeCount theme={props.theme} count={props.conversation.unreadMessageCount} />
        </div>
      </div>
    </div>
  )
}

export default conversationview;