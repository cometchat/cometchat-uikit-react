"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatDeletedMessageBubble = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _dateformat = _interopRequireDefault(require("dateformat"));

var _ = require("../../");

var _2 = require("../");

var _style = require("./style");

var CometChatDeletedMessageBubble = function CometChatDeletedMessageBubble(props) {
  var _props$messageObject, _props$messageObject$, _props$loggedInUser;

  var message = null;
  var messageDate = props.messageObject.sentAt * 1000;

  if (((_props$messageObject = props.messageObject) === null || _props$messageObject === void 0 ? void 0 : (_props$messageObject$ = _props$messageObject.sender) === null || _props$messageObject$ === void 0 ? void 0 : _props$messageObject$.uid) === ((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid)) {
    message = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageTxtWrapperStyle)(props),
      className: "message__txt__wrapper"
    }, /*#__PURE__*/_react.default.createElement("p", {
      style: (0, _style.messageTxtStyle)(),
      className: "message__txt"
    }, (0, _.localize)("YOU_DELETED_THIS_MESSAGE"))), /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageInfoWrapperStyle)(props),
      className: "message__info__wrapper"
    }, /*#__PURE__*/_react.default.createElement("span", {
      style: (0, _style.messageTimeStampStyle)(),
      className: "message__timestamp"
    }, (0, _dateformat.default)(messageDate, "shortTime"))));
  } else {
    var avatar = null,
        name = null;

    if (props.messageObject.receiverType === _2.CometChatMessageReceiverType.group) {
      avatar = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageThumbnailStyle)(),
        className: "message__thumbnail"
      }, /*#__PURE__*/_react.default.createElement(_.CometChatAvatar, {
        user: props.messagObject.sender
      }));
      name = /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.nameWrapperStyle)(props),
        className: "message__name__wrapper"
      }, /*#__PURE__*/_react.default.createElement("span", {
        style: (0, _style.nameStyle)(),
        className: "message__name"
      }, props.messagObject.sender.name));
    }

    message = /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, avatar, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageDetailStyle)(props),
      className: "message__details"
    }, name, /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageTxtWrapperStyle)(props),
      className: "message__txt__wrapper"
    }, /*#__PURE__*/_react.default.createElement("p", {
      style: (0, _style.messageTxtStyle)(),
      className: "message__txt"
    }, (0, _.localize)("THIS_MESSAGE_DELETED"))), /*#__PURE__*/_react.default.createElement("div", {
      style: (0, _style.messageInfoWrapperStyle)(props),
      className: "message__info__wrapper"
    }, /*#__PURE__*/_react.default.createElement("span", {
      style: (0, _style.messageTimeStampStyle)(),
      className: "message__timestamp"
    }, (0, _dateformat.default)(messageDate, "shortTime")))));
  }

  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageContainerStyle)(props),
    className: "message__deleted"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageWrapperStyle)(props),
    className: "message__wrapper"
  }, message));
}; // Specifies the default values for props:


exports.CometChatDeletedMessageBubble = CometChatDeletedMessageBubble;
CometChatDeletedMessageBubble.defaultProps = {
  loggedInUser: null,
  messagObject: null
};
CometChatDeletedMessageBubble.propTypes = {
  loggedInUser: _propTypes.default.object.isRequired,
  messagObject: _propTypes.default.object.isRequired
};