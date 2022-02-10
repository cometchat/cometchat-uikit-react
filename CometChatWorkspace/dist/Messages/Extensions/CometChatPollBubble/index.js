"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatPollBubble = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../../");

var _2 = require("../../");

var _3 = require("../");

var _hooks = require("./hooks");

var _style = require("./style");

/**
 * 
 * CometChatPollBubble is UI component for poll message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatPollBubble = function CometChatPollBubble(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      name = _React$useState2[0],
      setName = _React$useState2[1];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      avatar = _React$useState4[0],
      setAvatar = _React$useState4[1];

  var _React$useState5 = _react.default.useState(null),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      question = _React$useState6[0],
      setQuestion = _React$useState6[1];

  var _React$useState7 = _react.default.useState({}),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      options = _React$useState8[0],
      setOptions = _React$useState8[1];

  var _React$useState9 = _react.default.useState(0),
      _React$useState10 = (0, _slicedToArray2.default)(_React$useState9, 2),
      voteCount = _React$useState10[0],
      setVoteCount = _React$useState10[1];

  var _React$useState11 = _react.default.useState(false),
      _React$useState12 = (0, _slicedToArray2.default)(_React$useState11, 2),
      isHovering = _React$useState12[0],
      setIsHovering = _React$useState12[1];

  var senderAvatar,
      senderName,
      leftView,
      rightView,
      usernameStyle,
      receiptStyle,
      messageTime,
      pollsMessage = null;
  var timeFont = "500 11px Inter, sans-serif";
  var timeColor = "rgba(20, 20, 20, 40%)";
  var timeFormat = "MESSAGE_BUBBLE";
  var messageReplies = null; //<CometChatThreadedMessageReplyCount messageObject={props.messageObject} textFont="500 11px Inter, sans-serif" textColor="#39f" />;

  var messageReactions = /*#__PURE__*/_react.default.createElement(_3.CometChatMessageReactions, {
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

  var getPollOptions = function getPollOptions() {
    var optionsTemplate = [];
    Object.entries(options).forEach(function (_ref) {
      var _ref2 = (0, _slicedToArray2.default)(_ref, 2),
          optionKey = _ref2[0],
          option = _ref2[1];

      optionsTemplate.push( /*#__PURE__*/_react.default.createElement(_3.CometChatPollOptionBubble, {
        key: option.text,
        pollOption: option,
        voteCount: voteCount,
        pollOptionsFont: props.pollOptionsFont,
        pollOptionsColor: props.pollOptionsColor,
        pollOptionsBackgroundColor: props.pollOptionsBackgroundColor,
        loggedInUser: props.loggedInUser
      }));
    });
    return optionsTemplate;
  };

  var getPollsMessage = function getPollsMessage() {
    var voteCountText = (0, _.localize)("NO_VOTE");

    if (voteCount === 1) {
      voteCountText = "".concat(voteCount, " ").concat((0, _.localize)("VOTE"));
    } else if (voteCount > 1) {
      voteCountText = "".concat(voteCount, " ").concat((0, _.localize)("VOTES"));
    }

    return /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageKitBlockStyle)(props),
      className: "message_kit__blocks"
    }, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageBlockStyle)(props),
      className: "message__message-blocks"
    }, /*#__PURE__*/_react.default.createElement("p", {
      style: (0, _style.pollQuestionStyle)(props),
      className: "message__message-pollquestion"
    }, question)), /*#__PURE__*/_react.default.createElement("ul", {
      style: (0, _style.pollAnswerStyle)(),
      className: "message__message-polloptions"
    }, getPollOptions()), /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.voteCountStyle)(props),
      className: "message__message-votecount"
    }, /*#__PURE__*/_react.default.createElement("p", null, voteCountText)));
  };

  senderAvatar = getAvatar();
  senderName = getSenderName();
  pollsMessage = getPollsMessage();
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
    }, usernameStyle, pollsMessage, messageReactions, /*#__PURE__*/_react.default.createElement("div", {
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
      }, usernameStyle, pollsMessage, messageReactions, receiptStyle, messageReplies);
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
      }, usernameStyle, pollsMessage, messageReactions, messageReplies, receiptStyle);
      rightView = null;
    }
  }

  (0, _hooks.Hooks)(props, setName, setAvatar, setQuestion, setOptions, setVoteCount);
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

exports.CometChatPollBubble = CometChatPollBubble;
CometChatPollBubble.defaultProps = {
  width: "100%",
  height: "auto",
  border: "0 none",
  cornerRadius: "12px",
  backgroundColor: "",
  avatar: null,
  userName: null,
  usernameFont: "600 13px Inter",
  usernameColor: "#39f",
  messageAlignment: "standard",
  messageTimeAlignment: "bottom",
  messageObject: null,
  pollQuestion: "",
  pollQuestionFont: "400 15px Inter,sans-serif",
  pollQuestionColor: "#fff",
  pollOptions: {},
  pollOptionsFont: "400 15px Inter,sans-serif",
  pollOptionsColor: "#39f",
  pollOptionsBackgroundColor: "#fff",
  voteCount: 0,
  voteCountFont: "400 13px Inter,sans-serif",
  voteCountColor: "#fff",
  loggedInUser: null,
  messageOptions: []
};
CometChatPollBubble.propTypes = {
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  border: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  backgroundColor: _propTypes.default.string,
  pollQuestion: _propTypes.default.string,
  pollQuestionFont: _propTypes.default.string,
  pollQuestionColor: _propTypes.default.string,
  pollOptions: _propTypes.default.object,
  pollOptionsFont: _propTypes.default.string,
  pollOptionsColor: _propTypes.default.string,
  pollOptionsBackgroundColor: _propTypes.default.string,
  voteCount: _propTypes.default.number,
  voteCountFont: _propTypes.default.string,
  voteCountColor: _propTypes.default.string,
  avatar: _propTypes.default.string,
  userName: _propTypes.default.string,
  usernameFont: _propTypes.default.string,
  usernameColor: _propTypes.default.string,
  messageAlignment: _propTypes.default.oneOf(["standard", "leftAligned"]),
  messageTimeAlignment: _propTypes.default.oneOf(["top", "bottom"]),
  messageObject: _propTypes.default.object,
  loggedInUser: _propTypes.default.object,
  language: _propTypes.default.string,
  messageOptions: _propTypes.default.array
};