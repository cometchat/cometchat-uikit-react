import React from "react";
/** @jsx jsx */
import { jsx } from '@emotion/core'

import { checkMessageForExtensionsData } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import RegularReactionView from "../RegularReactionView";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageAudioWrapperStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

class SenderAudioBubble extends React.Component {

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
            <RegularReactionView  {...this.props} message={this.state.message} reaction={reactionsData} />
          </div>
        );
      }
    }

    return (
      <div css={messageContainerStyle()} className="sender__message__container message__audio">

        <ToolTip {...this.props} message={this.state.message} />

        <div css={messageWrapperStyle()} className="message__wrapper">
          <div css={messageAudioWrapperStyle(this.props)} className="message__audio__wrapper">
            <audio controls>
              <source src={this.props.message.data.url} />
            </audio>
          </div>
        </div>

        {messageReactions}

        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
          <ReplyCount {...this.props} message={this.state.message} />
          <ReadReciept {...this.props} message={this.state.message} />
        </div>
      </div>
    )
  }
}

export default SenderAudioBubble;