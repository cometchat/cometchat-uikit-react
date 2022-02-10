"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.receiptTypes = void 0;

var _lastMessageRead = _interopRequireDefault(require("./resources/last-message-read.svg"));

var _lastMessageDelivered = _interopRequireDefault(require("./resources/last-message-delivered.svg"));

var _lastMessageSent = _interopRequireDefault(require("./resources/last-message-sent.svg"));

var _lastMessageWait = _interopRequireDefault(require("./resources/last-message-wait.svg"));

var _lastMessageError = _interopRequireDefault(require("./resources/last-message-error.svg"));

var receiptTypes = {
  error: _lastMessageError.default,
  sending: _lastMessageWait.default,
  sent: _lastMessageSent.default,
  delivered: _lastMessageDelivered.default,
  read: _lastMessageRead.default
};
exports.receiptTypes = receiptTypes;