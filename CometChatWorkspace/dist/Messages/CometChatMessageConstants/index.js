"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BREAKPOINTS = void 0;
Object.defineProperty(exports, "CometChatCustomMessageOptions", {
  enumerable: true,
  get: function get() {
    return _CometChatCustomMessageOptions.CometChatCustomMessageOptions;
  }
});
Object.defineProperty(exports, "CometChatCustomMessageTypes", {
  enumerable: true,
  get: function get() {
    return _CometChatCustomMessageTypes.CometChatCustomMessageTypes;
  }
});
Object.defineProperty(exports, "CometChatMessageCategories", {
  enumerable: true,
  get: function get() {
    return _CometChatMessageCategories.CometChatMessageCategories;
  }
});
Object.defineProperty(exports, "CometChatMessageOptions", {
  enumerable: true,
  get: function get() {
    return _CometChatMessageOptions.CometChatMessageOptions;
  }
});
exports.CometChatMessageReceiverType = void 0;
Object.defineProperty(exports, "CometChatMessageTypes", {
  enumerable: true,
  get: function get() {
    return _CometChatMessageTypes.CometChatMessageTypes;
  }
});
exports.metadataKey = exports.messageTimeAlignment = exports.messageStatus = exports.messageHoverStyling = exports.messageConstants = exports.messageAlignment = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _chat = require("@cometchat-pro/chat");

var _CometChatMessageCategories = require("./CometChatMessageCategories");

var _CometChatMessageTypes = require("./CometChatMessageTypes");

var _CometChatCustomMessageTypes = require("./CometChatCustomMessageTypes");

var _CometChatCustomMessageOptions = require("./CometChatCustomMessageOptions");

var _CometChatMessageOptions = require("./CometChatMessageOptions");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var CometChatMessageReceiverType = Object.freeze({
  user: _chat.CometChat.RECEIVER_TYPE.USER,
  group: _chat.CometChat.RECEIVER_TYPE.GROUP
});
exports.CometChatMessageReceiverType = CometChatMessageReceiverType;
var messageConstants = {
  maximumNumOfMessages: 1000,
  liveReactionTimeout: 1500
}; // const CONSTANTS = {
// 	MAX_MESSAGE_COUNT: 1000,
// 	LISTENERS: {
// 		TEXT_MESSAGE_RECEIVED: "onTextMessageReceived",
// 		MEDIA_MESSAGE_RECEIVED: "onMediaMessageReceived",
// 		CUSTOM_MESSAGE_RECEIVED: "onCustomMessageReceived",
// 		MESSAGE_DELIVERED: "onMessagesDelivered",
// 		MESSAGE_READ: "onMessagesRead",
// 		MESSAGE_DELETED: "onMessageDeleted",
// 		MESSAGE_EDITED: "onMessageEdited",
// 		GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
// 		GROUP_MEMBER_KICKED: "onGroupMemberKicked",
// 		GROUP_MEMBER_BANNED: "onGroupMemberBanned",
// 		GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
// 		GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
// 		GROUP_MEMBER_LEFT: "onGroupMemberLeft",
// 		GROUP_MEMBER_JOINED: "onGroupMemberJoined",
// 		INCOMING_CALL_RECEIVED: "onIncomingCallReceived",
// 		OUTGOING_CALL_ACCEPTED: "onOutgoingCallAccepted",
// 		OUTGOING_CALL_REJECTED: "onOutgoingCallRejected",
// 		INCOMING_CALL_CANCELLED: "onIncomingCallCancelled",
// 	},
// };

exports.messageConstants = messageConstants;
var messageAlignment = Object.freeze({
  leftAligned: "leftAligned",
  standard: "standard"
});
exports.messageAlignment = messageAlignment;
var messageTimeAlignment = Object.freeze({
  top: "top",
  bottom: "bottom"
});
exports.messageTimeAlignment = messageTimeAlignment;
var messageStatus = {
  inprogress: Symbol("inprogress"),
  success: Symbol("success")
};
exports.messageStatus = messageStatus;

var messageHoverStyling = function messageHoverStyling(props) {
  var _props$loggedInUser;

  var position = {};
  var direction = {
    flexDirection: "row"
  };

  if (props.messageAlignment === messageAlignment.leftAligned) {
    position = {
      top: "0",
      right: "20px"
    };
    direction = {
      flexDirection: "row-reverse"
    };
  } else if (((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid) === props.messageObject.getSender().getUid()) {
    position = {
      top: "-20px",
      right: "28px"
    };
  } else {
    position = {
      top: "-20px",
      right: "20px"
    };
    direction = {
      flexDirection: "row-reverse"
    };
  }

  return _objectSpread(_objectSpread({
    position: "absolute",
    zIndex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end"
  }, position), direction);
};

exports.messageHoverStyling = messageHoverStyling;
var metadataKey = Object.freeze({
  file: "file",
  liveReaction: "live_reaction",
  extensions: {
    thumbnailGeneration: "thumbnail-generation",
    polls: "polls",
    document: "document",
    whiteboard: "whiteboard",
    xssfilter: "xss-filter",
    datamasking: "data-masking",
    profanityfilter: "profanity-filter",
    reactions: "reactions",
    linkpreview: "link-preview"
  }
});
exports.metadataKey = metadataKey;
var BREAKPOINTS = ["(min-width: 320px) and (max-width: 767px)", "(min-width: 320px) and (max-width: 480px)", "(min-width: 481px) and (max-width: 768px)", "(min-width: 769px) and (max-width: 1024px)", "(min-width: 1025px) and (max-width: 1200px)"];
exports.BREAKPOINTS = BREAKPOINTS;