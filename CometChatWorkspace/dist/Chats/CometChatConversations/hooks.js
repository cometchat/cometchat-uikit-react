"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var Hooks = function Hooks(setUser) {
  _react.default.useEffect(function () {
    _chat.CometChat.getLoggedinUser().then(function (user) {
      return setUser(user);
    });
  }, []);
};

exports.Hooks = Hooks;