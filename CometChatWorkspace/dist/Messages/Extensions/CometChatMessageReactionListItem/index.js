"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageReactionListItem = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _emojiMart = require("emoji-mart");

var _chat = require("@cometchat-pro/chat");

var _ = require("../../../");

var _2 = require("../../");

var _style = require("./style");

var CometChatMessageReactionListItem = function CometChatMessageReactionListItem(props) {
  var _React$useState = _react.default.useState(0),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      reactionCount = _React$useState2[0],
      setReactionCount = _React$useState2[1];

  _react.default.useEffect(function () {
    if (props.text) {
      setReactionCount(props.text);
    } else {
      setReactionCount(Object.keys(props.reactionObject).length);
    }
  }, [props.text, props.reactionObject]);

  var reactToMessages = function reactToMessages(emoji, event) {
    _chat.CometChat.callExtension("reactions", "POST", "v1/react", {
      msgId: props.messageId,
      emoji: emoji.colons
    }).then(function (response) {
      /**
       * When reacting to a message fails
       */
      if (response.hasOwnProperty("success") === false || response.hasOwnProperty("success") && response["success"] === false) {
        _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageReactionError, response);
      }
    }).catch(function (error) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageReactionError, error);
    });

    event.stopPropagation();
  };

  var reactionName = "";
  var userList = [];

  for (var reaction in props.reactionObject) {
    reactionName = reaction.replaceAll(":", "");
    var reactionData = props.reactionObject[reaction];

    for (var user in reactionData) {
      userList.push(reactionData[user]["name"]);
    }
  }

  var reactionTitle = "";

  if (userList.length) {
    reactionTitle = userList.join(", "); //const str = `${localize("REACTED")}`;

    reactionTitle = reactionTitle.concat((0, _.localize)("REACTED"));
  }

  var reactionClassName = "reaction reaction__".concat(reactionName);
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageReactionsStyle)(props),
    className: reactionClassName,
    title: reactionTitle
  }, /*#__PURE__*/_react.default.createElement(_emojiMart.Emoji, {
    emoji: {
      id: reactionName
    },
    size: 18,
    native: true,
    onClick: reactToMessages
  }), /*#__PURE__*/_react.default.createElement("span", {
    style: (0, _style.reactionCountStyle)(props),
    className: "reaction__count"
  }, reactionCount));
}; // Specifies the default values for props:


exports.CometChatMessageReactionListItem = CometChatMessageReactionListItem;
CometChatMessageReactionListItem.defaultProps = {
  language: "en",
  border: "1px solid rgba(20, 20, 20, 8%)",
  background: "#F0F0F0",
  text: "",
  textColor: "#fff",
  textFont: "11px Inter",
  loggedInUser: null,
  messageId: null,
  reactionObject: null
};
CometChatMessageReactionListItem.propTypes = {
  language: _propTypes.default.string,
  border: _propTypes.default.string,
  text: _propTypes.default.string.isRequired,
  textColor: _propTypes.default.string,
  textFont: _propTypes.default.string,
  background: _propTypes.default.string,
  loggedInUser: _propTypes.default.object,
  messageId: _propTypes.default.string.isRequired,
  reactionObject: _propTypes.default.object.isRequired
};