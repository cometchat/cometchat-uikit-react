"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.removeOptionIconStyle = exports.iconWrapperStyle = void 0;

var removeOptionIconStyle = function removeOptionIconStyle(img) {
  return {
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "red",
    cursor: "pointer",
    display: "block",
    height: "24px",
    width: "24px"
  };
};

exports.removeOptionIconStyle = removeOptionIconStyle;

var iconWrapperStyle = function iconWrapperStyle() {
  return {
    width: "50px"
  };
};

exports.iconWrapperStyle = iconWrapperStyle;