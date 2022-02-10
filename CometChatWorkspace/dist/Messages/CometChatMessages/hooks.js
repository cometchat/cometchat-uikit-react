"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var Hooks = function Hooks(props, setLoggedInUser, attachListeners) {
  _react.default.useEffect(function () {
    //fetching logged in user
    _chat.CometChat.getLoggedinUser().then(function (user) {
      return setLoggedInUser(user);
    }); //attaching event listeners


    attachListeners();
  }, []);
};

exports.Hooks = Hooks;