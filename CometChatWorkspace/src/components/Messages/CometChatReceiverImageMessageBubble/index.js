import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../";
import { CometChatMessageReactions } from "../Extensions";
import { CometChatAvatar } from "../../Shared";

import { checkMessageForExtensionsData } from "../../../util/common";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageThumbnailStyle,
  messageDetailStyle,
  nameWrapperStyle,
  nameStyle,
  messageImgContainerStyle,
  messageImgWrapperStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

import srcIcon from "./resources/1px.png";

class CometChatReceiverImageMessageBubble extends React.PureComponent {

  messageFrom = "receiver";

  constructor(props) {

    super(props);

    this.imgRef = React.createRef();

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

    this.state = {
      message: message,
      imageUrl: srcIcon,
      isHovering: false
    }
  }

  componentDidMount() {
    this.setImage();
  }

  componentDidUpdate(prevProps) {

    const previousMessageStr = JSON.stringify(prevProps.message);
    const currentMessageStr = JSON.stringify(this.props.message);

    if (previousMessageStr !== currentMessageStr) {

      const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
      this.setState({ message: message })
    }
  }
  
  chooseImage = (thumbnailGenerationObject) => {

    const smallUrl = thumbnailGenerationObject["url_small"];
    const mediumUrl = thumbnailGenerationObject["url_medium"];

    const mq = window.matchMedia(this.props.theme.breakPoints[0]);

    let imageToDownload = mediumUrl;
    if (mq.matches) {
      imageToDownload = smallUrl;
    }

    return imageToDownload;
  }

  setImage = () => {

    const thumbnailGenerationData = checkMessageForExtensionsData(this.state.message, "thumbnail-generation");
    if (thumbnailGenerationData) {

      const mq = window.matchMedia(this.props.theme.breakPoints[0]);
      mq.addListener(() => {

        const imageToDownload = this.chooseImage(thumbnailGenerationData);
        let img = new Image();
        img.src = imageToDownload;
        img.onload = () => this.setState({ imageUrl: img.src });

      });

      const imageToDownload = this.chooseImage(thumbnailGenerationData);
      this.downloadImage(imageToDownload).then(response => {

        let img = new Image();
        img.src = imageToDownload;
        img.onload = () => {

          this.setState({ imageUrl: img.src });
        }

      }).catch(error => console.error(error));

    } else {
      this.setMessageImageUrl();
    }
  }

  setMessageImageUrl = () => {

    let img = new Image();
    img.src = this.state.message.data.url;
    img.onload = () => this.setState({ imageUrl: img.src });
  }

  downloadImage(imgUrl) {

    const promise = new Promise((resolve, reject) => {

      const xhr = new XMLHttpRequest();
      xhr.open("GET", imgUrl, true);
      xhr.responseType = "blob";

      xhr.onload = () => {

        if (xhr.readyState === 4) {

          if (xhr.status === 200) {

            this.timer = null;
            resolve(xhr.response);

          } else if (xhr.status === 403) {

            this.timer = setTimeout(() => {

              this.downloadImage(imgUrl).then(response => resolve(response)).catch(error => reject(error));

            }, 800);
          }

        } else {
          reject(xhr.statusText);
        }

      }

      xhr.onerror = event => reject(new Error('There was a network error.', event));
      xhr.ontimeout = event => reject(new Error('There was a timeout error.', event));
      xhr.send();

    });

    return promise;
  }

  open = () => {
    this.props.actionGenerated("viewActualImage", this.state.message);
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

    let avatar = null, name = null;
    if (this.props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

      avatar = (
        <div css={messageThumbnailStyle()} className="message__thumbnail">
          <CometChatAvatar user={this.state.message.sender} />
        </div>
      );

      name = (<div css={(nameWrapperStyle(avatar))} className="message__name__wrapper">
        <span css={nameStyle(this.props)} className="message__name">{this.state.message.sender.name}</span>
        </div>);
    }

    let messageReactions = null;
    const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
    if (reactionsData) {

      if (Object.keys(reactionsData).length) {
        messageReactions = (
          <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
            <CometChatMessageReactions  {...this.props} message={this.state.message} reaction={reactionsData} />
          </div>
        );
      }
    }

    let toolTipView = null;
    if (this.state.isHovering) {
      toolTipView = (<CometChatMessageActions {...this.props} message={this.state.message} name={name} />);
    }

    return (
      <div 
      css={messageContainerStyle()} 
      className="receiver__message__container message__image"
      onMouseEnter={this.handleMouseHover}
      onMouseLeave={this.handleMouseHover}>
        
        <div css={messageWrapperStyle()} className="message__wrapper">
          {avatar}
          <div css={messageDetailStyle(name)} className="message__details">
            {name}
            {toolTipView}
            <div css={messageImgContainerStyle()} className="message__image__container">
              <div css={messageImgWrapperStyle(this.props)} onClick={this.open} className="message__image__wrapper">
                <img src={this.state.imageUrl} alt={this.state.imageUrl} ref={el => { this.imgRef = el; }} />
              </div>
            </div>

            {messageReactions}

            <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
              <CometChatReadReceipt {...this.props} message={this.state.message} />
              <CometChatThreadedMessageReplyCount {...this.props} message={this.state.message} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Specifies the default values for props:
CometChatReceiverImageMessageBubble.defaultProps = {
  lang: Translator.getDefaultLanguage(),
  theme: theme
};

CometChatReceiverImageMessageBubble.propTypes = {
  lang: PropTypes.string,
  theme: PropTypes.object
}

export default CometChatReceiverImageMessageBubble;