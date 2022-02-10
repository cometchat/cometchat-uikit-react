"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hoverItemStyle = exports.hoverItemButtonStyle = void 0;

var hoverItemStyle = function hoverItemStyle(props) {
  return {
    display: "flex",
    position: "relative"
  };
};

exports.hoverItemStyle = hoverItemStyle;

var hoverItemButtonStyle = function hoverItemButtonStyle(props) {
  return {
    outline: "0",
    border: "0",
    height: "24px",
    width: "24px",
    borderRadius: "4px",
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    position: "relative",
    mask: "url(".concat(props.iconURL, ") center center no-repeat"),
    backgroundColor: "".concat(props.iconTint, "!important")
  };
};

exports.hoverItemButtonStyle = hoverItemButtonStyle;