"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageHeader = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var _style = require("./style");

var CometChatMessageHeader = function CometChatMessageHeader(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      chatWith = _React$useState2[0],
      setChatWith = _React$useState2[1];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      chatWithType = _React$useState4[0],
      setChatWithType = _React$useState4[1];

  var showTooltip = function showTooltip(event) {
    var elem = event.target;
    var scrollWidth = elem.scrollWidth;
    var clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.setAttribute("title", elem.textContent);
  };

  var hideTooltip = function hideTooltip(event) {
    var elem = event.target;
    var scrollWidth = elem.scrollWidth;
    var clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.removeAttribute("title");
  };

  var avatar = null;
  var status = null;
  var presence = null;
  var typing = null;
  var chatWithClassName = "chat__user";
  var chatNameClassName = "user__name";
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatHeaderStyle)(),
    className: "chat__header"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatDetailStyle)(),
    className: "chat__details"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatThumbnailStyle)(),
    className: "chat__thumbnail"
  }, avatar, presence), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatUserStyle)(),
    className: chatWithClassName
  }, /*#__PURE__*/_react.default.createElement("h6", {
    style: (0, _style.chatNameStyle)(),
    className: chatNameClassName,
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip
  }, chatWith.name), typing ? typing : status)));
};

exports.CometChatMessageHeader = CometChatMessageHeader;