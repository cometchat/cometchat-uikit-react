"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConversationEvents = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var CometChatConversationEvents = /*#__PURE__*/(0, _createClass2.default)(function CometChatConversationEvents() {
  (0, _classCallCheck2.default)(this, CometChatConversationEvents);
});
exports.CometChatConversationEvents = CometChatConversationEvents;
(0, _defineProperty2.default)(CometChatConversationEvents, "onItemClick", Symbol("onItemClick"));
(0, _defineProperty2.default)(CometChatConversationEvents, "onStartConversation", Symbol("onStartConversation"));
(0, _defineProperty2.default)(CometChatConversationEvents, "onSearch", Symbol("onSearch"));
(0, _defineProperty2.default)(CometChatConversationEvents, "onDeleteConversation", Symbol("onDeleteConversation"));
(0, _defineProperty2.default)(CometChatConversationEvents, "onDeleteConversationSuccess", Symbol("onDeleteConversationSuccess"));
(0, _defineProperty2.default)(CometChatConversationEvents, "onError", Symbol("onError"));
(0, _defineProperty2.default)(CometChatConversationEvents, "_triggers", {});
(0, _defineProperty2.default)(CometChatConversationEvents, "emit", function () {
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

  if (CometChatConversationEvents._triggers[event]) {
    for (var i in CometChatConversationEvents._triggers[event]) {
      CometChatConversationEvents._triggers[event][i](params);
    }
  }
});
(0, _defineProperty2.default)(CometChatConversationEvents, "removeListener", function () {
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

  if (CometChatConversationEvents._triggers[event]) {
    delete CometChatConversationEvents._triggers[event][id];
  }
});
(0, _defineProperty2.default)(CometChatConversationEvents, "addListener", function () {
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

  if (!CometChatConversationEvents._triggers[event]) {
    CometChatConversationEvents._triggers[event] = {};
  }

  CometChatConversationEvents._triggers[event][id] = callback;
});