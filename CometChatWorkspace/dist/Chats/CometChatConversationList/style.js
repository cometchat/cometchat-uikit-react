"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageTextStyle = exports.messageContainerStyle = exports.chatsListStyle = void 0;

var chatsListStyle = function chatsListStyle(background) {
  return {
    height: "100%",
    width: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    margin: "0",
    padding: "0 0 16px 0",
    background: background
  };
};

exports.chatsListStyle = chatsListStyle;

var messageContainerStyle = function messageContainerStyle() {
  return {
    overflow: "hidden",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%"
  };
};

exports.messageContainerStyle = messageContainerStyle;

var messageTextStyle = function messageTextStyle() {
  return {
    margin: "0",
    minHeight: "36px",
    color: "rgba(20, 20, 20, 60%)",
    font: "400 20px Inter, sans-serif",
    lineHeight: "30px",
    wordWrap: "break-word",
    padding: "0 16px"
  };
};

exports.messageTextStyle = messageTextStyle;