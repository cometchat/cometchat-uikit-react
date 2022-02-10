"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.actionsheetItemTitleStyle = exports.actionSheetItemWrapperStyle = exports.actionSheetItemIconStyle = void 0;

var actionSheetItemWrapperStyle = function actionSheetItemWrapperStyle(props) {
  return {
    display: "flex",
    flexDirection: props.iconAlignment,
    justifyContent: "flex-start",
    alignItems: "center",
    background: props.background,
    borderRadius: props.cornerRadius,
    border: props.border,
    padding: "8px 16px",
    width: props.width,
    height: props.height,
    overflowX: "hidden",
    overflowY: "auto",
    cursor: "pointer"
  };
};

exports.actionSheetItemWrapperStyle = actionSheetItemWrapperStyle;

var actionSheetItemIconStyle = function actionSheetItemIconStyle(props) {
  return {
    width: "24px",
    height: "24px",
    marginRight: "8px",
    mask: "url(".concat(props.iconURL, ") center center no-repeat"),
    backgroundColor: props.iconTint
  };
};

exports.actionSheetItemIconStyle = actionSheetItemIconStyle;

var actionsheetItemTitleStyle = function actionsheetItemTitleStyle(props) {
  return {
    font: props.titleFont,
    color: props.titleColor
  };
};

exports.actionsheetItemTitleStyle = actionsheetItemTitleStyle;