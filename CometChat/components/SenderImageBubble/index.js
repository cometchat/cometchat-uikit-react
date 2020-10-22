import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core'

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageImgWrapper,
  messageInfoWrapperStyle
} from "./style";

import srcIcon from "./resources/1px.png";

class SenderImageBubble extends React.Component {

  timer = null;
  messageFrom = "sender";

  constructor(props) {

    super(props);

    this.imgRef = React.createRef();
    const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

    this.state = {
      message: message,
      imageUrl: srcIcon,
      fullScreenView: false
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

    if (this.state.message.hasOwnProperty("metadata")) {

      const metadata = this.state.message.metadata;
      const injectedObject = metadata["@injected"];
      if (injectedObject && injectedObject.hasOwnProperty("extensions")) {

        const extensionsObject = injectedObject["extensions"];
        if (extensionsObject && extensionsObject.hasOwnProperty("thumbnail-generation")) {

          const thumbnailGenerationObject = extensionsObject["thumbnail-generation"];

          const mq = window.matchMedia(this.props.theme.breakPoints[0]);
          mq.addListener(() => {

            const imageToDownload = this.chooseImage(thumbnailGenerationObject);
            let img = new Image();
            img.src = imageToDownload;
            img.onload = () => this.setState({ imageUrl: img.src });

          });

          const imageToDownload = this.chooseImage(thumbnailGenerationObject);
          this.downloadImage(imageToDownload).then(response => {

            const url = URL.createObjectURL(response)
            let img = new Image();
            img.src = url;
            img.onload = () => {

              this.setState({ imageUrl: img.src });
              URL.revokeObjectURL(img.src);
            }

          }).catch(error => console.error(error));
        }
      }

    } else {

      let img = new Image();
      img.src = this.state.message.data.url;
      img.onload = () => this.setState({ imageUrl: img.src });
    }
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

    return (
      <React.Fragment>
        <div css={messageContainerStyle()} className="sender__message__container message__image">
          <ToolTip {...this.props} message={this.state.message} />
          <div css={messageWrapperStyle()} className="message__wrapper">
            <div css={messageImgWrapper(this.props)} onClick={this.open} className="message__img__wrapper">
              <img src={this.state.imageUrl} alt="message" ref={el => { this.imgRef = el; }} />
            </div>
          </div>
          <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
            <ReplyCount {...this.props} message={this.state.message} />
            <ReadReciept {...this.props} />
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default SenderImageBubble;