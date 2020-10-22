import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { linkify } from "../../util/common";
import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageTxtContainerStyle,
  messagePreviewContainerStyle,
  messagePreviewWrapperStyle,
  previewImageStyle,
  previewDataStyle,
  previewTitleStyle,
  previewDescStyle,
  previewTextStyle,
  previewLinkStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
  messageInfoWrapperStyle,
  messageTimestampStyle
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
    const formattedText = linkify(this.state.message.text);

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
            messageText = (
              <div css={messagePreviewContainerStyle(this.props)} className="message__preview">
                <div css={messagePreviewWrapperStyle()} className="preview__card">
                  <div css={previewImageStyle(linkObject["image"])} className="card__image"></div>
                  <div css={previewDataStyle(this.props)} className="card__info">
                    <div css={previewTitleStyle(this.props)} className="card__title"><span>{linkObject["title"]}</span></div>
                    <div css={previewDescStyle(this.props)} className="card__desc"><span>{linkObject["description"]}</span></div>
                    <div css={previewTextStyle(this.props)} className="card__text">{this.getMessageText()}</div>
                  </div>
                  <div css={previewLinkStyle(this.props)} className="card__link"><a href={linkObject["url"]} target="_blank" rel="noopener noreferrer">{linkText}</a></div>
                </div>
              </div>
            );
          }
        }
      }
    }

    return (
      <div css={messageContainerStyle()} className="receiver__message__container message__text">
        <ToolTip {...this.props} message={this.state.message} name={name} />
        <div css={messageWrapperStyle()} className="message__wrapper">
          {avatar}
          <div css={messageDetailStyle()} className="message__details">
            {name}
            <div css={messageTxtContainerStyle()} className="message__text__container">{messageText}</div>
            <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
              <span css={messageTimestampStyle(this.props)} className="message__timestamp">{new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
              <ReplyCount {...this.props} message={this.state.message} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ReceiverMessageBubble;