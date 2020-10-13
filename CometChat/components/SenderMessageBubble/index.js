import React from "react";
import twemoji from "twemoji";
import ReactHtmlParser from "react-html-parser";

/** @jsx jsx */
import { jsx } from '@emotion/core'

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
        <ToolTip {...this.props} message={this.state.message} />
        <div css={messageWrapperStyle()}>{messageText}</div>
        <div css={messageInfoWrapperStyle()}>
          <ReplyCount theme={this.props.theme} {...this.props} message={this.state.message} />
          <ReadReciept theme={this.props.theme} {...this.props} message={this.state.message} />
        </div>
      </div>
    );
  }
}

export default SenderMessageBubble;