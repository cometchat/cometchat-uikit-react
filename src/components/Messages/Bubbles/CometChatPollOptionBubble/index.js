import React from "react";
import PropTypes from "prop-types";

import {
  pollAnswerStyle,
  checkIconStyle,
  pollPercentStyle,
  answerWrapperStyle,
  pollOptionTitleStyle,
  pollOptionPercentTextStyle,
} from "./style";

import { CometChatTheme } from "../../../";

import checkImg from "./resources/checkmark.svg";

const CometChatPollOptionBubble = (props) => {
  const checkmarkIcon = props.optionIconURL || checkImg;
  const theme = new CometChatTheme(props.theme) || new CometChatTheme({});

  let width = "0%";
  let renderItems = null;
  let checkIcon = null;

  /*** check icon */
  checkIcon = (
    <span
      className="poll__option_checkmark"
      style={checkIconStyle(props, checkmarkIcon, theme)}
    ></span>
  );

  /** check vote count */
  if (!isNaN(parseInt(props.votePercent))) {
    width = props.votePercent;

    renderItems = (
      <div className="poll__option" style={answerWrapperStyle(props, theme)}>
        <p
          className="poll__option__title"
          style={pollOptionTitleStyle(props, theme)}
        >
          {props.optionText}
        </p>
        <span
          className="poll__option__percent"
          style={pollOptionPercentTextStyle(props, theme)}
        >
          {width}
        </span>
      </div>
    );
  } else {
    renderItems = (
      <div className="poll__option" style={answerWrapperStyle(props, width)}>
        {checkIcon}
        <p
          className="poll__option__title"
          style={pollOptionTitleStyle(props, theme)}
        >
          {props.optionText}
        </p>
      </div>
    );
  }

  return (
    <li
      className="poll__option__wrapper"
      style={pollAnswerStyle(props, theme)}
      onClick={props.onClick.bind(this, props.optionId)}
    >
      <div
        className="poll__option__percent"
        style={pollPercentStyle(props, width, theme)}
      >
        {" "}
      </div>
      {renderItems}
    </li>
  );
};

CometChatPollOptionBubble.defaultProps = {
  optionText: null,
  votePercent: null,
  optionId: "",
  optionIconURL: "",
  style: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "",
    borderRadius: "",
    pollOptionBackground: "#fff",
    pollOptionTextFont: "400 15px Inter,sans-serfi",
    pollOptionTextColor: "rgb(20,20,20)",
    optionIconTint: "RGBA(20, 20, 20, 0.46)",
    selectedPollOptionBackground: null,
    votePercentTextFont: "400 15px Inter,sans-serfi",
    votePercentTextColor: "rgb(20,20,20)",
  },
  loggedInUser: {},
  onClick: null,
};

CometChatPollOptionBubble.propTypes = {
  optionText: PropTypes.string,
  votePercent: PropTypes.string,
  optionId: PropTypes.string,
  style: PropTypes.object,
  loggedInUser: PropTypes.object,
  onClick: PropTypes.func,
};

export { CometChatPollOptionBubble };
