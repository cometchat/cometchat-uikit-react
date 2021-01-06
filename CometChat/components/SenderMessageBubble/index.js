import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { CometChat } from "@cometchat-pro/chat";

import { linkify, checkMessageForExtensionsData, validateWidgetSettings } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import LinkPreview from "../LinkPreview";
import RegularReactionView from "../RegularReactionView";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle,
} from "./style";

import Translator from "../../resources/localization/translator";
import { theme } from "../../resources/theme";

class SenderMessageBubble extends React.PureComponent {

  messageFrom = "sender";

  constructor(props) {

    super(props);

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

    this.state = {
      message: message,
      translatedMessage: ""
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
        <p css={messageTxtStyle(this.props, parsedMessage, emojiMessage, showVariation)} className="message__txt">{parsedMessage}{this.state.translatedMessage}</p>
      </div>
    );

    return messageText;
  }

  translateMessage = (message) => {

    const messageId = message.id;
    const messageText = message.text;
    const translateToLanguage = Translator.getDefaultLanguage();

    let translatedMessage = "";

    CometChat.callExtension('message-translation', 'POST', 'v2/translate', {
      "msgId": messageId,
      "text": messageText,
      "languages": [translateToLanguage]
    }).then(result => {

      if (result.hasOwnProperty("language_original") && result["language_original"] !== translateToLanguage) {

        if (result.hasOwnProperty("translations") && result.translations.length) {
          
          const messageTranslation = result.translations[0];
          if (messageTranslation.hasOwnProperty("message_translated")) {

            translatedMessage = `\n(${messageTranslation["message_translated"]})`;
          }
        }
      }

      this.setState({ translatedMessage: translatedMessage })

    }).catch(error => {
      // Some error occured

      console.log("translateMessage error", error);

    });
  }

  render() {

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
            <RegularReactionView  {...this.props} message={this.state.message} reaction={reactionsData} />
          </div>
        );
      }
    }

    return (
      <div css={messageContainerStyle()} className="sender__message__container message__text">
        
        <ToolTip {...this.props} message={this.state.message} translateMessage={this.translateMessage} />
        <div css={messageWrapperStyle()} className="message__wrapper">{messageText}</div>
        
        {messageReactions}

        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
          <ReplyCount {...this.props} message={this.state.message} />
          <ReadReciept {...this.props} message={this.state.message} />
        </div>
      </div>
    );
  }
}

// Specifies the default values for props:
SenderMessageBubble.defaultProps = {
  theme: theme
};

SenderMessageBubble.propTypes = {
  theme: PropTypes.object
}

export default SenderMessageBubble;