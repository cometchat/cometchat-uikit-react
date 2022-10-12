import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import { CometChatTheme } from "../../../Shared";

import { CometChatMessageEvents } from "../../..";

import {
  messageKitDocumentBlockStyle,
  messageDocumentBlockStyle,
  messageDocumentIconStyle,
  messageDocumentTitleStyle,
  messageDocumentBtnStyle,
  messageDocumentBtnItemStyle,
  messageBtnItemTextStyle,
  messageDocumentSubtitleStyle,
  messageSubtitleWrapperStyle,
  seperatorStyle,
} from "./style";

import documentIcon from "./resources/collaborative.svg";

/**
 *
 * CometChatDocumentBubble is UI component for collaborative document message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatDocumentBubble = (props) => {
  const [documentURL, setDocumentURL] = React.useState("");
  const theme = new CometChatTheme(props.theme) || new CometChatTheme({});

  const launchCollaborativeDocument = () => {
    try {
      if (documentURL && documentURL.length) {
        window.open(documentURL, "", "fullscreen=yes, scrollbars=auto");
      }
    } catch (error) {
      CometChatMessageEvents.emit(CometChatMessageEvents.onMessageError, error);
    }
  };

  const getDocumentMessage = () => {
    return (
      <div
        style={messageKitDocumentBlockStyle(props, theme)}
        className="message__kit__blocks"
      >
        <div
          style={messageDocumentBlockStyle(props)}
          className="message__message-blocks"
        >
          <p
            style={messageDocumentTitleStyle(props, theme)}
            className="message__message-title"
          >
            {props.title}
          </p>
          <i
            style={messageDocumentIconStyle(props, theme)}
            className="message__message-icon"
          ></i>
        </div>
        <div
          className="message__message-subtitle"
          style={messageSubtitleWrapperStyle(props, theme)}
        >
          <p
            className="message__subtitle"
            style={messageDocumentSubtitleStyle(props, theme)}
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
          style={messageDocumentBtnStyle(props)}
          className="message__message-button"
        >
          <li
            style={messageDocumentBtnItemStyle(props, theme)}
            onClick={launchCollaborativeDocument}
          >
            <p style={messageBtnItemTextStyle(props)}>{props.buttonText}</p>
          </li>
        </ul>
      </div>
    );
  };

  Hooks(props, setDocumentURL);

  return getDocumentMessage();
};

CometChatDocumentBubble.defaultProps = {
  messageObject: null,
  title: "",
  subTitle: "",
  buttonText: "Launch",
  iconURL: documentIcon,
  style: {
    width: "100%",
    height: "auto",
    border: "0 none",
    titleFont: "400 14px Inter,sans-serif",
    titleColor: "#fff",
    borderRadius: "12px",
    background: "rgb(51,153,255)",
    subTitleFont: "",
    subTitleColor: "",
    buttonTextFont: "400 14px Inter,sans-serif",
    buttonTextColor: "#39f",
    buttonBackground: "#fff",
    iconTint: "#fff",
  },
};

CometChatDocumentBubble.propTypes = {
  messageObject: PropTypes.object,
  title: PropTypes.string,
  subTitle: PropTypes.string,
  iconURL: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatDocumentBubble };
