import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { linkify, checkMessageForExtensionsData, validateWidgetSettings } from "../../util/common";
import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import LinkPreview from "../LinkPreview";
import RegularReactionView from "../RegularReactionView";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageTxtContainerStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

class ReceiverMessageBubble extends React.Component {

  messageFrom = "receiver";

  constructor(props) {
    super(props);

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });
    if (message.receiverType === 'group') {

      if (!message.sender.avatar) {

        const uid = message.sender.getUid();
        const char = message.sender.getName().charAt(0).toUpperCase();

        message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
      }
    }

    this.state = {
      message: message
    }
  }

  componentDidUpdate(prevProps) {

    const previousMessageStr = JSON.stringify(prevProps.message);
    const currentMessageStr = JSON.stringify(this.props.message);

    if (previousMessageStr !== currentMessageStr) {

      const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
      this.setState({ message: message })
    }
  }

  getMessageText = () => {

    let messageText = this.state.message.text;

    //xss extensions data
    const xssData = checkMessageForExtensionsData(this.state.message, "xss-filter");
    if (xssData 
    && xssData.hasOwnProperty("sanitized_text")
    && xssData.hasOwnProperty("hasXSS")
    && xssData.hasXSS === "yes") {
      messageText = xssData.sanitized_text;
    }

    //datamasking extensions data
    const maskedData = checkMessageForExtensionsData(this.state.message, "data-masking");
    if (maskedData
    && maskedData.hasOwnProperty("data")
    && maskedData.data.hasOwnProperty("sensitive_data")
    && maskedData.data.hasOwnProperty("message_masked")
    && maskedData.data.sensitive_data === "yes") {

      messageText = maskedData.data.message_masked;
    }

    //profanity extensions data
    const profaneData = checkMessageForExtensionsData(this.state.message, "profanity-filter");
    if (profaneData
    && profaneData.hasOwnProperty("profanity")
    && profaneData.hasOwnProperty("message_clean")
    && profaneData.profanity === "yes") {

      messageText = profaneData.message_clean;
    }

    const formattedText = linkify(messageText);

    const emojiParsedMessage = twemoji.parse(formattedText, { folder: "svg", ext: ".svg" });
    const parsedMessage = ReactHtmlParser(emojiParsedMessage, { decodeEntities: false });
    const emojiMessage = parsedMessage.filter(message => (message instanceof Object && message.type === "img"));

    let showVariation = true;
    //if larger size emojis are disabled in chat widget
    if (validateWidgetSettings(this.props.widgetsettings, "show_emojis_in_larger_size") === false) {
      showVariation = false;
    }

    messageText = (
      <div css={messageTxtWrapperStyle(this.props)} className="message__txt__wrapper">
        <p css={messageTxtStyle(parsedMessage, emojiMessage, showVariation)} className="message__txt">{parsedMessage}</p>
      </div>
    );

    return messageText;
  }

  render() {

    let avatar = null, name = null;
    if (this.state.message.receiverType === 'group') {

      avatar = (
        <div css={messageThumbnailStyle()} className="message__thumbnail">
          <Avatar
          cornerRadius="50%"
          borderColor={this.props.theme.color.secondary}
          borderWidth="1px"
          image={this.state.message.sender.avatar} />
        </div>
      );

      name = (<div css={nameWrapperStyle(avatar)} className="message__name__wrapper"><span css={nameStyle(this.props)} className="message__name">{this.state.message.sender.name}</span></div>);
    }

    let messageText = this.getMessageText();
    //linkpreview extensions data
    const linkPreviewData = checkMessageForExtensionsData(this.state.message, "link-preview");
    if (linkPreviewData && linkPreviewData.hasOwnProperty("links") && linkPreviewData["links"].length) {

      messageText = (
        <LinkPreview {...this.props} message={this.state.message} messageText={messageText} />
      );
    }

    //messagereactions extensions data
    let messageReactions = null;
    const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
    if (reactionsData) {

      if (Object.keys(reactionsData).length) {
        messageReactions = (
          <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
            <RegularReactionView
            theme={this.props.theme}
            message={this.state.message}
            reaction={reactionsData}
            loggedInUser={this.props.loggedInUser}
            widgetsettings={this.props.widgetsettings}
            actionGenerated={this.props.actionGenerated} />
          </div>
        );
      }
    }

    return (
      <div css={messageContainerStyle()} className="receiver__message__container message__text">
        
        <div css={messageWrapperStyle()} className="message__wrapper">
          {avatar}
          <div css={messageDetailStyle()} className="message__details">
            {name}
            <ToolTip {...this.props} message={this.state.message} name={name} />
            <div css={messageTxtContainerStyle()} className="message__text__container">{messageText}</div>

            {messageReactions}

            <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
              <ReadReciept {...this.props} message={this.state.message} />
              <ReplyCount {...this.props} message={this.state.message} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ReceiverMessageBubble;