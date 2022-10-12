import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";

import {} from "./style";

/**
 *
 * CometChatTextBubble is UI component for file message bubble.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatLocationBubble = (props) => {
  const fileMessage = () => {
    console.log("location bubble");
  };

  Hooks(props);

  return (
    <div>
      <h1>Location</h1>
    </div>
  );
};

CometChatLocationBubble.defaultProps = {
  messageObject: {},
  title: "",
  subTitle: "",
  mimeType: "",
  iconURL: "",
  style: {
    width: "",
    height: "",
    titleFont: "400 15px Inter, sans-serif",
    titleColor: "rgb(20,20,20)",
    subTitleFont: "400 12px Inter, sans-serif",
    subTitleColor: "rgb(20,20,20, 0.60)",
    iconTint: "#fff",
    background: "",
    borderRadius: "",
  },
};

CometChatLocationBubble.propTypes = {
  messageObject: PropTypes.object,
  iconURL: PropTypes.string,
  title: PropTypes.string,
  subTitle: PropTypes.string,
  mimeType: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatLocationBubble };
