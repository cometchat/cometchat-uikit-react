import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';


import { checkMessageForExtensionsData } from "../../util/common";
import { SvgAvatar } from '../../util/svgavatar';

import Avatar from "../Avatar";
import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import RegularReactionView from "../RegularReactionView";

import { 
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageFileContainerStyle,
  messageFileWrapperStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

import blueFile from "./resources/receiverfile.png";

class ReceiverFileBubble extends React.Component {

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
      <div css={messageContainerStyle()} className="receiver__message__container message__file">
        
        <div css={messageWrapperStyle()} className="message__wrapper">
          {avatar}
          <div css={messageDetailStyle()} className="message__details">
            {name}
            <ToolTip {...this.props} message={this.state.message} name={name} />
            <div css={messageFileContainerStyle(this.props)} className="message__file__container">
              <div css={messageFileWrapperStyle(this.props)} className="message__file__wrapper">
                <a href={this.state.message.data.attachments[0].url} target="_blank" rel="noopener noreferrer">
                  <img src={blueFile} alt="file" />
                  <label>{this.state.message.data.attachments[0].name}</label>
                </a>
              </div>
            </div>

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

export default ReceiverFileBubble;