"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageEvents = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var CometChatMessageEvents = /*#__PURE__*/(0, _createClass2.default)(function CometChatMessageEvents() {
  (0, _classCallCheck2.default)(this, CometChatMessageEvents);
});
exports.CometChatMessageEvents = CometChatMessageEvents;
(0, _defineProperty2.default)(CometChatMessageEvents, "messageReceived", Symbol("messageReceived"));
(0, _defineProperty2.default)(CometChatMessageEvents, "customMessageReceived", Symbol("customMessageReceived"));
(0, _defineProperty2.default)(CometChatMessageEvents, "groupActionMessageReceived", Symbol("groupActionMessageReceived"));
(0, _defineProperty2.default)(CometChatMessageEvents, "callActionMessageReceived", Symbol("callActionMessageReceived"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messageRead", Symbol("messageRead"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messageDelivered", Symbol("messageDelivered"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messageEdited", Symbol("messageEdited"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messageDeleted", Symbol("messageDeleted"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messagesFetched", Symbol("messagesFetched"));
(0, _defineProperty2.default)(CometChatMessageEvents, "previousMessagesFetched", Symbol("previousMessagesFetched"));
(0, _defineProperty2.default)(CometChatMessageEvents, "refreshingMessages", Symbol("refreshingMessages"));
(0, _defineProperty2.default)(CometChatMessageEvents, "messagesRefreshed", Symbol("messagesRefreshed"));
(0, _defineProperty2.default)(CometChatMessageEvents, "storeMessage", Symbol("storeMessage"));
(0, _defineProperty2.default)(CometChatMessageEvents, "scrolledUp", Symbol("scrolledUp"));
(0, _defineProperty2.default)(CometChatMessageEvents, "scrolledToBottom", Symbol("scrolledToBottom"));
(0, _defineProperty2.default)(CometChatMessageEvents, "markMessageAsRead", Symbol("markMessageAsRead"));
(0, _defineProperty2.default)(CometChatMessageEvents, "onMessageSent", Symbol("onMessageSent"));
(0, _defineProperty2.default)(CometChatMessageEvents, "onLiveReaction", Symbol("onLiveReaction"));
(0, _defineProperty2.default)(CometChatMessageEvents, "onMessageError", Symbol("messageError"));
(0, _defineProperty2.default)(CometChatMessageEvents, "onMessageReaction", Symbol("onMessageReaction"));
(0, _defineProperty2.default)(CometChatMessageEvents, "onMessageReactionError", Symbol("onMessageReactionError"));
(0, _defineProperty2.default)(CometChatMessageEvents, "previewMessageForEdit", Symbol("previewMessageForEdit"));
(0, _defineProperty2.default)(CometChatMessageEvents, "_triggers", {});
(0, _defineProperty2.default)(CometChatMessageEvents, "emit", function () {
  var event, params;

  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (args.length === 2) {
    event = args[0];
    params = args[1];
  } else if (args.length === 1 && (0, _typeof2.default)(args[0]) === "object") {
    event = args[0].event;
    params = args[0].params;
  } else {
    throw new Error("Invalid arguments");
  }

  if (CometChatMessageEvents._triggers[event]) {
    for (var i in CometChatMessageEvents._triggers[event]) {
      CometChatMessageEvents._triggers[event][i](params);
    }
  }
});
(0, _defineProperty2.default)(CometChatMessageEvents, "removeListener", function () {
  var event, id;

  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  if (args.length === 2) {
    event = args[0];
    id = args[1];
  } else if (args.length === 1 && (0, _typeof2.default)(args[0]) === "object") {
    event = args[0].event;
    id = args[0].id;
  } else {
    throw new Error("Invalid arguments");
  }

  if (CometChatMessageEvents._triggers[event]) {
    delete CometChatMessageEvents._triggers[event][id];
  }
});
(0, _defineProperty2.default)(CometChatMessageEvents, "addListener", function () {
  var event, id, callback;

  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  if (args.length === 3) {
    event = args[0];
    id = args[1];
    callback = args[2];
  } else if (args.length === 1 && (0, _typeof2.default)(args[0]) === "object") {
    event = args[0].event;
    id = args[0].id;
    callback = args[0].callback;
  } else {
    throw new Error("Invalid arguments");
  }

  if (!CometChatMessageEvents._triggers[event]) {
    CometChatMessageEvents._triggers[event] = {};
  }

  CometChatMessageEvents._triggers[event][id] = callback;
});