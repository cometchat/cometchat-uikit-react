import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import {
  messageStickerBlockStyle,
  messageStickerBubbleBlockStyle,
} from "./style";

/**
 *
 * CometChatStickerBubble is UI component for sticker message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatStickerBubble = (props) => {
  const [stickerURL, setStickerURL] = React.useState("");

  let stickerMessage = () => {
    return (
      <div
        style={messageStickerBlockStyle(props)}
        className="message_kit__blocks"
      >
        <img
          className="message__message-blocks"
          style={messageStickerBubbleBlockStyle(props)}
          src={stickerURL}
          alt={stickerURL}
        />
      </div>
    );
  };

  Hooks(props, setStickerURL);

  return stickerURL ? stickerMessage() : null;
};

CometChatStickerBubble.defaultProps = {
  messageObject: {},
  stickerURL: "",
  stickerName: "",
  style: {
    width: "150px",
    height: "149px",
    border: "0 none",
    borderRadius: "12px",
    background: "none",
  },
};

CometChatStickerBubble.propTypes = {
  messageObject: PropTypes.object,
  stickerURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatStickerBubble };
