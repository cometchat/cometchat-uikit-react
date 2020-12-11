import React from "react";

/** @jsx jsx */
import { jsx } from "@emotion/core";

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
  messageImgContainerStyle,
  messageImgWrapperStyle,
  messageInfoWrapperStyle,
  messageReactionsWrapperStyle
} from "./style";

import srcIcon from "./resources/1px.png";

class ReceiverImageBubble extends React.PureComponent {

  messageFrom = "receiver";

  constructor(props) {

    super(props);

    this.imgRef = React.createRef();

    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });
    if (message.receiverType === 'group') {

      if (!message.sender.avatar) {

        const uid = message.sender.getUid();
        const char = message.sender.getName().charAt(0).toUpperCase();

        message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
      }
    }

    this.state = {
      message: message,
      imageUrl: srcIcon
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

  render() {

    let avatar = null, name = null;
    if (this.props.message.receiverType === 'group') {

      avatar = (
        <div css={messageThumbnailStyle()} className="message__thumbnail">
          <Avatar
            cornerRadius="50%"
            borderColor={this.props.theme.color.secondary}
            borderWidth="1px"
            image={this.state.message.sender.avatar}></Avatar>
        </div>
      );

      name = (<div css={(nameWrapperStyle(avatar))} className="message__name__wrapper"><span css={nameStyle(this.props)} className="message__name">{this.state.message.sender.name}</span></div>);
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
      <div css={messageContainerStyle()} className="receiver__message__container message__image">
        
        <div css={messageWrapperStyle()} className="message__wrapper">
          {avatar}
          <div css={messageDetailStyle(name)} className="message__details">
            {name}
            <ToolTip {...this.props} message={this.state.message} name={name} />
            <div css={messageImgContainerStyle()} className="message__image__container">
              <div css={messageImgWrapperStyle(this.props)} onClick={this.open} className="message__image__wrapper">
                <img src={this.state.imageUrl} alt="message" ref={el => { this.imgRef = el; }} />
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

export default ReceiverImageBubble;