"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reactionCountStyle = exports.messageReactionsStyle = void 0;

var messageReactionsStyle = function messageReactionsStyle(props) {
  return {
    font: props.textFont,
    padding: "4px 6px",
    margin: "0 4px 4px 0",
    display: "inline-flex",
    alignItems: "center",
    verticalAlign: "top",
    backgroundColor: "".concat(props.background),
    borderRadius: "12px",
    cursor: "pointer",
    border: props.border,
    ".emoji-mart-emoji": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    },
    "&:hover": {
      border: props.border
    }
  };
};

exports.messageReactionsStyle = messageReactionsStyle;

var reactionCountStyle = function reactionCountStyle(props) {
  return {
    color: "".concat(props.textColor),
    padding: "0 1px 0 3px"
  };
};

exports.reactionCountStyle = reactionCountStyle;