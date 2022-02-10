"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "incomingCallAlert", {
  enumerable: true,
  get: function get() {
    return _incomingcall.default;
  }
});
Object.defineProperty(exports, "incomingMessageAlert", {
  enumerable: true,
  get: function get() {
    return _incomingmessage.default;
  }
});
Object.defineProperty(exports, "incomingOtherMessageAlert", {
  enumerable: true,
  get: function get() {
    return _incomingothermessage.default;
  }
});
Object.defineProperty(exports, "outgoingCallAlert", {
  enumerable: true,
  get: function get() {
    return _outgoingcall.default;
  }
});
Object.defineProperty(exports, "outgoingMessageAlert", {
  enumerable: true,
  get: function get() {
    return _outgoingmessage.default;
  }
});

var _incomingmessage = _interopRequireDefault(require("./incomingmessage.wav"));

var _incomingothermessage = _interopRequireDefault(require("./incomingothermessage.wav"));

var _outgoingmessage = _interopRequireDefault(require("./outgoingmessage.wav"));

var _incomingcall = _interopRequireDefault(require("./incomingcall.wav"));

var _outgoingcall = _interopRequireDefault(require("./outgoingcall.wav"));