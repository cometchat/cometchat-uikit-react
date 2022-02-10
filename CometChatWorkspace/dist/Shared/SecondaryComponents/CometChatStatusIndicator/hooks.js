"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var Hooks = function Hooks(setColor, props) {
  _react.default.useEffect(function () {
    // if (props.customBackgroundColor.trim().length) {
    // 	setColor(props.customBackgroundColor.trim());
    // } else 
    if (props.status.trim().length) {
      if (props.status === _chat.CometChat.USER_STATUS.ONLINE) {
        setColor(props.onlineBackgroundColor);
      } else if (props.status === _chat.CometChat.USER_STATUS.OFFLINE) {
        setColor(props.offlineBackgroundColor);
      } else {
        setColor(props.status.trim());
      }
    }
  }, [props, setColor]);
};

exports.Hooks = Hooks;