import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { linkify } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messagePreviewContainerStyle,
  messagePreviewWrapperStyle,
  previewImageStyle,
  previewDataStyle,
  previewTitleStyle,
  previewDescStyle,
  previewLinkStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  previewTextStyle,
  messageInfoWrapperStyle
} from "./style";

class SenderMessageBubble extends React.Component {

  messageFrom = "sender";

  constructor(props) {

    super(props);

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

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
    const formattedText = linkify(messageText);

    const emojiParsedMessage = twemoji.parse(formattedText, { folder: "svg", ext: ".svg" });
    const parsedMessage = ReactHtmlParser(emojiParsedMessage);
    
    const emojiMessage = parsedMessage.filter(message => (message instanceof Object && message.type === "img"));

    let showVariation = true;
    if (this.props.hasOwnProperty("widgetsettings")
      && this.props.widgetsettings
      && this.props.widgetsettings.hasOwnProperty("main")
      && this.props.widgetsettings.main.hasOwnProperty("show_emojis_in_larger_size")
      && this.props.widgetsettings.main["show_emojis_in_larger_size"] === false) {

      showVariation = false;
    }

    messageText = (
      <div css={messageTxtWrapperStyle(this.props)} className="message__txt__wrapper">
        <p css={messageTxtStyle(this.props, parsedMessage, emojiMessage, showVariation)} className="message__txt">{parsedMessage}</p>
      </div>
    );

    return messageText;
  }

  render() {

    let messageText = this.getMessageText();
    if (this.state.message.hasOwnProperty("metadata")) {

      const metadata = this.state.message.metadata;
      const injectedObject = metadata["@injected"];
      if (injectedObject && injectedObject.hasOwnProperty("extensions")) {

        const extensionsObject = injectedObject["extensions"];
        if (extensionsObject && extensionsObject.hasOwnProperty("link-preview")) {

          const linkPreviewObject = extensionsObject["link-preview"]
          if (linkPreviewObject && linkPreviewObject.hasOwnProperty("links") && linkPreviewObject["links"].length) {

            const linkObject = linkPreviewObject["links"][0];

            const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
            const linkText = (linkObject["url"].match(pattern)) ? "View on Youtube" : "Visit";

            const actualMessage = messageText;
            messageText = (
              <div css={messagePreviewContainerStyle(this.props)} className="message__preview">
                <div css={messagePreviewWrapperStyle()} className="preview__card">
                  <div css={previewImageStyle(linkObject["image"])} className="card__image"></div>
                  <div css={previewDataStyle(this.props)} className="card__info">
                    <div css={previewTitleStyle(this.props)} className="card__title"><span>{linkObject["title"]}</span></div>
                    <div css={previewDescStyle(this.props)} className="card__desc"><span>{linkObject["description"]}</span></div>
                    <div css={previewTextStyle(this.props)} className="card__text">{actualMessage}</div>
                  </div>
                  <div css={previewLinkStyle(this.props)} className="card__link">
                    <a href={linkObject["url"]} target="_blank" rel="noopener noreferrer">{linkText}</a>
                  </div>
                </div>
              </div>
            );
          } 
        } 
      }
    } 

    return (
      <div css={messageContainerStyle()} className="sender__message__container message__text">
        <ToolTip {...this.props} message={this.state.message} />
        <div css={messageWrapperStyle()} className="message__wrapper">{messageText}</div>
        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
          <ReplyCount theme={this.props.theme} {...this.props} message={this.state.message} />
          <ReadReciept theme={this.props.theme} {...this.props} message={this.state.message} />
        </div>
      </div>
    );
  }
}

export default SenderMessageBubble;