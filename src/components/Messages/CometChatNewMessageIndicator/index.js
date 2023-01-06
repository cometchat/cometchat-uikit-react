import React from "react";
import PropTypes from "prop-types";
import { localize, CometChatTheme } from "../../Shared";

import {
  iconArrowDownStyle,
  messagePaneTopStyle,
  messagePaneBannerStyle,
  messagePaneUnreadBannerStyle,
  messagePaneUnreadBannerMessageStyle,
} from "./style";
import { Hooks } from "./hooks";

const CometChatNewMessageIndicator = (props) => {
  const { text, onClick, style, theme } = props;
  const _theme = theme || new CometChatTheme({});
  const [messageText, setMessageText] = React.useState();
  Hooks(text, setMessageText);

  return (
    <div style={messagePaneTopStyle()} className="message_pane__top">
      <div
        style={messagePaneBannerStyle(style)}
        className="message_pane__banner"
      >
        <div
          style={messagePaneUnreadBannerStyle()}
          className="message_pane__unread_banner__banner"
          title={localize("JUMP")}
        >
          <button
            type="button"
            style={messagePaneUnreadBannerMessageStyle(style, _theme)}
            className="message_pane__unread_banner__msg"
            onClick={onClick}
          >
            <span
              style={iconArrowDownStyle(style, _theme)}
              className="icon--arrow-down"
            >
              &#x2193;{" "}
            </span>
            {messageText}
          </button>
        </div>
      </div>
    </div>
  );
};

CometChatNewMessageIndicator.defaultProps = {
  text: "new messages",
  iconURL: "",
  style: {
    textFont: "",
    textColor: "#ffffff",
    border: "",
    borderRadius: "6px",
    background: "transparent",
  },
  onClick: () => {},
};

CometChatNewMessageIndicator.propTypes = {
  text: PropTypes.string,
  iconURL: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func,
};

export { CometChatNewMessageIndicator };
