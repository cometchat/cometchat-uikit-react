import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import { messageVideoBubbleStyle, messageVideoBubbleBlockStyle } from "./style";

const CometChatVideoBubble = (props) => {
  const [videoURL, setVideoURL] = React.useState("");

  const videoMessage = () => (
    <div style={messageVideoBubbleStyle(props)} className="message_kit__blocks">
      <video
        className="message__message-blocks"
        style={messageVideoBubbleBlockStyle(props)}
        controls
        src={videoURL}
      ></video>
    </div>
  );

  Hooks(props, setVideoURL);

  return videoMessage();
};

CometChatVideoBubble.defaultProps = {
  messageObject: null,
  videoURL: null,
  style: {
    width: "250px",
    height: "200px",
    borderRadius: "12px",
    background: "rgb(225,255,255)",
    border: "0 none",
  },
};

CometChatVideoBubble.propTypes = {
  messageObject: PropTypes.object,
  videoURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatVideoBubble };
