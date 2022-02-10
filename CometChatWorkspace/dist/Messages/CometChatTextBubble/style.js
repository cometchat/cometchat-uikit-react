"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.messageTimestampStyle = exports.messageSenderStyle = exports.messageRightGutterStyle = exports.messageLeftGutterStyle = exports.messageKitReceiptStyle = exports.messageKitBlockStyle = exports.messageHoverStyle = exports.messageGutterStyle = exports.messageBlockStyle = exports.messageAvatarStyle = exports.messageActionsStyle = void 0;

// export const messageBackgroundStyle = (props) => {
//     return {
//         width: `${props.width}`,
//         height: `${props.height}`,
//         userSelect: "text",
//         "*": {
//             boxSizing: "inherit"
//         }
//     }
// }
var messageHoverStyle = function messageHoverStyle(props) {
  return {
    width: "".concat(props.width),
    height: "".concat(props.height)
  };
};

exports.messageHoverStyle = messageHoverStyle;

var messageActionsStyle = function messageActionsStyle() {
  return {
    position: "relative"
  };
};

exports.messageActionsStyle = messageActionsStyle;

var messageGutterStyle = function messageGutterStyle() {
  return {
    padding: "8px 20px",
    display: "flex",
    width: "100%"
  };
};

exports.messageGutterStyle = messageGutterStyle;

var messageLeftGutterStyle = function messageLeftGutterStyle(props) {
  // const marginProp = (props.messageAlignment === messageAlignment.standard 
  //     && props.loggedInUser?.uid === props.messageObject.getSender().getUid()) ? {
  //     marginRight: "0",
  // } : {
  //     marginRight: "8px",
  // };
  return {
    marginRight: "8px",
    display: "flex",
    flexDirection: "column"
  };
};

exports.messageLeftGutterStyle = messageLeftGutterStyle;

var messageRightGutterStyle = function messageRightGutterStyle() {
  return {
    flex: "1 1 0",
    minWidth: "0",
    padding: "8px",
    paddingLeft: "16px",
    margin: "-8px -8px -16px -16px"
  };
};

exports.messageRightGutterStyle = messageRightGutterStyle;

var messageKitBlockStyle = function messageKitBlockStyle(props) {
  return {
    borderRadius: props.cornerRadius,
    padding: "8px 16px",
    background: props.backgroundColor,
    border: props.border
  };
};

exports.messageKitBlockStyle = messageKitBlockStyle;

var messageBlockStyle = function messageBlockStyle(props) {
  return {
    color: "".concat(props.textColor),
    font: "".concat(props.textFont),
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    margin: "0",
    "a": {
      color: "inherit"
    }
  };
};

exports.messageBlockStyle = messageBlockStyle;

var messageAvatarStyle = function messageAvatarStyle() {
  return {
    flexShrink: "0",
    position: "relative"
  };
};

exports.messageAvatarStyle = messageAvatarStyle;

var messageSenderStyle = function messageSenderStyle(props) {
  return {
    color: props.usernameColor,
    font: props.usernameFont
  };
};

exports.messageSenderStyle = messageSenderStyle;

var messageKitReceiptStyle = function messageKitReceiptStyle(props) {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px"
  };
};

exports.messageKitReceiptStyle = messageKitReceiptStyle;

var messageTimestampStyle = function messageTimestampStyle(props) {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px"
  };
};

exports.messageTimestampStyle = messageTimestampStyle;