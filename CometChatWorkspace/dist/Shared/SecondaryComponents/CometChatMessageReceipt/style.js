"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iconStyle = void 0;

var iconStyle = function iconStyle(img) {
  return {
    background: "url(".concat(img, ") center center no-repeat"),
    display: "inline-block",
    width: "24px",
    height: "24px"
  };
};

exports.iconStyle = iconStyle;