import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import {
  messageKitWhiteBoardBlockStyle,
  messageWhiteBoardBlockStyle,
  messageWhiteBoardIconStyle,
  messageWhiteBoardTitleStyle,
  messageWhiteBoardBtnStyle,
  messageWhiteBoardBtnItemStyle,
  messageBtnItemTextStyle,
  messageWiteboardSubtitleStyle,
  messageSubtitleWrapperStyle,
  seperatorStyle,
} from "./style";
import { CometChatTheme, CometChatMessageEvents } from "../../../";

/**
 *
 * CometChatWhiteboardBubble is UI component for collaborative whiteboard message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatWhiteboardBubble = (props) => {
  const [whiteboardURL, setWhiteboardURL] = React.useState(null);

  const theme = new CometChatTheme(props.theme) || new CometChatTheme({});

  const launchCollaborativeWhiteboard = () => {
    try {
      if (whiteboardURL && whiteboardURL.length) {
        window.open(whiteboardURL, "", "fullscreen=yes, scrollbars=auto");
      }
    } catch (error) {
      CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, error);
    }
  };

  const getWhiteboardMessage = () => {
    return (
      <div
        style={messageKitWhiteBoardBlockStyle(props, theme)}
        className="message__kit__blocks"
      >
        <div
          style={messageWhiteBoardBlockStyle(props)}
          className="message__message-blocks"
        >
          <p
            style={messageWhiteBoardTitleStyle(props, theme)}
            className="message__message-title"
          >
            {props.title}
          </p>
          <i
            style={messageWhiteBoardIconStyle(props, theme)}
            className="message__message-icon"
          ></i>
        </div>
        <div
          className="message__message-subtitle"
          style={messageSubtitleWrapperStyle(props, theme)}
        >
          <p
            className="message__subtitle"
            style={messageWiteboardSubtitleStyle(props, theme)}
          >
            {props.subTitle}
          </p>
        </div>
        <div
          className="message__separator"
          style={seperatorStyle(props, theme)}
        >
          {""}
        </div>
        <ul
          style={messageWhiteBoardBtnStyle(props)}
          className="message__message-button"
        >
          <li
            style={messageWhiteBoardBtnItemStyle(props, theme)}
            onClick={launchCollaborativeWhiteboard}
          >
            <p style={messageBtnItemTextStyle(props)}>{props.buttonText}</p>
          </li>
        </ul>
      </div>
    );
  };

  Hooks(props, setWhiteboardURL);

  return getWhiteboardMessage();
};

CometChatWhiteboardBubble.defaultProps = {
  messageObject: null,
  title: "",
  subTitle: "",
  buttonText: "",
  iconURL: "",
  whiteboardURL: "",
  style: {
    width: "",
    height: "",
    iconTint: "",
    titleFont: "",
    titleColor: "",
    background: "",
    subTitleFont: "",
    subTitleColor: "",
    borderRadius: "",
    buttonTextColor: "",
    buttonTextFont: "",
    buttonBackground: "",
  },
};

CometChatWhiteboardBubble.propTypes = {
  messageObject: PropTypes.object,
  title: PropTypes.string,
  iconURL: PropTypes.string,
  subTitle: PropTypes.string,
  buttonText: PropTypes.string,
  whiteboardURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatWhiteboardBubble };
