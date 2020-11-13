import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import { CometChat } from '@cometchat-pro/chat';

import * as enums from "../../util/enums.js";

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

class ConversationView extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      lastMessage: "",
      lastMessageTimestamp: ""
    }
  }

  componentDidMount() {

    const message = this.getLastMessage();
    const timestamp = this.getLastMessageTimestamp();

    this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
  }

  componentDidUpdate(prevProps) {

    const previousItem = JSON.stringify(prevProps.conversation);
    const currentItem = JSON.stringify(this.props.conversation);

    if (previousItem !== currentItem) {

      const message = this.getLastMessage();
      const timestamp = this.getLastMessageTimestamp();

      this.setState({ lastMessage: message, lastMessageTimestamp: timestamp });
    }
  }

  getLastMessage = () => {

    if (this.props.hasOwnProperty("conversation") === false) {
      return false;
    }

    if (this.props.conversation.hasOwnProperty("lastMessage") === false) {
      return false;
    }

    let message = null;
    const lastMessage = this.props.conversation.lastMessage;

    if (lastMessage.hasOwnProperty("deletedAt")) {

      message = (this.props.loggedInUser.uid === lastMessage.sender.uid) ? "⚠ You deleted this message." : "⚠ This message was deleted.";

    } else {

      switch (lastMessage.category) {
        case "message":
          message = this.getMessage(lastMessage);
          break;
        case "call":
          message = this.getCallMessage(lastMessage);
          break;
        case "action":
          message = lastMessage.message;
          break;
        case "custom":
          message = this.getCustomMessage(lastMessage);
          break;
        default:
          break;
      }
    }

    return message;
  }

  getLastMessageTimestamp = () => {

    if (this.props.hasOwnProperty("conversation") === false) {
      return false;
    }

    if (this.props.conversation.hasOwnProperty("lastMessage") === false) {
      return false;
    }

    if (this.props.conversation.lastMessage.hasOwnProperty("sentAt") === false) {
      return false;
    }

    let timestamp = null;

    const messageTimestamp = new Date(this.props.conversation.lastMessage.sentAt * 1000);
    const currentTimestamp = Date.now();

    const diffTimestamp = currentTimestamp - messageTimestamp;

    if (diffTimestamp < 24 * 60 * 60 * 1000) {

      timestamp = messageTimestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    } else if (diffTimestamp < 48 * 60 * 60 * 1000) {

      timestamp = "Yesterday";

    } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {

      timestamp = messageTimestamp.toLocaleString('en-US', { weekday: 'long' });

    } else {

      timestamp = messageTimestamp.toLocaleDateString('en-US', { year: "2-digit", month: "2-digit", day: "2-digit" });
    }

    return timestamp;
  }

  getCustomMessage = (lastMessage) => {

    let message = null;
    switch(lastMessage.type) {
      case enums.CUSTOM_TYPE_POLL:
        message = "Poll";
        break;
      case enums.CUSTOM_TYPE_STICKER:
        message = "Sticker";
        break;
      default:
        break;
    }

    return message;
  }

  getMessage = (lastMessage) => {

    let message = null;
    switch (lastMessage.type) {

      case CometChat.MESSAGE_TYPE.TEXT:
        message = lastMessage.text;
        break;
      case CometChat.MESSAGE_TYPE.MEDIA:
        message = "Media message";
        break;
      case CometChat.MESSAGE_TYPE.IMAGE:
        message = "📷 Image ";
        break
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

  getCallMessage = (lastMessage) => {

    let message = null;
    switch (lastMessage.type) {
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
  toggleTooltip = (event, flag) => {

    const elem = event.target;

    const scrollWidth = elem.scrollWidth;
    const clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    if (flag) {
      elem.setAttribute("title", elem.textContent);
    } else {
      elem.removeAttribute("title");
    }
  }

  getAvatar = () => {

    let avatar;
    if (this.props.conversation.conversationType === "user") {
      avatar = this.props.conversation.conversationWith.avatar;
    } else if (this.props.conversation.conversationType === "group") {
      avatar = this.props.conversation.conversationWith.icon;
    }
    return avatar;
  }
  
  render() {

    let lastMessageTimeStamp = null;
    if (this.state.lastMessage) {
      lastMessageTimeStamp = (
        <span css={itemLastMsgTimeStyle(this.props)} className="item__details__timestamp">{this.state.lastMessageTimestamp}</span>
      );
    }

    let presence;
    if (this.props.conversation.conversationType === "user") {

      const status = this.props.conversation.conversationWith.status;
      presence = (
        <StatusIndicator
        widgetsettings={this.props.widgetsettings}
        status={status}
        cornerRadius="50%"
        borderColor={this.props.theme.color.darkSecondary}
        borderWidth="1px" />
      );
    }

    return (
      <div css={listItem(this.props)} className="list__item" onClick={() => this.props.handleClick(this.props.conversation, this.props.conversationKey)}>
        <div css={itemThumbnailStyle()} className="list__item__thumbnail">
          <Avatar
          image={this.getAvatar()}
          cornerRadius="18px"
          borderColor={this.props.theme.color.secondary}
          borderWidth="1px" />
          {presence}
        </div>
        <div css={itemDetailStyle()} className="list__item__details">
          <div css={itemRowStyle()} className="item__details_block_one">
            <div css={itemNameStyle()} className="item__details__name"
            onMouseEnter={event => this.toggleTooltip(event, true)}
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.props.conversation.conversationWith.name}</div>
            {lastMessageTimeStamp}
          </div>
          <div css={itemRowStyle()} className="item__details_block_two">
            <div css={itemLastMsgStyle(this.props)} className="item__details__last-message"
            onMouseEnter={event => this.toggleTooltip(event, true)}
            onMouseLeave={event => this.toggleTooltip(event, false)}>{this.state.lastMessage}</div>
            <BadgeCount theme={this.props.theme} count={this.props.conversation.unreadMessageCount} />
          </div>
        </div>
      </div>
    );

  }
}

export default ConversationView;