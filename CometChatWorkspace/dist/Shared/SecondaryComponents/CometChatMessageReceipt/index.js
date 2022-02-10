"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageReceipt = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _hooks = require("./hooks");

var _style = require("./style");

var _wait = _interopRequireDefault(require("./resources/wait.svg"));

var _messageSent = _interopRequireDefault(require("./resources/message-sent.svg"));

var _messageDelivered = _interopRequireDefault(require("./resources/message-delivered.svg"));

var _messageRead = _interopRequireDefault(require("./resources/message-read.svg"));

var _warningSmall = _interopRequireDefault(require("./resources/warning-small.svg"));

var CometChatMessageReceipt = function CometChatMessageReceipt(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      icon = _React$useState2[0],
      setIcon = _React$useState2[1];

  (0, _hooks.Hooks)(props, setIcon);

  if (!icon) {
    return null;
  }

  return /*#__PURE__*/_react.default.createElement("i", {
    className: "message__receipt",
    style: (0, _style.iconStyle)(icon)
  });
};

exports.CometChatMessageReceipt = CometChatMessageReceipt;
CometChatMessageReceipt.propTypes = {
  messageWaitIcon: _propTypes.default.string,
  messageSentIcon: _propTypes.default.string,
  messageDeliveredIcon: _propTypes.default.string,
  messageReadIcon: _propTypes.default.string,
  messageErrorIcon: _propTypes.default.string,
  messageObject: _propTypes.default.object
};
CometChatMessageReceipt.defaultProps = {
  messageWaitIcon: _wait.default,
  messageSentIcon: _messageSent.default,
  messageDeliveredIcon: _messageDelivered.default,
  messageReadIcon: _messageRead.default,
  messageErrorIcon: _warningSmall.default,
  messageObject: null
};