"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.previewWrapperStyle = exports.previewOptionsWrapperStyle = exports.previewOptionStyle = exports.previewHeadingStyle = exports.previewCloseStyle = void 0;

var previewWrapperStyle = function previewWrapperStyle() {
  // const slideAnimation = keyframes`
  // from {
  //     bottom: -55px
  // }
  // to {
  //     bottom: 0px
  // }`;
  return {
    padding: "8px 8px 16px 8px",
    marginBottom: "-8px",
    backgroundColor: "#fff",
    border: "1px solid #eaeaea",
    fontSize: "13px",
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    //animation: `${slideAnimation} 0.5s ease-out`,
    position: "relative"
  };
};

exports.previewWrapperStyle = previewWrapperStyle;

var previewHeadingStyle = function previewHeadingStyle() {
  return {
    alignSelf: "flex-start",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between"
  };
};

exports.previewHeadingStyle = previewHeadingStyle;

var previewCloseStyle = function previewCloseStyle(img) {
  return {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    mask: "url(".concat(img, ") center center no-repeat"),
    backgroundColor: "#39f",
    cursor: "pointer"
  };
};

exports.previewCloseStyle = previewCloseStyle;

var previewOptionsWrapperStyle = function previewOptionsWrapperStyle() {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%"
  };
};

exports.previewOptionsWrapperStyle = previewOptionsWrapperStyle;

var previewOptionStyle = function previewOptionStyle() {
  return {
    padding: "8px",
    margin: "0 8px",
    backgroundColor: "rgba(20,20,20,0.04)",
    border: "1px solid #eaeaea",
    borderRadius: "10px",
    cursor: "pointer",
    height: "100%",
    textAlign: "center"
  };
};

exports.previewOptionStyle = previewOptionStyle;