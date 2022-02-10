"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stickyButtonStyle = exports.stickyAttachmentStyle = exports.stickyAttachButtonStyle = exports.stickerBtnStyle = exports.sendButtonStyle = exports.reactionBtnStyle = exports.messageInputStyle = exports.inputStickyStyle = exports.inputInnerStyle = exports.filePickerStyle = exports.fileListStyle = exports.fileItemStyle = exports.fileInputStyle = exports.emojiButtonStyle = exports.composerInputStyle = exports.chatComposerStyle = exports.attachmentIconStyle = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var chatComposerStyle = function chatComposerStyle(props) {
  return {
    padding: "16px",
    background: props.background,
    zIndex: "1",
    order: "3",
    position: "relative",
    flex: "none",
    minHeight: props.height,
    borderRadius: props.cornerRadius
  };
};

exports.chatComposerStyle = chatComposerStyle;

var composerInputStyle = function composerInputStyle(props) {
  return {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    position: "relative",
    zIndex: "2",
    padding: "0",
    borderRadius: props.inputCornerRadius,
    minHeight: props.height
  };
};

exports.composerInputStyle = composerInputStyle;

var inputInnerStyle = function inputInnerStyle(props) {
  //const borderRadiusVal = state.emojiViewer || state.stickerViewer ? { borderRadius: "0 0 8px 8px", } : { borderRadius: "8px", };
  return {
    flex: "1 1 auto",
    position: "relative",
    outline: "none",
    border: props.border,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "85px",
    //...borderRadiusVal,
    borderRadius: "inherit"
  };
};

exports.inputInnerStyle = inputInnerStyle;

var messageInputStyle = function messageInputStyle(props, disabled) {
  var disabledState = disabled ? {
    pointerEvents: "none",
    opacity: "0.4"
  } : {};
  return _objectSpread(_objectSpread({
    width: "100%",
    minHeight: "50px",
    maxHeight: props.height,
    font: props.placeholderFont,
    lineHeight: "20px",
    padding: "16px",
    outline: "none",
    overflowX: "hidden",
    overflowY: "auto",
    position: "relative",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    zIndex: "1",
    userSelect: "text",
    background: "#fff"
  }, disabledState), {}, {
    "&:empty:before": {
      content: "attr(placeholder)",
      color: props.placeholderColor,
      pointerEvents: "none",
      display: "block"
      /* For Firefox */

    }
  });
};

exports.messageInputStyle = messageInputStyle;

var inputStickyStyle = function inputStickyStyle(disabled, attachments, props) {
  var disabledState = disabled ? {
    pointerEvents: "none"
  } : {};
  var flexDirectionProp = attachments === null ? {
    flexDirection: "row-reverse"
  } : {};
  return _objectSpread(_objectSpread(_objectSpread({
    padding: "8px 16px",
    // height: "40px",
    //borderTop: `1px solid ${context.theme.borderColor.primary}`,
    backgroundColor: "rgba(20, 20, 20, 0.04)",
    display: "flex",
    justifyContent: "space-between"
  }, flexDirectionProp), disabledState), {}, {
    "&:empty:before": {
      pointerEvents: "none"
    }
  });
};

exports.inputStickyStyle = inputStickyStyle;

var stickyAttachmentStyle = function stickyAttachmentStyle() {
  return {
    display: "flex",
    width: "auto"
  };
};

exports.stickyAttachmentStyle = stickyAttachmentStyle;

var attachmentIconStyle = function attachmentIconStyle() {
  return {
    margin: "auto 0",
    width: "24px",
    height: "20px",
    cursor: "pointer"
  };
};

exports.attachmentIconStyle = attachmentIconStyle;

var filePickerStyle = function filePickerStyle(state) {
  var active = state.showFilePicker ? {
    width: "calc(100% - 20px)",
    opacity: "1"
  } : {};
  return _objectSpread({
    width: "0",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: "1",
    opacity: "0",
    transition: "width 0.5s linear"
  }, active);
};

exports.filePickerStyle = filePickerStyle;

var fileListStyle = function fileListStyle() {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0 0 16px"
  };
};

exports.fileListStyle = fileListStyle;

var fileItemStyle = function fileItemStyle(img, context) {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 16px 0 0",
    " > i": {
      width: "24px",
      height: "24px",
      display: "inline-block",
      mask: "url(".concat(img, ") center center no-repeat"),
      backgroundColor: "".concat(context.theme.secondaryIconColor)
    },
    " > input": {
      display: "none"
    }
  };
};

exports.fileItemStyle = fileItemStyle;

var stickyAttachButtonStyle = function stickyAttachButtonStyle(props) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    width: "24px",
    i: {
      width: "24px",
      height: "24px",
      display: "inline-block",
      mask: "url(".concat(props.attachmentIconURL, ") center center no-repeat"),
      backgroundColor: props.attachmentIconTint
    }
  };
};

exports.stickyAttachButtonStyle = stickyAttachButtonStyle;

var stickyButtonStyle = function stickyButtonStyle(state) {
  var active = state.showFilePicker ? {
    display: "none"
  } : {
    display: "flex"
  };
  return _objectSpread({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    width: "auto"
  }, active);
};

exports.stickyButtonStyle = stickyButtonStyle;

var emojiButtonStyle = function emojiButtonStyle(props) {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
    i: {
      width: "24px",
      height: "24px",
      display: "inline-block",
      mask: "url(".concat(props.emojiIconURL, ") center center no-repeat"),
      backgroundColor: props.emojiIconTint
    }
  };
};

exports.emojiButtonStyle = emojiButtonStyle;

var sendButtonStyle = function sendButtonStyle(props) {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
    i: {
      width: "24px",
      height: "24px",
      display: "inline-block",
      mask: "url(".concat(props.sendButtonIconURL, ") center center no-repeat"),
      backgroundColor: props.sendButtonIconTint
    }
  };
};

exports.sendButtonStyle = sendButtonStyle;

var reactionBtnStyle = function reactionBtnStyle() {
  return {
    cursor: "pointer",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px"
  };
};

exports.reactionBtnStyle = reactionBtnStyle;

var stickerBtnStyle = function stickerBtnStyle(props, stickerTemplate) {
  return {
    cursor: "pointer",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
    i: {
      width: "24px",
      height: "24px",
      display: "inline-block",
      mask: "url(".concat(stickerTemplate.icon, ") center center no-repeat"),
      backgroundColor: props.emojiIconTint
    }
  };
};

exports.stickerBtnStyle = stickerBtnStyle;

var fileInputStyle = function fileInputStyle(props) {
  return {
    visibility: "hidden"
  };
};

exports.fileInputStyle = fileInputStyle;