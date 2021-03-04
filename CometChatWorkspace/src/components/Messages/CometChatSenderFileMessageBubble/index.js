import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../";
import { CometChatMessageReactions } from "../Extensions";

import { checkMessageForExtensionsData } from "../../../util/common";

import Translator from "../../../resources/localization/translator";
import { theme } from "../../../resources/theme";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageFileWrapper,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";


import blueFile from "./resources/senderfile.png";

class CometChatSenderFileMessageBubble extends React.Component {

  messageFrom = "sender";

  constructor(props) {

    super(props);

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

    this.state = {
      message: message,
      isHovering: false
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

  handleMouseHover = () => {
    this.setState(this.toggleHoverState);
  }

  toggleHoverState = (state) => {

    return {
      isHovering: !state.isHovering,
    };
  }

  render() {

    let messageReactions = null;
    const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
    if (reactionsData) {

      if (Object.keys(reactionsData).length) {
        messageReactions = (
          <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
            <CometChatMessageReactions {...this.props} message={this.state.message} reaction={reactionsData}  />
          </div>
        );
      }
    }

    let toolTipView = null;
    if (this.state.isHovering) {
      toolTipView = (<CometChatMessageActions {...this.props} message={this.state.message} />);
    }

    let fileMessage = null;
    if (this.state.message.data.hasOwnProperty("attachments") && this.state.message.data.attachments.length) {
      
      const fileName = this.state.message.data.attachments[0].name;
      const fileUrl = this.state.message.data.attachments[0].url;

      fileMessage = (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="message__file">
          <img src={blueFile} alt="file" />
          <p>{fileName}</p>
        </a>
      );

    } else {

      const fileName = this.state.message.data.name || "";

      fileMessage = (
        <div className="message__file">
          <img src={blueFile} alt="file" />
          <p>{fileName}</p>
        </div>
      );
    }

    return (
      <div 
      css={messageContainerStyle()} 
      className="sender__message__container message__file"
      onMouseEnter={this.handleMouseHover}
      onMouseLeave={this.handleMouseHover}>

        {toolTipView}
          
        <div css={messageWrapperStyle()} className="message__wrapper">
          <div css={messageFileWrapper(this.props)} className="message__file__wrapper">{fileMessage}</div>
        </div>

        {messageReactions}

        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
          <CometChatThreadedMessageReplyCount {...this.props} message={this.state.message} />
          <CometChatReadReceipt {...this.props} message={this.state.message} />
        </div>
      </div>
    )
  }
}

// Specifies the default values for props:
CometChatSenderFileMessageBubble.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatSenderFileMessageBubble.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatSenderFileMessageBubble;