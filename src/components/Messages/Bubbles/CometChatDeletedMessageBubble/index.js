import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, localize } from "../../..";
import { CometChatMessageReceiverType } from "../..";

import {
  messageContainerStyle,
  messageWrapperStyle,
  messageTxtWrapperStyle,
  messageTxtStyle,
} from "./style";
const CometChatDeletedMessageBubble = (props) => {
  let message = null;
  message = (
    <React.Fragment>
      <div
        style={messageTxtWrapperStyle(props)}
        className="message__text__wrapper"
      >
        <p style={messageTxtStyle(props)} className="message__text">
        {props.text ? props.text : message}
        </p>
      </div>
    </React.Fragment>
  );

  return (
    message !== null ? 
    <div style={messageContainerStyle(props)} className="message__deleted">
      <div style={messageWrapperStyle(props)} className="message__wrapper">
        {message}
      </div>
      </div> :
      null
  );
};

// Specifies the default values for props:
CometChatDeletedMessageBubble.defaultProps = {
  messageObject: {},
  text: "",
  style: {
    width: "",
    height: "",
    border: "",
    background: "",
    borderRadius: "",
    textFont: "",
    textColor: "",
  },
};

CometChatDeletedMessageBubble.propTypes = {
  messageObject: PropTypes.object,
  text: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatDeletedMessageBubble };
