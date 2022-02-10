"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatTextBubble = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _twemoji = _interopRequireDefault(require("twemoji"));

var _htmlReactParser = _interopRequireDefault(require("html-react-parser"));

var _hooks = require("./hooks");

var _ = require("../../");

var _2 = require("../");

var _style = require("./style");

/**
 * 
 * CometChatTextBubble is UI component for text message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeams
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatTextBubble = function CometChatTextBubble(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      name = _React$useState2[0],
      setName = _React$useState2[1];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      avatar = _React$useState4[0],
      setAvatar = _React$useState4[1];

  var _React$useState5 = _react.default.useState(false),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      isHovering = _React$useState6[0],
      setIsHovering = _React$useState6[1];

  var senderAvatar,
      senderName,
      messageText,
      messageTime = null;
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

  var getLinkPreview = function getLinkPreview() {};

  var countEmojiOccurences = function countEmojiOccurences(string, word) {
    if (string.split(word).length - 1 >= 3) {
      return 3;
    } else {
      var content = string;
      content = string.replace(/<img[^>"']*((("[^"]*")|('[^']*'))[^"'>]*)*>/g, "");

      if (content.length > 0) {
        return 3;
      } else {
        return string.split(word).length - 1;
      }
    }
  };

  var getMessageText = function getMessageText() {
    var messageText;

    if (props.text && props.text.length) {
      messageText = props.text;
    } else {
      if (!props.messageObject) {
        messageText = null;
      }

      if (!props.messageObject.text) {
        messageText = null;
      }

      messageText = props.messageObject.text; //xss extensions data

      var xssData = (0, _2.getExtensionsData)(props.messageObject, "xss-filter");

      if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
        messageText = xssData.sanitized_text;
      } //datamasking extensions data


      var maskedData = (0, _2.getExtensionsData)(props.messageObject, "data-masking");

      if (maskedData && maskedData.hasOwnProperty("data") && maskedData.data.hasOwnProperty("sensitive_data") && maskedData.data.hasOwnProperty("message_masked") && maskedData.data.sensitive_data === "yes") {
        messageText = maskedData.data.message_masked;
      } //profanity extensions data


      var profaneData = (0, _2.getExtensionsData)(props.messageObject, "profanity-filter");

      if (profaneData && profaneData.hasOwnProperty("profanity") && profaneData.hasOwnProperty("message_clean") && profaneData.profanity === "yes") {
        messageText = profaneData.message_clean;
      }
    }

    var formattedText = (0, _2.linkify)(messageText);

    var emojiParsedMessage = _twemoji.default.parse(formattedText, {
      folder: "svg",
      ext: ".svg"
    });

    var count = countEmojiOccurences(emojiParsedMessage, 'class="emoji"');
    var parsedMessage = (0, _htmlReactParser.default)(emojiParsedMessage); //const parsedMessage = ReactHtmlParser(emojiParsedMessage, { decodeEntities: false });

    return /*#__PURE__*/_react.default.createElement("p", {
      className: "message__message-blocks",
      style: (0, _style.messageBlockStyle)(props, true, count)
    }, parsedMessage);
  };

  senderAvatar = getAvatar();
  senderName = getSenderName();
  messageText = getMessageText();
  messageTime = props.messageObject._composedAt || props.messageObject.sentAt;
  var leftView,
      rightView = null;
  var usernameStyle,
      receiptStyle = null;

  if (props.messageAlignment === _2.messageAlignment.leftAligned) {
    if (props.messageTimeAlignment.toLowerCase() === _2.messageTimeAlignment.top) {
      var _props$loggedInUser;

      usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageTimestampStyle)(props),
        className: "message_kit__username_bar"
      }, senderName, "\xA0", /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
        time: messageTime
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
        time: messageTime
      }));
    }

    leftView = senderAvatar ? /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageLeftGutterStyle)(props),
      className: "message_kit__gutter__left"
    }, senderAvatar) : null;
    rightView = /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageRightGutterStyle)(),
      className: "message_kit__gutter__right"
    }, usernameStyle, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageKitBlockStyle)(props),
      className: "message_kit__blocks"
    }, messageText), messageReactions, messageReplies, receiptStyle);
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
          time: messageTime
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
          time: messageTime
        }));
      }

      rightView = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageRightGutterStyle)(),
        className: "message_kit__gutter__right"
      }, usernameStyle, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageKitBlockStyle)(props),
        className: "message_kit__blocks"
      }, messageText), messageReactions, messageReplies, receiptStyle);
    } else {
      if (props.messageTimeAlignment.toLowerCase() === _2.messageTimeAlignment.top) {
        usernameStyle = /*#__PURE__*/_react.default.createElement("div", {
          style: (0, _style.messageTimestampStyle)(props),
          className: "message_kit__username_bar"
        }, /*#__PURE__*/_react.default.createElement(_.CometChatDate, {
          time: messageTime
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
          time: messageTime
        }), /*#__PURE__*/_react.default.createElement(_.CometChatMessageReceipt, {
          messageObject: props.messageObject,
          loggedInUser: props.loggedInUser
        }));
      }

      leftView = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageLeftGutterStyle)(props),
        className: "message_kit__gutter__left"
      }, usernameStyle, /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageKitBlockStyle)(props),
        className: "message_kit__blocks"
      }, messageText), messageReactions, messageReplies, receiptStyle);
      rightView = null;
    }
  }

  (0, _hooks.Hooks)(props, setName, setAvatar);
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
    style: (0, _style.messageGutterStyle)(),
    className: "c-message_kit__gutter"
  }, leftView, rightView)));
};

exports.CometChatTextBubble = CometChatTextBubble;
CometChatTextBubble.defaultProps = {
  width: "100%",
  height: "auto",
  cornerRadius: "12px",
  backgroundColor: "",
  border: "0 none",
  avatar: null,
  userName: null,
  usernameFont: "600 13px Inter,sans-serif",
  usernameColor: "#39f",
  messageAlignment: "standard",
  messageTimeAlignment: "top",
  text: "",
  textFont: "400 15px Inter,sans-serif",
  textColor: "#fff",
  messageObject: null,
  messageOptions: []
};
CometChatTextBubble.propTypes = {
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
  text: _propTypes.default.string,
  textFont: _propTypes.default.string,
  textColor: _propTypes.default.string,
  messageObject: _propTypes.default.object,
  messageOptions: _propTypes.default.array
};