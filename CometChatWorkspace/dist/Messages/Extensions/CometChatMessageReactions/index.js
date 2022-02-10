"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageReactions = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../../");

var _2 = require("../../");

var _3 = require("../");

var _style = require("./style");

var _reactions = _interopRequireDefault(require("./resources/reactions.svg"));

var CometChatMessageReactions = function CometChatMessageReactions(props) {
  var _React$useState = _react.default.useState([]),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      reactionList = _React$useState2[0],
      setReactionList = _React$useState2[1];

  var reactToMessage = _react.default.useCallback(function () {
    //CometChatEvent.triggerHandler(enums.EVENTS["REACT_TO_MESSAGE"], props.messageObject);
    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageReaction, props.messageObject);
  }, [props.messageObject]);

  var getAddReactionButton = _react.default.useCallback(function () {
    return /*#__PURE__*/_react.default.createElement("div", {
      key: "-1",
      style: (0, _style.messageAddReactionStyle)(props),
      className: "reaction reaction__add",
      title: (0, _.localize)("ADD_REACTION")
    }, /*#__PURE__*/_react.default.createElement("button", {
      type: "button",
      style: (0, _style.emojiButtonStyle)(_reactions.default, props),
      className: "button__reacttomessage",
      onClick: reactToMessage
    }, /*#__PURE__*/_react.default.createElement("i", null)));
  }, [props, reactToMessage]);

  _react.default.useEffect(function () {
    var reaction = (0, _2.getExtensionsData)(props.messageObject, _2.metadataKey.extensions.reactions);
    /**
     * If message reaction extension is enabled
     */

    if (reaction) {
      var messageReactions = Object.keys(reaction).map(function (data) {
        var _props$loggedInUser;

        var reactionData = reaction[data];
        var reactionObject = (0, _defineProperty2.default)({}, data, reactionData);
        var textColor = "#141414";
        var borderColor = "transparent";
        var backgroundColor = "#F0F0F0";

        if (reactionData.hasOwnProperty((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid)) {
          textColor = "#3399ff";
          borderColor = "#3399ff";
          backgroundColor = "#F0F0F0";
        }

        return /*#__PURE__*/_react.default.createElement(_3.CometChatMessageReactionListItem, {
          key: data,
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: borderColor,
          textColor: textColor,
          backgroundColor: backgroundColor,
          textFont: props.textFont,
          loggedInUser: props.loggedInUser,
          messageId: props.messageObject.id,
          reactionObject: reactionObject
        });
      });
      /**
       * Add reaction button
       */

      messageReactions.push(getAddReactionButton());
      setReactionList(messageReactions);
    }
  }, [props.messageObject, props.loggedInUser, getAddReactionButton, props.textFont]);

  if (!reactionList.length) {
    return null;
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "message_kit__reaction_bar",
    style: (0, _style.messageReactionListStyle)()
  }, reactionList);
}; // Specifies the default values for props:


exports.CometChatMessageReactions = CometChatMessageReactions;
CometChatMessageReactions.defaultProps = {
  language: "en",
  actionGenerated: function actionGenerated() {},
  border: "1px solid rgba(20, 20, 20, 8%)",
  background: "#F0F0F0",
  text: "",
  textColor: "#fff",
  textFont: "700 11px Inter",
  messageObject: null
};
CometChatMessageReactions.propTypes = {
  language: _propTypes.default.string,
  actionGenerated: _propTypes.default.func.isRequired,
  border: _propTypes.default.string,
  background: _propTypes.default.string,
  text: _propTypes.default.string,
  textColor: _propTypes.default.string,
  textFont: _propTypes.default.string,
  messageObject: _propTypes.default.object.isRequired
};