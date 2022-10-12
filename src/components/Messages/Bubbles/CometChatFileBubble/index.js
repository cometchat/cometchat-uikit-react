import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";
import downloadIcon from "./resources/download-icon.svg";

import { CometChatTheme, CometChatMessageEvents } from "../../../";

import {
  messageKitFileBubbleBlockStyle,
  messageFileBubbleBlockStyle,
  messageTitleStyle,
  messageSubTitleStyle,
  messageFileIconStyle,
} from "./style";

/**
 *
 * CometChatTextBubble is UI component for file message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatFileBubble = (props) => {
  const [fileURL, setFileURL] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [subTitle, setSubTitle] = React.useState("");

  const theme = new CometChatTheme(props.theme) || new CometChatTheme({});

  const fileDownload = () => {
    fetch(fileURL)
      .then((response) => response.blob())
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobURL;
        a.style = "display: none";
        if (title && title.length) a.download = title;
        document.body.appendChild(a);
        a.click();
      })
      .catch((error) =>
        CometChatMessageEvents.emit(
          CometChatMessageEvents.onMessageError,
          error
        )
      );
  };

  const fileMessage = () => {
    return (
      <div
        style={messageKitFileBubbleBlockStyle(props, theme)}
        className="message_kit__blocks"
      >
        <div
          style={messageFileBubbleBlockStyle(props)}
          className="message__message-blocks"
        >
          <div
            style={messageTitleStyle(props, theme)}
            className="message__message-title"
          >
            {title}
          </div>
          <div
            style={messageSubTitleStyle(props, theme)}
            className="message__message-subtitle"
          >
            {subTitle}
          </div>
        </div>
        <button
          style={messageFileIconStyle(props, downloadIcon, theme)}
          className="message__message-download-icon"
          onClick={fileDownload}
        ></button>
      </div>
    );
  };

  Hooks(props, setTitle, setSubTitle, setFileURL);

  return fileMessage();
};

CometChatFileBubble.defaultProps = {
  messageObject: null,
  title: "",
  subTitle: "",
  fileURL: "",
  iconURL: "",
  mimeType: "",
  style: {
    width: "",
    height: "",
    border: "",
    titleFont: "400 15px Inter, sans-serif",
    titleColor: "rgb(20,20,20)",
    subTitleFont: "400 12px Inter, sans-serif",
    subTitleColor: "rgb(20,20,20, 0.60)",
    iconTint: "#fff",
    background: "",
    borderRadius: "",
  },
};

CometChatFileBubble.propTypes = {
  messageObject: PropTypes.object,
  iconURL: PropTypes.string,
  fileURL: PropTypes.string,
  title: PropTypes.string,
  subTitle: PropTypes.string,
  mimeType: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatFileBubble };
