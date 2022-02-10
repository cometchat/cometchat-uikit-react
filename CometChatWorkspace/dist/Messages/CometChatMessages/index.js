"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessages = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _chat = require("@cometchat-pro/chat");

var _hooks = require("./hooks");

var _ = require("../../");

var _2 = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var CometChatMessages = function CometChatMessages(props) {
  var messageListRef = _react.default.useRef(null);

  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      loggedInUser = _React$useState2[0],
      setLoggedInUser = _React$useState2[1];

  var _React$useState3 = _react.default.useState([]),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      messageList = _React$useState4[0],
      setMessageList = _React$useState4[1];

  var _React$useState5 = _react.default.useState([]),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      unreadMessageList = _React$useState6[0],
      setUnreadMessageList = _React$useState6[1];

  var _React$useState7 = _react.default.useState(false),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      scrollToBottom = _React$useState8[0],
      setScrollToBottom = _React$useState8[1];

  var attachListeners = function attachListeners() {
    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messageReceived, "messageReceived", addMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.customMessageReceived, "customMessageReceived", addMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.groupActionMessageReceived, "groupActionMessageReceived", addGroupActionMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.callActionMessageReceived, "callActionMessageReceived", addCallActionMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messageRead, "messageRead", updateMessageAsRead);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messageDelivered, "messageDelivered", updateMessageAsDelivered);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messageDelivered, "messageEdited", updateMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messageDelivered, "messageDeleted", updateMessageAsDeleted);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messagesFetched, "messagesFetched", populateMessagesAndScrollToBottom);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.previousMessagesFetched, "previousMessagesFetched", populateMessages);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.refreshingMessages, "refreshingMessages", resetChatWindow);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.messagesRefreshed, "messagesRefreshed", populateMessagesAndScrollToBottom);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.storeMessage, "storeMessage", storeMessage);

    _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.scrolledToBottom, "scrolledToBottom", scrolledToBottom);
  };
  /**
   * new text and custom message
   */


  var addMessage = function addMessage(message) {
    _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.incomingMessage);

    if (message.parentMessageId) {
      updateRepliesCount(message);
    } else {
      appendMessage(message);
    }
  };
  /** Update replies count in the parent message */


  var updateRepliesCount = function updateRepliesCount(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.parentMessageId;
    });

    if (messageKey > -1) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread({}, messageList[messageKey]));
      var replyCount = messageObject.getReplyCount() ? messageObject.getReplyCount() : 0;
      replyCount = replyCount + 1;
      messageObject.setReplyCount(replyCount);
      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist);
    }
  };
  /** Append message to the message list */


  var appendMessage = function appendMessage(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    messagelist.push(message);
    setMessageList(messagelist);
    setScrollToBottom(true);
  };

  var addGroupActionMessage = function addGroupActionMessage(message) {
    if (props.hideGroupActionMessage) {
      return false;
    }

    appendMessage(message);
  };

  var addCallActionMessage = function addCallActionMessage(message) {
    if (props.hideCallActionMessage) {
      return false;
    }

    appendMessage(message);
  };

  var storeMessage = function storeMessage(message) {
    var unreadmessagelist = (0, _toConsumableArray2.default)(unreadMessageList);
    unreadmessagelist.push(message);
    setUnreadMessageList(unreadmessagelist);
  };

  var updateMessage = function updateMessage(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread(_objectSpread({}, messageList[messageKey]), message));
      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist); //setScrollToBottom(false);
    }
  };
  /**
   * Update message as read; show double blue tick
   */


  var updateMessageAsRead = function updateMessageAsRead(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread({}, messageList[messageKey]));
      messageObject.setReadAt(message.getReadAt());
      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist); //setScrollToBottom(false);
    }
  };
  /**
   * Update message as delivered; show double grey tick
   */


  var updateMessageAsDelivered = function updateMessageAsDelivered(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread({}, messageList[messageKey]));
      messageObject.setDeliveredAt(message.getDeliveredAt());
      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist); //setScrollToBottom(false);
    }
  };

  var updateMessageAsDeleted = function updateMessageAsDeleted(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      if (props.hideDeletedMessage) {
        messagelist.splice(messageKey, 1);
      } else {
        var messageObject = new _chat.CometChat.BaseMessage(_objectSpread(_objectSpread({}, messageList[messageKey]), message));
        messageObject.setDeletedAt(message.getDeletedAt());
        messagelist.splice(messageKey, 1, messageObject);
      }

      setMessageList(messagelist); //setScrollToBottom(false);
    }
  };

  var populateMessages = function populateMessages(messages) {
    var messagelist = [].concat((0, _toConsumableArray2.default)(messages), (0, _toConsumableArray2.default)(messageList));
    setMessageList(messagelist);
  };

  var populateMessagesAndScrollToBottom = function populateMessagesAndScrollToBottom(messages) {
    console.log("populateMessagesAndScrollToBottom messages", messages);
    var messagelist = [].concat((0, _toConsumableArray2.default)(messages), (0, _toConsumableArray2.default)(messageList));
    setMessageList(messagelist);
    setScrollToBottom(true);
  };

  var resetChatWindow = function resetChatWindow() {
    setMessageList([]);
  };

  var updateStoredMessages = function updateStoredMessages() {
    var unreadMessages = (0, _toConsumableArray2.default)(unreadMessageList);
    var messages = (0, _toConsumableArray2.default)(messageList);
    unreadMessages.forEach(function (unreadMessage) {
      if (unreadMessage.receiverType === _chat.CometChat.RECEIVER_TYPE.USER || unreadMessage.receiverType === _chat.CometChat.RECEIVER_TYPE.GROUP) {
        messages.push(unreadMessage);
        markMessageAsRead(unreadMessage);
      }
    });
    setMessageList(messages);
    setScrollToBottom(true);
    setUnreadMessageList([]);
  };
  /**
   * Upon scrolling to bottom, reload the chat if messages cross the maximum count, or else render and update (mark them as read) the stored messages 
   */


  var scrolledToBottom = function scrolledToBottom() {
    if (!unreadMessageList.length) {
      return false;
    }

    var unreadMessages = (0, _toConsumableArray2.default)(unreadMessageList);
    var messages = (0, _toConsumableArray2.default)(messageList);
    messages = messages.concat(unreadMessages);

    if (messages.length > _2.messageConstants.maximumNumOfMessages) {
      if (messageListRef) {
        messageListRef.reInitializeMessageBuilder();
      }
    } else {
      updateStoredMessages();
    }
  };

  var markMessageAsRead = function markMessageAsRead(message) {
    if (!message.getReadAt()) {
      _chat.CometChat.markAsRead(message);
    }
  };

  (0, _hooks.Hooks)(props, setLoggedInUser, attachListeners);

  var renderItems = function renderItems() {
    return messageList.map(function (message) {
      var _message$sender;

      var component = null;
      var messageKey = message._id ? message._id : message.id;
      var messageAlignment = "left";
      var messageListAlignment = props.messageAlignment;

      if (messageListAlignment === "standard" && (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) === (message === null || message === void 0 ? void 0 : (_message$sender = message.sender) === null || _message$sender === void 0 ? void 0 : _message$sender.uid)) {
        messageAlignment = "right";
      }

      if (message.category === _chat.CometChat.CATEGORY_MESSAGE) {
        return /*#__PURE__*/_react.default.createElement(_2.CometChatMessageBubble, {
          key: messageKey,
          messageKey: messageKey,
          messageObject: message,
          messageAlignment: messageAlignment,
          loggedInUser: loggedInUser
        }); //return CometChatMessageBubble.getMessageBubble(props, message);
      } else if (message.category === _chat.CometChat.CATEGORY_CUSTOM) {
        return /*#__PURE__*/_react.default.createElement(_2.CometChatMessageBubble, {
          key: messageKey,
          messageKey: messageKey,
          messageObject: message,
          messageAlignment: messageAlignment,
          loggedInUser: loggedInUser
        }); //return CometChatMessageBubble.getCustomMessageBubble(props, message);
      } else if (message.category === _chat.CometChat.CATEGORY_ACTION) {
        return /*#__PURE__*/_react.default.createElement(_2.CometChatMessageBubble, {
          key: messageKey,
          messageKey: messageKey,
          messageObject: message,
          messageAlignment: messageAlignment,
          loggedInUser: loggedInUser
        }); //return CometChatMessageBubble.getActionMessageBubble(props, message);
      }

      return component;
    });
  };

  if (loggedInUser === null || props.user === null && props.group === null) {
    return null;
  }

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_2.CometChatMessageList //ref={el => (messageListRef = el)}
  , {
    loggedInUser: loggedInUser,
    user: props.user,
    group: props.group,
    parentMessage: props.parentMessage,
    configurations: props.configurations
  }), /*#__PURE__*/_react.default.createElement(_2.CometChatMessageComposer, {
    user: props.user,
    group: props.group,
    parentMessage: props.parentMessage,
    configurations: props.configurations
  }));
};

exports.CometChatMessages = CometChatMessages;
CometChatMessages.propTypes = {
  user: _propTypes.default.object,
  group: _propTypes.default.object,
  parentMessage: _propTypes.default.object,
  hideDeletedMessage: _propTypes.default.bool,
  hideCallActionMessage: _propTypes.default.bool,
  hideGroupActionMessage: _propTypes.default.bool,
  hideEmoji: _propTypes.default.bool,
  hideLiveReaction: _propTypes.default.bool,
  liveReaction: _propTypes.default.string,
  messageAlignment: _propTypes.default.oneOf(["leftAligned", "standard"]),
  configurations: _propTypes.default.array
};
CometChatMessages.defaultProps = {
  user: null,
  group: null,
  parentMessage: null,
  hideDeletedMessage: false,
  hideCallActionMessage: false,
  hideGroupActionMessage: false,
  hideEmoji: false,
  hideLiveReaction: false,
  hideSendingOneOnOneMessage: false,
  hideSendingGroupMessage: false,
  liveReaction: "❤️",
  messageAlignment: "standard",
  configurations: []
};