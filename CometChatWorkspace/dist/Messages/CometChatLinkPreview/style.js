"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.previewTitleStyle = exports.previewTextStyle = exports.previewLinkStyle = exports.previewImageStyle = exports.previewDescStyle = exports.previewDataStyle = exports.messagePreviewWrapperStyle = exports.messagePreviewContainerStyle = void 0;

var messagePreviewContainerStyle = function messagePreviewContainerStyle() {
  return {
    display: "inline-block",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: "0px 1px 2px 1px rgba(0,0,0,0.18)",
    alignSelf: "flex-start",
    width: "auto"
  };
};

exports.messagePreviewContainerStyle = messagePreviewContainerStyle;

var messagePreviewWrapperStyle = function messagePreviewWrapperStyle() {
  return {
    display: "flex",
    flexDirection: "column"
  };
};

exports.messagePreviewWrapperStyle = messagePreviewWrapperStyle;

var previewImageStyle = function previewImageStyle(img) {
  return {
    background: "url(".concat(img, ") no-repeat center center"),
    backgroundSize: "contain",
    height: "150px",
    margin: "12px 0"
  };
};

exports.previewImageStyle = previewImageStyle;

var previewDataStyle = function previewDataStyle() {
  return {
    borderTop: "1px solid #eaeaea",
    borderBottom: "1px solid #eaeaea",
    padding: "16px"
  };
};

exports.previewDataStyle = previewDataStyle;

var previewTitleStyle = function previewTitleStyle() {
  return {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    width: "auto",
    color: "rgba(20, 20, 20, 0.6)",
    fontWeight: "700",
    marginBottom: "8px"
  };
};

exports.previewTitleStyle = previewTitleStyle;

var previewDescStyle = function previewDescStyle() {
  return {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    width: "auto",
    color: "rgba(20, 20, 20, 0.6)",
    fontStyle: "italic",
    fontSize: "13px"
  };
};

exports.previewDescStyle = previewDescStyle;

var previewTextStyle = function previewTextStyle() {
  return {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    width: "auto",
    ".message__txt__wrapper": {
      backgroundColor: "transparent",
      color: "rgba(20, 20, 20, 0.6)",
      fontStyle: "normal",
      padding: "8px 0"
    }
  };
};

exports.previewTextStyle = previewTextStyle;

var previewLinkStyle = function previewLinkStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    "> a": {
      display: "inline-block",
      color: "#39f",
      fontWeight: "700"
    }
  };
};

exports.previewLinkStyle = previewLinkStyle;