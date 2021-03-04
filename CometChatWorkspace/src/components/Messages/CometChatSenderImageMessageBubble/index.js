import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../";
import { CometChatMessageReactions } from "../Extensions";

import { checkMessageForExtensionsData } from "../../../util/common";

import { theme } from "../../../resources/theme";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageImgWrapper,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

import srcIcon from "./resources/1px.png";

class CometChatSenderImageMessageBubble extends React.PureComponent {

  timer = null;
  messageFrom = "sender";

  constructor(props) {

    super(props);

    this.imgRef = React.createRef();
    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

    this.state = {
      message: message,
      imageUrl: srcIcon,
      fullScreenView: false,
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
      this.setState({ message: message });
      this.setImage();
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
    if (this.state.message.data.hasOwnProperty("url")) {
      
      img.src = this.state.message.data.url;

    } else if(this.state.message.data.hasOwnProperty("file")) {

      const reader = new FileReader();
      reader.onload = function () {
        img.src = reader.result;
      }

      reader.readAsDataURL(this.state.message.data.file);
    }
     
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
            resolve(imgUrl);

          } else if (xhr.status === 403) {

            this.timer = setTimeout(() => {

              this.downloadImage(imgUrl).then(response => resolve(imgUrl)).catch(error => reject(error));

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

    let messageReactions = null;
    const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
    if (reactionsData) {

      if (Object.keys(reactionsData).length) {
        messageReactions = (
          <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
            <CometChatMessageReactions {...this.props} message={this.state.message} reaction={reactionsData} />
          </div>
        );
      }
    }

    let toolTipView = null;
    if (this.state.isHovering) {
      toolTipView = (<CometChatMessageActions {...this.props} message={this.state.message} />);
    }

    return (
      <div 
      css={messageContainerStyle()} 
      className="sender__message__container message__image"
      onMouseEnter={this.handleMouseHover}
      onMouseLeave={this.handleMouseHover}>

        {toolTipView}
          
        <div css={messageWrapperStyle()} className="message__wrapper">
          <div css={messageImgWrapper(this.props)} onClick={this.open} className="message__img__wrapper">
            <img src={this.state.imageUrl} alt={this.state.imageUrl} ref={el => { this.imgRef = el; }} />
          </div>
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
CometChatSenderImageMessageBubble.defaultProps = {
  theme: theme
};

CometChatSenderImageMessageBubble.propTypes = {
  theme: PropTypes.object
}

export default CometChatSenderImageMessageBubble;