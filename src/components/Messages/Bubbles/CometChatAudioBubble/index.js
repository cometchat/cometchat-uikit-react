import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import {
  messageAudioBubbleStyle,
  messageAudioBubbleBlockStyle,
  messageBlockAudioStyle,
} from "./style";

const CometChatAudioBubble = (props) => {
  const [audioURL, setAudioURL] = React.useState("");

  const audioMessage = () => {
    return (
      <div
        style={messageAudioBubbleStyle(props)}
        className="message_kit__blocks"
      >
        <div
          style={messageAudioBubbleBlockStyle(props)}
          className="message__message-blocks"
        >
          <audio
            controls
            className="message__message-audio"
            style={messageBlockAudioStyle(props)}
            src={audioURL}
          ></audio>
        </div>
      </div>
    );
  };

  Hooks(props, setAudioURL);

  return audioMessage();
};

CometChatAudioBubble.defaultProps = {
  messageObject: null,
  audioURL: null,
  style: {
    width: "228px",
    height: "auto",
    borderRadius: "12px",
    background: "linear-gradient(to right, red , yellow)",
    border: "0 none",
  },
};

CometChatAudioBubble.propTypes = {
  messageObject: PropTypes.object,
  audioURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatAudioBubble };
