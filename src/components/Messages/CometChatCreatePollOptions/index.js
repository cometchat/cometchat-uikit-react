import React from "react";
import PropTypes from "prop-types";

import {
  removeOptionIconStyle,
  pollOptionAnswerStyle,
  pollOptionInputStyle,
} from "./style";

import removeIcon from "./resources/delete.svg";

const CometChatCreatePollOptions = (props) => {
  const onChange = (event) => {
    props.onChangeHandler(event, props.option);
  };

  return (
    <div
      className="polloption__answer__wrapper"
      style={pollOptionAnswerStyle()}
    >
      <input
        autoFocus
        type="text"
        tabIndex="1"
        autoComplete="off"
        style={pollOptionInputStyle(props)}
        value={props.option.value}
        placeholder={props.placeholderText}
        onChange={onChange.bind(this)}
      />
      <span
        style={removeOptionIconStyle(props, removeIcon)}
        onClick={() => props.onDeleteClick(props.option)}
      ></span>
    </div>
  );
};

CometChatCreatePollOptions.defaultProps = {
  hasDelete: false,
  placeholderText: "",
  deleteIconUrl: "",
  onDeleteClick: null,
  onChangeHandler: null,
  option: null,
  style: {
    width: "100%",
    height: "46px",
    deleteIconTint: "RGBA(20, 20, 20, 0.6)",
    border: "1px solid RGBA(20, 20, 20, 0.04)",
    borderRadius: "8px",
    boxShadow:
      "RGBA(20, 20, 20, 0.04) 0 16px 32px, RGBA(20, 20, 20, 0.04) 0 0 0 1px",
    background: "RGBA(20, 20, 20, 0.04)",
    placeholderTextFont: "400 15px Inter,sans-serif",
    placeholderTextColor: "RGBA(20, 20, 20, 0.6)",
    inputTextFont: "400 15px Inter,sans-serif",
    inputTextColor: "RGB(20, 20, 20)",
    inputStyle: null,
  },
};

CometChatCreatePollOptions.propTypes = {
  option: PropTypes.object,
  hasDelete: PropTypes.bool,
  placeholderText: PropTypes.string,
  deleteIconUrl: PropTypes.string,
  style: PropTypes.object,
  onDeleteClick: PropTypes.func,
  onChangeHandler: PropTypes.func,
};

export { CometChatCreatePollOptions };
