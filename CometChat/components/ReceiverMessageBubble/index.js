import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core'

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

    let messageText = null;

    const emojiParsedMessage = twemoji.parse(this.state.message.text, { folder: "svg", ext: ".svg" });
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
      <div css={messageTxtWrapperStyle(this.props)}>
        <p css={messageTxtStyle(parsedMessage, emojiMessage, showVariation)}>{parsedMessage}</p>
      </div>
    );

    return messageText;
  }

  render() {

    let avatar = null, name = null;
    if (this.state.message.receiverType === 'group') {

      avatar = (
        <div css={messageThumbnailStyle()}>
          <Avatar
          cornerRadius="50%"
          borderColor={this.props.theme.color.secondary}
          borderWidth="1px"
          image={this.state.message.sender.avatar} />
        </div>
      );

      name = (<div css={nameWrapperStyle(avatar)}><span css={nameStyle(this.props)}>{this.state.message.sender.name}</span></div>);
    }

    let messageText = null;
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
              <div css={messagePreviewContainerStyle(this.props)}>
                <div css={messagePreviewWrapperStyle()}>
                  <div css={previewImageStyle(linkObject["image"])}></div>
                  <div css={previewDataStyle(this.props)}>
                    <div css={previewTitleStyle(this.props)}><span>{linkObject["title"]}</span></div>
                    <div css={previewDescStyle(this.props)}><span>{linkObject["description"]}</span></div>
                  </div>
                  <div css={previewLinkStyle(this.props)}><a href={linkObject["url"]} target="_blank" rel="noopener noreferrer">{linkText}</a></div>
                </div>
              </div>
            );
          } else {
            messageText = this.getMessageText();
          }
        } else {
          messageText = this.getMessageText();
        }
      }

    } else {

      messageText = this.getMessageText();
    }

    return (
      <div css={messageContainerStyle()} className="message__container">
        <div css={messageWrapperStyle()}>
          {avatar}
          <div css={messageDetailStyle()}>
            {name}
            <div css={messageTxtContainerStyle()}>{messageText}</div>
            <div css={messageInfoWrapperStyle()}>
              <span css={messageTimestampStyle(this.props)}>{new Date(this.state.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
              <ReplyCount {...this.props} message={this.state.message} />
            </div>
          </div>
        </div>
        <ToolTip {...this.props} message={this.state.message} name={name} />
      </div>
    )
  }
}

export default ReceiverMessageBubble;