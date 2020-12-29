import React from "react";
import dateFormat from "dateformat";
/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChat } from '@cometchat-pro/chat';

import * as enums from "../../util/enums.js";
import { checkMessageForExtensionsData } from "../../util/common";

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

import { theme } from "../../resources/theme";
import Translator from "../../resources/localization/translator";

class ConversationView extends React.Component {

  constructor(props) {

    super(props);

    this.state = {
      lastMessage: "",
      lastMessageTimestamp: "",
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

    if (previousItem !== currentItem || prevProps.lang !== this.props.lang) {

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

      message = (this.props.loggedInUser.uid === lastMessage.sender.uid) ? `${Translator.translate("YOU_DELETED_THIS_MESSAGE", this.props.lang)}` : `${Translator.translate("THIS_MESSAGE_DELETED", this.props.lang)}`;

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

      timestamp = dateFormat(messageTimestamp, "shortTime");

    } else if (diffTimestamp < 48 * 60 * 60 * 1000) {

      timestamp = Translator.translate("YESTERDAY", this.props.lang);

    } else if (diffTimestamp < 7 * 24 * 60 * 60 * 1000) {

      timestamp = dateFormat(messageTimestamp, "dddd").toUpperCase();
      timestamp = Translator.translate(timestamp, this.props.lang);

    } else {

      timestamp = dateFormat(messageTimestamp, "dd/mm/yyyy"); 
    }

    return timestamp;
  }

  getCustomMessage = (lastMessage) => {

    let message = null;
    const sender = (this.props.loggedInUser.uid !== lastMessage.sender.uid) ? `${lastMessage.sender.name}: ` : ``;

    switch(lastMessage.type) {
      case enums.CUSTOM_TYPE_POLL: {
        
        const pollMessage = Translator.translate("CUSTOM_MESSAGE_POLL", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${pollMessage}` : `${pollMessage}`;
      }
      break;
      case enums.CUSTOM_TYPE_STICKER: {

        const stickerMessage = Translator.translate("CUSTOM_MESSAGE_STICKER", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${stickerMessage}` : `${stickerMessage}`;
      }
      break;
      case enums.CUSTOM_TYPE_DOCUMENT: {

        const docMessage = Translator.translate("CUSTOM_MESSAGE_DOCUMENT", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${docMessage}` : `${docMessage}`;
      }
      break;
      case enums.CUSTOM_TYPE_WHITEBOARD: {

        const whiteboardMessage = Translator.translate("CUSTOM_MESSAGE_WHITEBOARD", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${whiteboardMessage}` : `${whiteboardMessage}`;
      }
      break;
      default:
      break;
    }
    return message;
  }

  getTextMessage = (message) => {

    let messageText = message.text;

    //xss extensions data
    const xssData = checkMessageForExtensionsData(message, "xss-filter");
    if (xssData && xssData.hasOwnProperty("sanitized_text")) {
      messageText = xssData.sanitized_text;
    }

    //datamasking extensions data
    const maskedData = checkMessageForExtensionsData(message, "data-masking");
    if (maskedData
      && maskedData.hasOwnProperty("data")
      && maskedData.data.hasOwnProperty("sensitive_data")
      && maskedData.data.hasOwnProperty("message_masked")
      && maskedData.data.sensitive_data === "yes") {
      messageText = maskedData.data.message_masked;
    }

    //profanity extensions data
    const profaneData = checkMessageForExtensionsData(message, "profanity-filter");
    if (profaneData
      && profaneData.hasOwnProperty("profanity")
      && profaneData.hasOwnProperty("message_clean")
      && profaneData.profanity === "yes") {
      messageText = profaneData.message_clean;
    }

    return messageText;
  }

  getMessage = (lastMessage) => {

    let message = null;
    const sender = (this.props.loggedInUser.uid !== lastMessage.sender.uid) ? `${lastMessage.sender.name}: ` : ``;

    switch (lastMessage.type) {

      case CometChat.MESSAGE_TYPE.TEXT: {

        const textMessage = this.getTextMessage(lastMessage);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${textMessage}` : `${textMessage}`;
      }
      break;
      case CometChat.MESSAGE_TYPE.MEDIA: {

        const mediaMessage = Translator.translate("MEDIA_MESSAGE", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${mediaMessage}` : `${mediaMessage}`; 
      }
      break;
      case CometChat.MESSAGE_TYPE.IMAGE: {

        const imageMessage = Translator.translate("MESSAGE_IMAGE", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${imageMessage}` : `${imageMessage}`; 
      }
      break
      case CometChat.MESSAGE_TYPE.FILE: {

        const fileMessage = Translator.translate("MESSAGE_FILE", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${fileMessage}` : `${fileMessage}`; 
      }
      break;
      case CometChat.MESSAGE_TYPE.VIDEO: {

        const videoMessage = Translator.translate("MESSAGE_VIDEO", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${videoMessage}` : `${videoMessage}`; 
      }
      break;
      case CometChat.MESSAGE_TYPE.AUDIO: {

        const audioMessage = Translator.translate("MESSAGE_AUDIO", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${audioMessage}` : `${audioMessage}`; 
      }
      break;
      case CometChat.MESSAGE_TYPE.CUSTOM: {

        const customMessage = Translator.translate("CUSTOM_MESSAGE", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${customMessage}` : `${customMessage}`; 
      }
      break;
      default:
      break;
    }

    return message;
  }

  getCallMessage = (lastMessage) => {

    let message = null;
    const sender = (this.props.loggedInUser.uid !== lastMessage.sender.uid) ? `${lastMessage.sender.name}: ` : ``;

    switch (lastMessage.type) {
      case CometChat.MESSAGE_TYPE.VIDEO: {

        const videoMessage = Translator.translate("VIDEO_CALL", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${videoMessage}` : `${videoMessage}`;
      }
      break;
      case CometChat.MESSAGE_TYPE.AUDIO: {

        const audioMessage = Translator.translate("AUDIO_CALL", this.props.lang);
        message = (lastMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) ? `${sender} ${audioMessage}` : `${audioMessage}`;
      }
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
        borderColor={this.props.theme.borderColor.primary} />
      );
    }

    return (
      <div css={listItem(this.props)} className="list__item" onClick={() => this.props.handleClick(this.props.conversation, this.props.conversationKey)}>
        <div css={itemThumbnailStyle()} className="list__item__thumbnail">
          <Avatar image={this.getAvatar()} borderColor={this.props.theme.borderColor.primary} />
          {presence}
        </div>
        <div css={itemDetailStyle()} className="list__item__details" dir={Translator.getDirection(this.props.lang)}>
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

// Specifies the default values for props:
ConversationView.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

ConversationView.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default ConversationView;