import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { checkMessageForExtensionsData } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import RegularReactionView from "../RegularReactionView";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageFileWrapper,
  messageInfoWrapperStyle,
  messageActionWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

import blueFile from "./resources/file-blue.svg";

class SenderFileBubble extends React.Component {

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

  render() {

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
      <div css={messageContainerStyle()} className="sender__message__container message__file">

        <div css={messageActionWrapperStyle()} className="message__action__wrapper">
          <ToolTip {...this.props} message={this.state.message} />
          <div css={messageWrapperStyle()} className="message__wrapper">
            <div css={messageFileWrapper(this.props)} className="message__file__wrapper">
              <a href={this.props.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">{this.props.message.data.attachments[0].name} <img src={blueFile} alt="file" /></a>
            </div>
          </div>
        </div>

        {messageReactions}

        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
          <ReplyCount {...this.props} message={this.state.message} />
          <ReadReciept {...this.props} />
        </div>
      </div>
    )
  }
}

export default SenderFileBubble;