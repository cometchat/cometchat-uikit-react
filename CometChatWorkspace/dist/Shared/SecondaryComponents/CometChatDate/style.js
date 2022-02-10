"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timeStyle = void 0;

var timeStyle = function timeStyle(props) {
  return {
    font: props.timeFont,
    color: props.timeColor,
    backgroundColor: props.backgroundColor,
    cornerRadius: props.cornerRadius
  };
};

exports.timeStyle = timeStyle;