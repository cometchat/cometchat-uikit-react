"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.previewTextStyle = exports.previewHeadingStyle = exports.previewCloseStyle = exports.editPreviewContainerStyle = void 0;

var editPreviewContainerStyle = function editPreviewContainerStyle() {
  // const slideAnimation = keyframes`
  // from {
  //     bottom: -60px
  // }
  // to {
  //     bottom: 0px
  // }`;
  return {
    padding: "7px",
    backgroundColor: "white",
    borderWidth: "1px 1px 1px 5px",
    borderStyle: "solid",
    color: "rgba(20, 20, 20, 0.6)",
    fontSize: "13px",
    //animation: `${slideAnimation} 0.5s ease-out`,
    position: "relative"
  };
};

exports.editPreviewContainerStyle = editPreviewContainerStyle;

var previewHeadingStyle = function previewHeadingStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };
};

exports.previewHeadingStyle = previewHeadingStyle;

var previewTextStyle = function previewTextStyle() {
  return {
    padding: "5px 0"
  };
};

exports.previewTextStyle = previewTextStyle;

var previewCloseStyle = function previewCloseStyle(props) {
  return {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    cursor: "pointer",
    mask: "url(".concat(props.closeIconURL, ") center center no-repeat"),
    backgroundColor: props.closeIconTint
  };
};

exports.previewCloseStyle = previewCloseStyle;