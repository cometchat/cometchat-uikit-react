import React from "react";
import PropTypes from "prop-types";
import { Hooks } from "./hooks";

import {
  messageImageBubbleStyle,
  messageImageBubbleBlockStyle,
  /**unsafe style */
  messageUnsafeStyle,
  messageUnsafeIconStyle,
} from "./style";

import defaultImage from "./resources/1px.png";
import unsafeImage from "./resources/unsafe-content.svg";

/**
 *
 * CometChatImageBubble is UI component for image message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatImageBubble = (props) => {
  const [imageURL, setImageURL] = React.useState(defaultImage);
  const [unsafe, setUnsafe] = React.useState(false);

  const unsafeMessage = (
    <>
      <div className="message__unsafe" style={messageUnsafeStyle(props)}>
        <i
          className="messsage__unsafe__icon"
          style={messageUnsafeIconStyle(props.overlayImageURL)}
        ></i>
      </div>
    </>
  );

  const imageMessage = () => {
    return (
      <div
        style={messageImageBubbleStyle(props)}
        className="message_kit__blocks"
      >
        <img
          className="message__message-blocks"
          style={messageImageBubbleBlockStyle(props, unsafe)}
          src={imageURL}
          alt={imageURL}
        />
        {unsafe ? unsafeMessage : null}
      </div>
    );
  };

  Hooks(props, setImageURL, imageURL, setUnsafe);

  return imageMessage();
};

CometChatImageBubble.defaultProps = {
  messageObject: null,
  overlayImageURL: unsafeImage,
  imageURL: "",
  style: {
    width: "300px",
    height: "200px",
    borderRadius: "12px",
    background: "rgb(255,255,255)",
    border: "0 none",
  },
};

CometChatImageBubble.propTypes = {
  messageObject: PropTypes.object,
  overlayImageURL: PropTypes.string,
  imageURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatImageBubble };
