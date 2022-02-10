"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _receiptTypes = require("./receiptTypes");

var _ = require("../../../");

var _2 = require("../../");

var Hooks = function Hooks(props, setAvatar, setPresence, setTitle, setSubTitle, setTime, setUnreadCount, setReceiptType, setThreadIndicator) {
  var getTextMessage = _react.default.useCallback(function (lastMessage) {
    //xss extensions data
    var xssData = (0, _.getExtensionsData)(lastMessage, _.metadataKey.extensions.xssfilter);

    if (xssData && xssData.hasOwnProperty("sanitized_text")) {
      return xssData.sanitized_text;
    } //datamasking extensions data


    var maskedData = (0, _.getExtensionsData)(lastMessage, _.metadataKey.extensions.datamasking);

    if (maskedData && maskedData.data && maskedData.data.sensitive_data && maskedData.data.message_masked && maskedData.data.sensitive_data === "yes") {
      return maskedData.data.message_masked;
    } //profanity extensions data


    var profaneData = (0, _.getExtensionsData)(lastMessage, _.metadataKey.extensions.profanityfilter);

    if (profaneData && profaneData.profanity && profaneData.message_clean && profaneData.profanity === "yes") {
      return profaneData.message_clean;
    }

    return lastMessage.text;
  }, []);

  var getMessage = _react.default.useCallback(function (lastMessage) {
    switch (lastMessage.type) {
      case _chat.CometChat.MESSAGE_TYPE.TEXT:
        return getTextMessage(lastMessage);

      case _chat.CometChat.MESSAGE_TYPE.MEDIA:
        return (0, _2.localize)("MEDIA_MESSAGE");

      case _chat.CometChat.MESSAGE_TYPE.IMAGE:
        return (0, _2.localize)("MESSAGE_IMAGE");

      case _chat.CometChat.MESSAGE_TYPE.FILE:
        return (0, _2.localize)("MESSAGE_FILE");

      case _chat.CometChat.MESSAGE_TYPE.VIDEO:
        return (0, _2.localize)("MESSAGE_VIDEO");

      case _chat.CometChat.MESSAGE_TYPE.AUDIO:
        return (0, _2.localize)("MESSAGE_AUDIO");

      case _chat.CometChat.MESSAGE_TYPE.CUSTOM:
        return (0, _2.localize)("CUSTOM_MESSAGE");

      default:
        return;
    }
  }, [getTextMessage]);

  var getCallActionMessage = _react.default.useCallback(function (lastMessage) {
    switch (lastMessage.type) {
      case _chat.CometChat.MESSAGE_TYPE.VIDEO:
        return (0, _2.localize)("VIDEO_CALL");

      case _chat.CometChat.MESSAGE_TYPE.AUDIO:
        return (0, _2.localize)("AUDIO_CALL");

      default:
        return;
    }
  }, []);

  var getGroupActionMessage = _react.default.useCallback(function (lastMessage) {
    var _lastMessage$actionBy, _lastMessage$actionOn;

    /** return null when the message is of category action and type groupMember */
    if (props.hideGroupActionMessages) {
      return;
    }

    var byUser = lastMessage === null || lastMessage === void 0 ? void 0 : (_lastMessage$actionBy = lastMessage.actionBy) === null || _lastMessage$actionBy === void 0 ? void 0 : _lastMessage$actionBy.name;
    var onUser = lastMessage === null || lastMessage === void 0 ? void 0 : (_lastMessage$actionOn = lastMessage.actionOn) === null || _lastMessage$actionOn === void 0 ? void 0 : _lastMessage$actionOn.name;

    switch (lastMessage.action) {
      case _chat.CometChat.ACTION_TYPE.MEMBER_JOINED:
        return "".concat(byUser, " ").concat((0, _2.localize)("JOINED"));

      case _chat.CometChat.ACTION_TYPE.MEMBER_LEFT:
        return "".concat(byUser, " ").concat((0, _2.localize)("LEFT"));

      case _chat.CometChat.ACTION_TYPE.MEMBER_ADDED:
        return "".concat(byUser, " ").concat((0, _2.localize)("ADDED"), " ").concat(onUser);

      case _chat.CometChat.ACTION_TYPE.MEMBER_KICKED:
        return "".concat(byUser, " ").concat((0, _2.localize)("KICKED"), " ").concat(onUser);

      case _chat.CometChat.ACTION_TYPE.MEMBER_BANNED:
        return "".concat(byUser, " ").concat((0, _2.localize)("BANNED"), " ").concat(onUser);

      case _chat.CometChat.ACTION_TYPE.MEMBER_UNBANNED:
        return "".concat(byUser, " ").concat((0, _2.localize)("UNBANNED"), " ").concat(onUser);

      case _chat.CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED:
        {
          var newScope = lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.newScope;
          return "".concat(byUser, " ").concat((0, _2.localize)("MADE"), " ").concat(onUser, " ").concat((0, _2.localize)(newScope));
        }

      default:
        return;
    }
  }, []);

  var getCustomMessage = _react.default.useCallback(function (lastMessage) {
    switch (lastMessage.type) {
      case _.CometChatCustomMessageTypes.poll:
        return (0, _2.localize)("CUSTOM_MESSAGE_POLL");

      case _.CometChatCustomMessageTypes.sticker:
        return (0, _2.localize)("CUSTOM_MESSAGE_STICKER");

      case _.CometChatCustomMessageTypes.document:
        return (0, _2.localize)("CUSTOM_MESSAGE_DOCUMENT");

      case _.CometChatCustomMessageTypes.whiteboard:
        return (0, _2.localize)("CUSTOM_MESSAGE_WHITEBOARD");

      case _.CometChatCustomMessageTypes.meeting:
        return (0, _2.localize)("VIDEO_CALL");

      default:
        return;
    }
  }, []);

  var getLastMessage = _react.default.useCallback(function () {
    var lastMessage = props.conversation.lastMessage;

    if (lastMessage.deletedAt) {
      /** return null when the message is deleted */
      if (props.hideDeletedMessages) {
        return;
      }

      return "This message is deleted";
    } else {
      switch (lastMessage.category) {
        case _chat.CometChat.CATEGORY_MESSAGE:
          return getMessage(lastMessage);

        case _chat.CometChat.CATEGORY_CALL:
          return getCallActionMessage(lastMessage);

        case _chat.CometChat.CATEGORY_ACTION:
          return getGroupActionMessage(lastMessage);

        case _chat.CometChat.CATEGORY_CUSTOM:
          return getCustomMessage(lastMessage);

        default:
          return;
      }
    }
  }, [props, getMessage, getCallActionMessage, getGroupActionMessage, getCustomMessage]);

  _react.default.useEffect(function () {
    if (props.hideAvatar === false && props.avatar && props.avatar.length) {
      setAvatar(props.avatar);
    } else if (props.hideAvatar === false && props.conversation && props.conversation.conversationType && (props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.USER || props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.GROUP)) {
      setAvatar(props.conversation.conversationWith);
    }
  }, [props, setAvatar]);

  _react.default.useEffect(function () {
    if (props.hideStatusIndicator === false && props.statusIndicator && props.statusIndicator.length) {
      setPresence(props.statusIndicator);
    } else if (props.hideStatusIndicator === false && props.conversation && props.conversation.conversationType && props.conversation.conversationWith && props.conversation.conversationWith.status && props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.USER) {
      setPresence(props.conversation.conversationWith.status);
    }
  }, [props, setPresence]);

  _react.default.useEffect(function () {
    if (props.title && props.title.trim().length) {
      setTitle(props.title);
    } else if (props.conversation && props.conversation.conversationWith && props.conversation.conversationWith.name) {
      setTitle(props.conversation.conversationWith.name);
    }
  }, [props, setTitle]);

  _react.default.useEffect(function () {
    if (props.subTitle && props.subTitle.trim().length) {
      setSubTitle(props.subTitle);
    } else if (props.conversation && props.conversation.lastMessage) {
      setSubTitle(getLastMessage());
    }
  }, [props, setSubTitle, getLastMessage]);

  _react.default.useEffect(function () {
    if (props.hideReceipt === false && props.receipt && _receiptTypes.receiptTypes.hasOwnProperty(props.receipt)) {
      setReceiptType(_receiptTypes.receiptTypes[props.receipt]);
    } else if (props.hideReceipt === false && props.conversation && props.conversation.lastMessage) {
      if (props.conversation.lastMessage.readAt) {
        setReceiptType(_receiptTypes.receiptTypes["read"]);
      } else if (props.conversation.lastMessage.deliveredAt) {
        setReceiptType(_receiptTypes.receiptTypes["delivered"]);
      } else if (props.conversation.lastMessage.sentAt) {
        setReceiptType(_receiptTypes.receiptTypes["sent"]);
      } else if (props.conversation.lastMessage._composedAt) {
        setReceiptType(_receiptTypes.receiptTypes["sending"]);
      } else {
        setReceiptType(_receiptTypes.receiptTypes["received"]);
      }
    }
  }, [props, setReceiptType]);

  _react.default.useEffect(function () {
    if (props.time && props.time.trim().length) {
      setTime(props.time);
    } else if (props.conversation && props.conversation.lastMessage && (props.conversation.lastMessage._composedAt || props.conversation.lastMessage.sentAt)) {
      var timestamp = props.conversation.lastMessage._composedAt || props.conversation.lastMessage.sentAt;
      setTime(timestamp);
    }
  }, [props, setTime]);

  _react.default.useEffect(function () {
    if (props.hideUnreadCount === false && props.unreadCount) {
      setUnreadCount(props.unreadCount);
    } else if (props.hideUnreadCount === false && props.conversation && props.conversation.unreadMessageCount) {
      setUnreadCount(props.conversation.unreadMessageCount);
    }
  }, [props, setUnreadCount]);

  _react.default.useEffect(function () {
    if (props.hideThreadIndicator === false && props.conversation && props.conversation.lastMessage && props.conversation.lastMessage.parentMessageId) {
      setThreadIndicator(props.threadIndicatorText);
    }
  }, [props, setThreadIndicator]);
};

exports.Hooks = Hooks;