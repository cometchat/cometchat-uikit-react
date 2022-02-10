"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatDocumentBubble = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../../");

var _2 = require("../../");

var _hooks = require("./hooks");

var _style = require("./style");

var _collaborativeDocument = _interopRequireDefault(require("./resources/collaborative-document.svg"));

/**
 * 
 * CometChatDocumentBubble is UI component for collaborative document message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatDocumentBubble = function CometChatDocumentBubble(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      name = _React$useState2[0],
      setName = _React$useState2[1];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      avatar = _React$useState4[0],
      setAvatar = _React$useState4[1];

  var _React$useState5 = _react.default.useState(""),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      documentURL = _React$useState6[0],
      setDocumentURL = _React$useState6[1];

  var _React$useState7 = _react.default.useState(false),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      isHovering = _React$useState8[0],
      setIsHovering = _React$useState8[1];

  var senderAvatar,
      senderName,
      leftView,
      rightView,
      usernameStyle,
      receiptStyle,
      messageTime,
      documentMessage = null;
  var timeFont = "500 11px Inter, sans-serif";
  var timeColor = "rgba(20, 20, 20, 40%)";
  var timeFormat = "MESSAGE_BUBBLE";
  var messageReplies = null; //<CometChatThreadedMessageReplyCount messageObject={props.messageObject} />;

  var messageReactions = /*#__PURE__*/_react.default.createElement(_2.CometChatMessageReactions, {
    messageObject: props.messageObject,
    loggedInUser: props.loggedInUser
  });

  var showMessageOptions = function showMessageOptions() {
    if (!isHovering) {
      setIsHovering(true);
    }
  };

  var hideMessageOptions = function hideMessageOptions() {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  var getAvatar = function getAvatar() {
    if (!avatar) {
      return null;
    }

    var getAvatarTemplate = function getAvatarTemplate() {
      if (props.avatar && props.avatar.length) {
        return /*#__PURE__*/_react.default.createElement(_.CometChatAvatar, {
          image: avatar
        });
      } else if (props.messageObject && props.messageObject.sender) {
        return /*#__PURE__*/_react.default.createElement(_.CometChatAvatar, {
          user: avatar
        });
      }
    };

    return /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageAvatarStyle)(),
      className: "message_kit__avatar"
    }, getAvatarTemplate());
  };

  var getSenderName = function getSenderName() {
    if (!name) {
      return null;
    }

    return /*#__PURE__*/_react.default.createElement("span", {
      style: (0, _style.messageSenderStyle)(props),
      className: "message_kit__sender"
    }, name);
  };

  var launchCollaborativeDocument = function launchCollaborativeDocument() {
    window.open(documentURL, "", "fullscreen=yes, scrollbars=auto");
  };

  var getDocumentMessage = function getDocumentMessage() {
    return /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageKitBlockStyle)(props),
      className: "message_kit__blocks"
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageBlockStyle)(props),
      className: "message__message-blocks"
    }, /*#__PURE__*/_react.default.createElement("i", {
      style: (0, _style.messageIconStyle)(props),
      className: "message__message-icon"
    }), /*#__PURE__*/_react.default.createElement("p", {
      style: (0, _style.messageTxtStyle)(props),
      className: "message__message-title"
    }, props.title)), /*#__PURE__*/_react.default.createElement("ul", {
      style: (0, _style.messageBtnStyle)(props),
      className: "message__message-button"
    }, /*#__PURE__*/_react.default.createElement("li", {
      onClick: launchCollaborativeDocument
    }, /*#__PURE__*/_react.default.createElement("p", null, props.buttonText))));
  };

  senderAvatar = getAvatar();
  senderName = getSenderName();
  documentMessage = getDocumentMessage();
  messageTime = props.messageObject._composedAt || props.messageObject.sentAt;

  if (props.messageAlignment === _2.messageAlignment.leftAligned) {
    if (props.messageTimeAlignment.toLowerCase() === _2.messageTimeAlignment.top) {
      var _props$loggedInUser;

      usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageTimestampStyle)(props),
        className: "message_kit__username_bar"
      }, senderName, "\xA0", /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
        time: messageTime,
        timeFont: timeFont,
        timeColor: timeColor,
        timeFormat: timeFormat
      }));
      receiptStyle = ((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid) === props.messageObject.getSender().getUid() ? /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageKitReceiptStyle)(props),
        className: "message_kit__receipt_bar"
      }, /*#__PURE__*/_react.default.createElement(_.CometChatMessageReceipt, {
        messageObject: props.messageObject,
        loggedInUser: props.loggedInUser
      })) : null;
    } else {
      var _props$loggedInUser2;

      usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageTimestampStyle)(props),
        className: "message_kit__username_bar"
      }, senderName);
      var messageReceipt = ((_props$loggedInUser2 = props.loggedInUser) === null || _props$loggedInUser2 === void 0 ? void 0 : _props$loggedInUser2.uid) === props.messageObject.getSender().getUid() ? /*#__PURE__*/_react.default.createElement(_.CometChatMessageReceipt, {
        messageObject: props.messageObject,
        loggedInUser: props.loggedInUser
      }) : null;
      receiptStyle = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageKitReceiptStyle)(props),
        className: "message_kit__receipt_bar"
      }, messageReceipt, /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
        time: messageTime,
        timeFont: timeFont,
        timeColor: timeColor,
        timeFormat: timeFormat
      }));
    }

    leftView = senderAvatar ? /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageLeftGutterStyle)(props),
      className: "message_kit__gutter__left"
    }, senderAvatar) : null;
    rightView = /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageRightGutterStyle)(),
      className: "message_kit__gutter__right"
    }, usernameStyle, documentMessage, messageReactions, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageReplyReceiptStyle)(props),
      className: "message_kit__reply__receipt_bar"
    }, messageReplies, receiptStyle));
  } else {
    var _props$loggedInUser3;

    //if the message sender is not same as logged in user i.e. message receiver
    if (((_props$loggedInUser3 = props.loggedInUser) === null || _props$loggedInUser3 === void 0 ? void 0 : _props$loggedInUser3.uid) !== props.messageObject.getSender().getUid()) {
      var _props$messageObject;

      leftView = ((_props$messageObject = props.messageObject) === null || _props$messageObject === void 0 ? void 0 : _props$messageObject.receiverType) === _2.CometChatMessageReceiverType.group && senderAvatar ? /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageLeftGutterStyle)(props),
        className: "message_kit__gutter__left"
      }, senderAvatar) : null;

      if (props.messageTimeAlignment.toLowerCase() === _2.messageTimeAlignment.top) {
        var _props$messageObject2;

        /**
         * Not showing the message sender name in 1-1 conversation
         */
        if (((_props$messageObject2 = props.messageObject) === null || _props$messageObject2 === void 0 ? void 0 : _props$messageObject2.receiverType) !== _2.CometChatMessageReceiverType.group) {
          senderName = null;
        }

        usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageTimestampStyle)(props),
          className: "message_kit__username_bar"
        }, senderName, "\xA0", /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
          time: messageTime,
          timeFont: timeFont,
          timeColor: timeColor,
          timeFormat: timeFormat
        }));
        receiptStyle = null;
      } else {
        usernameStyle = props.messageObject.receiverType === _2.CometChatMessageReceiverType.group ? /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageTimestampStyle)(props),
          className: "message_kit__username_bar"
        }, senderName) : null;
        receiptStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageKitReceiptStyle)(props),
          className: "message_kit__receipt_bar"
        }, /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
          time: messageTime,
          timeFont: timeFont,
          timeColor: timeColor,
          timeFormat: timeFormat
        }));
      }

      rightView = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageRightGutterStyle)(),
        className: "message_kit__gutter__right"
      }, usernameStyle, documentMessage, messageReactions, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageReplyReceiptStyle)(props),
        className: "message_kit__reply__receipt_bar"
      }, messageReplies, receiptStyle));
    } else {
      if (props.messageTimeAlignment.toLowerCase() === _2.messageTimeAlignment.top) {
        usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageTimestampStyle)(props),
          className: "message_kit__username_bar"
        }, /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
          time: messageTime,
          timeFont: timeFont,
          timeColor: timeColor,
          timeFormat: timeFormat
        }));
        receiptStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageKitReceiptStyle)(props),
          className: "message_kit__receipt_bar"
        }, /*#__PURE__*/_react.default.createElement(_.CometChatMessageReceipt, {
          messageObject: props.messageObject,
          loggedInUser: props.loggedInUser
        }));
      } else {
        usernameStyle = null;
        receiptStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageKitReceiptStyle)(props),
          className: "message_kit__receipt_bar"
        }, /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
          time: messageTime,
          timeFont: timeFont,
          timeColor: timeColor,
          timeFormat: timeFormat
        }), /*#__PURE__*/_react.default.createElement(_.CometChatMessageReceipt, {
          messageObject: props.messageObject,
          loggedInUser: props.loggedInUser
        }));
      }

      leftView = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageLeftGutterStyle)(props),
        className: "message_kit__gutter__left"
      }, usernameStyle, documentMessage, messageReactions, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageReplyReceiptStyle)(props),
        className: "message_kit__reply__receipt_bar"
      }, messageReplies, receiptStyle));
      rightView = null;
    }
  }

  (0, _hooks.Hooks)(props, setName, setAvatar, setDocumentURL);
  var messageOptions = isHovering ? /*#__PURE__*/_react.default.createElement(_2.CometChatMessageHover, {
    options: props.messageOptions,
    style: (0, _2.messageHoverStyling)(props)
  }) : null;
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageHoverStyle)(props),
    className: "message_kit__hover",
    onMouseEnter: showMessageOptions,
    onMouseLeave: hideMessageOptions
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageActionsStyle)(),
    className: "message_kit__actions"
  }, messageOptions, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageGutterStyle)(props),
    className: "c-message_kit__gutter"
  }, leftView, rightView)));
};

exports.CometChatDocumentBubble = CometChatDocumentBubble;
CometChatDocumentBubble.defaultProps = {
  width: "100%",
  height: "auto",
  cornerRadius: "12px",
  backgroundColor: "",
  border: "0 none",
  avatar: null,
  userName: null,
  usernameFont: "600 13px Inter",
  usernameColor: "#39f",
  messageAlignment: "standard",
  messageTimeAlignment: "bottom",
  title: "",
  titleFont: "400 14px Inter",
  titleColor: "#fff",
  buttonText: "Launch",
  buttonTextFont: "400 14px Inter",
  buttonTextColor: "#39f",
  buttonBackgroundColor: "#fff",
  documentURL: "",
  iconURL: _collaborativeDocument.default,
  iconTint: "#fff",
  messageObject: null,
  loggedInUser: null,
  messageOptions: _propTypes.default.array
};
CometChatDocumentBubble.propTypes = {
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  backgroundColor: _propTypes.default.string,
  border: _propTypes.default.string,
  avatar: _propTypes.default.string,
  userName: _propTypes.default.string,
  usernameFont: _propTypes.default.string,
  usernameColor: _propTypes.default.string,
  messageAlignment: _propTypes.default.oneOf(["standard", "leftAligned"]),
  messageTimeAlignment: _propTypes.default.oneOf(["top", "bottom"]),
  title: _propTypes.default.string,
  titleFont: _propTypes.default.string,
  titleColor: _propTypes.default.string,
  buttonText: _propTypes.default.string,
  buttonTextFont: _propTypes.default.string,
  buttonTextColor: _propTypes.default.string,
  buttonBackgroundColor: _propTypes.default.string,
  documentURL: _propTypes.default.string,
  iconURL: _propTypes.default.string,
  iconTint: _propTypes.default.string,
  messageObject: _propTypes.default.object,
  loggedInUser: _propTypes.default.object,
  messageOptions: _propTypes.default.array
};