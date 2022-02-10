"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessageReceiptConfiguration = void 0;

var _wait = _interopRequireDefault(require("../../SecondaryComponents/CometChatMessageReceipt/resources/wait.svg"));

var _messageSent = _interopRequireDefault(require("../../SecondaryComponents/CometChatMessageReceipt/resources/message-sent.svg"));

var _messageDelivered = _interopRequireDefault(require("../../SecondaryComponents/CometChatMessageReceipt/resources/message-delivered.svg"));

var _messageRead = _interopRequireDefault(require("../../SecondaryComponents/CometChatMessageReceipt/resources/message-read.svg"));

var _warningSmall = _interopRequireDefault(require("../../SecondaryComponents/CometChatMessageReceipt/resources/warning-small.svg"));

var MessageReceiptConfiguration = function MessageReceiptConfiguration() {
  this.messageWaitIcon = _wait.default;
  this.messageSentIcon = _messageSent.default;
  this.messageDeliveredIcon = _messageDelivered.default;
  this.messageReadIcon = _messageRead.default;
  this.messageErrorIcon = _warningSmall.default;
};

exports.MessageReceiptConfiguration = MessageReceiptConfiguration;