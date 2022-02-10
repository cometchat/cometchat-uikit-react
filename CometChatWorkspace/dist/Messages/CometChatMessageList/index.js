"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageList = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var _2 = require("../../");

var _controller = require("./controller");

var _hooks = require("./hooks");

var _style = require("./style");

var _this = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var CometChatMessageList = function CometChatMessageList(props) {
  var messageCount = 0;
  var lastScrollTop = 0;

  var _React$useState = _react.default.useState(new _controller.MessageListManager(props)),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
      messageListManager = _React$useState2[0];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      loggedInUser = _React$useState4[0],
      setLoggedInUser = _React$useState4[1];

  var _React$useState5 = _react.default.useState([]),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      messageList = _React$useState6[0],
      setMessageList = _React$useState6[1];

  var _React$useState7 = _react.default.useState([]),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      unreadMessageList = _React$useState8[0],
      setUnreadMessageList = _React$useState8[1];

  var _React$useState9 = _react.default.useState(false),
      _React$useState10 = (0, _slicedToArray2.default)(_React$useState9, 2),
      scrollToBottom = _React$useState10[0],
      setScrollToBottom = _React$useState10[1];

  var _React$useState11 = _react.default.useState(null),
      _React$useState12 = (0, _slicedToArray2.default)(_React$useState11, 2),
      callbackData = _React$useState12[0],
      setCallbackData = _React$useState12[1];

  var _React$useState13 = _react.default.useState((0, _2.localize)("LOADING")),
      _React$useState14 = (0, _slicedToArray2.default)(_React$useState13, 2),
      decoratorMessage = _React$useState14[0],
      setDecoratorMessage = _React$useState14[1];

  var _React$useState15 = _react.default.useState(null),
      _React$useState16 = (0, _slicedToArray2.default)(_React$useState15, 2),
      chatWith = _React$useState16[0],
      setChatWith = _React$useState16[1];

  var _React$useState17 = _react.default.useState(null),
      _React$useState18 = (0, _slicedToArray2.default)(_React$useState17, 2),
      chatWithId = _React$useState18[0],
      setChatWithId = _React$useState18[1];

  var messageListEndRef = _react.default.useRef(null);

  var prevChatWithIdRef = _react.default.useRef(chatWithId);

  var messageListCallback = function messageListCallback(listenerName) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    setCallbackData({
      name: listenerName,
      args: [].concat(args)
    });
  };

  var errorHandler = function errorHandler(errorCode) {};

  var handleMessageOptionClick = function handleMessageOptionClick(option, message) {
    switch (option.id) {
      case _.CometChatMessageOptions.edit:
        {
          _.CometChatMessageEvents.emit(_.CometChatMessageEvents.previewMessageForEdit, message);

          break;
        }

      case _.CometChatMessageOptions.delete:
        {
          _chat.CometChat.deleteMessage(message.id).then(function (deletedMessage) {
            updateMessageAsDeleted(deletedMessage);
          }).catch(function (error) {
            return errorHandler("SOMETHING_WRONG");
          });

          break;
        }

      case _.CometChatMessageOptions.translate:
        {
          break;
        }

      default:
        break;
    }
  };

  var translateMessage = function translateMessage(message) {
    var messageId = message.id;
    var messageText = message.text;

    var translateToLanguage = _2.CometChatLocalize.getLocale();

    var translatedMessage = "";

    _chat.CometChat.callExtension("message-translation", "POST", "v2/translate", {
      msgId: messageId,
      text: messageText,
      languages: [translateToLanguage]
    }).then(function (result) {
      if (result.hasOwnProperty("language_original") && result["language_original"] !== translateToLanguage) {
        if (result.hasOwnProperty("translations") && result.translations.length) {
          var messageTranslation = result.translations[0];

          if (messageTranslation.hasOwnProperty("message_translated")) {
            translatedMessage = "\n(".concat(messageTranslation["message_translated"], ")");
          }
        } else {//this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
        }
      } else {//this.props.actionGenerated(enums.ACTIONS["INFO"], [], "SAME_LANGUAGE_MESSAGE");
      } //this.setState({ translatedMessage: translatedMessage });

    }).catch(function (error) {
      return errorHandler("SOMETHING_WRONG");
    });
  };

  var reInitializeMessageBuilder = function reInitializeMessageBuilder() {
    if (!props.parentMessage || !props.parentMessage.id) {
      messageCount = 0;
    }

    resetChatWindow(); //CometChatMessageEvents.emit(CometChatMessageEvents.refreshingMessages);
    //this.props.actionGenerated(enums.ACTIONS["REFRESHING_MESSAGES"], []);

    setDecoratorMessage((0, _2.localize)("LOADING"));
    messageListManager.removeListeners();

    if (props.parentMessage && props.parentMessage.id) {
      messageListManager = new _controller.MessageListManager(props);
    } else {
      messageListManager = new _controller.MessageListManager(props);
    }

    _hooks.fetchMessages.then(function (messageList) {
      messageHandler(messageList, true);
      messageListManager.attachListeners(messageListCallback);
    });
  };

  var markMessageAsRead = function markMessageAsRead(message) {
    if (!message.readAt) {
      if (chatWith === _chat.CometChat.ACTION_TYPE.TYPE_USER || chatWith === _chat.CometChat.ACTION_TYPE.TYPE_GROUP) {
        _chat.CometChat.markAsRead(message);
      }
    }
  };

  var handleNewMessages = function handleNewMessages(message) {
    //handling dom lag - increment count only for main message list
    var messageReceivedHandler = function messageReceivedHandler(message) {
      if (!message.parentMessageId && (!props.parentMessage || !props.parentMessage.id)) {
        ++messageCount; //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)

        if (messageListEndRef.scrollHeight - messageListEndRef.scrollTop - messageListEndRef.clientHeight < 20) {
          if (messageCount > _.messageConstants.maximumNumOfMessages) {
            reInitializeMessageBuilder();
          } else {
            markMessageAsRead(message);
            addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
            //this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
          }
        } else {
          //if the user has scrolled up in chat window
          storeMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.storeMessage, message);
          //this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
        }
      } else if (props.parentMessage && props.parentMessage.id && message.parentMessageId) {
        if (message.parentMessageId === props.parentMessage.id) {
          markMessageAsRead(message);
        }

        addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
        //this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
      } else {
        addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageReceived, message);
        //this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
      }
    };
    /**
     * message receiver is chat window group
     */


    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      messageReceivedHandler(message);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER) {
      var _props$loggedInUser, _props$loggedInUser2;

      /**
       * If the message sender is chat window user and message receiver is logged-in user
       * OR
       * If the message sender is logged-in user and message receiver is chat window user
       */
      if (message.getSender().uid === chatWithId && message.getReceiverId() === ((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid) || message.getSender().uid === ((_props$loggedInUser2 = props.loggedInUser) === null || _props$loggedInUser2 === void 0 ? void 0 : _props$loggedInUser2.uid) && message.getReceiverId() === chatWithId) {
        messageReceivedHandler(message);
      }
    }
  };

  var handleNewCustomMessages = function handleNewCustomMessages(message) {
    var customMessageReceivedHandler = function customMessageReceivedHandler(message) {
      //handling dom lag - increment count only for main message list
      if (!message.parentMessageId && (!props.parentMessage || !props.parentMessage.id)) {
        ++messageCount; //if the user has not scrolled in chat window(scroll is at the bottom of the chat window)

        if (messageListEndRef.scrollHeight - messageListEndRef.scrollTop === messageListEndRef.clientHeight) {
          if (messageCount > _.messageConstants.maximumNumOfMessages) {
            reInitializeMessageBuilder();
          } else {
            markMessageAsRead(message);
            addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
            //this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
          }
        } else {
          //if the user has scrolled in chat window
          storeMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.storeMessage, message);
          //this.props.actionGenerated(enums.ACTIONS["NEW_MESSAGES"], [message]);
        }
      } else if (message.parentMessageId && props.parentMessage.id && message.parentMessageId) {
        if (message.parentMessageId === props.parentMessage.id) {
          _this.markMessageAsRead(message);
        }

        addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
        //this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
      } else {
        addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
        //this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
      }
    }; //new custom messages


    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && props.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === chatWithId && (message.type === _.CometChatCustomMessageTypes.poll || message.type === _.CometChatCustomMessageTypes.document || message.type === _.CometChatCustomMessageTypes.whiteboard)) {
      //showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
      addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
      //this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      customMessageReceivedHandler(message, _chat.CometChat.RECEIVER_TYPE.GROUP);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && message.getSender().uid === chatWithId) {
      customMessageReceivedHandler(message, _chat.CometChat.RECEIVER_TYPE.USER);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && props.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === chatWithId && (message.type === _.CometChatCustomMessageTypes.poll || message.type === _.CometChatCustomMessageTypes.document || message.type === _.CometChatCustomMessageTypes.whiteboard)) {
      //showing polls, collaborative document and whiteboard for sender (custom message received listener for sender)
      addMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.customMessageReceived, message);
      //this.props.actionGenerated(enums.ACTIONS["CUSTOM_MESSAGE_RECEIVED"], [message]);
    }
  };

  var handleMessageDeliveryAndReadReceipt = function handleMessageDeliveryAndReadReceipt(messageReceipt) {
    //read receipts
    if (messageReceipt.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && messageReceipt.getSender().getUid() === chatWithId && messageReceipt.getReceiver() === props.loggedInUser.uid) {
      if (messageReceipt.getReceiptType() === "delivery") {
        updateMessageAsDelivered(messageReceipt); //CometChatMessageEvents.emit(CometChatMessageEvents.messageDelivered, messageReceipt);
        //this.props.actionGenerated(enums.ACTIONS["updateMessageAsDelivered"], messageList);
      } else if (messageReceipt.getReceiptType() === "read") {
        updateMessageAsRead(messageReceipt); //CometChatMessageEvents.emit(CometChatMessageEvents.messageRead, messageReceipt);
        //this.props.actionGenerated(enums.ACTIONS["updateMessageAsRead"], messageList);
      }
    } else if (messageReceipt.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && messageReceipt.getReceiver() === chatWithId) {//not implemented
    }
  };

  var handleMessageDelete = function handleMessageDelete(message) {
    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      updateMessageAsDeleted(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageDeleted, message);
      //this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && message.getSender().uid === chatWithId) {
      updateMessageAsDeleted(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageDeleted, message);
      //this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_DELETED"], [message]);
    }
  };

  var handleMessageEdit = function handleMessageEdit(message) {
    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      updateMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
      //this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && props.loggedInUser.uid === message.getReceiverId() && message.getSender().uid === chatWithId) {
      updateMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
      //this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && props.loggedInUser.uid === message.getSender().uid && message.getReceiverId() === chatWithId) {
      updateMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.messageEdited, message);
      //this.props.actionGenerated(enums.ACTIONS["ON_MESSAGE_EDITED"], messageList, newMessageObj);
    }
  };

  var handleNewGroupActionMessage = function handleNewGroupActionMessage(message) {
    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      addGroupActionMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.groupActionMessageReceived, message);
      //this.props.actionGenerated(key, message, null, group, options);
    }
  };

  var handleNewCallActionMessage = function handleNewCallActionMessage(message) {
    if (chatWith === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP && message.getReceiverId() === chatWithId) {
      addCallActionMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.callActionMessageReceived, message);
      //this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
    } else if (chatWith === _chat.CometChat.RECEIVER_TYPE.USER && message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER && message.getSender().uid === chatWithId) {
      addCallActionMessage(message); //CometChatMessageEvents.emit(CometChatMessageEvents.callActionMessageReceived, message);
      //this.props.actionGenerated(enums.ACTIONS["MESSAGE_RECEIVED"], [message]);
    }
  };

  var messageHandler = function messageHandler(messagelist, scrollToBottom) {
    messageCount = messagelist.length;
    messagelist.forEach(function (message) {
      //if the sender of the message is not the loggedin user, mark the message as read.
      if (message.getSender().getUid() !== (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) && !message.hasOwnProperty("readAt")) {
        if (message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.USER) {
          _chat.CometChat.markAsRead(message).catch(function (error) {});

          _.CometChatMessageEvents.emit(_.CometChatMessageEvents.markMessageAsRead, message); //this.props.actionGenerated(enums.ACTIONS["MESSAGE_READ"], message);

        } else if (message.getReceiverType() === _chat.CometChat.RECEIVER_TYPE.GROUP) {
          _chat.CometChat.markAsRead(message).catch(function (error) {});

          _.CometChatMessageEvents.emit(_.CometChatMessageEvents.markMessageAsRead, message); //this.props.actionGenerated(enums.ACTIONS["MESSAGE_READ"], message);

        }
      }
    });
    lastScrollTop = messageListEndRef.scrollHeight;
    scrollToBottom ? populateMessagesAndScrollToBottom(messagelist) : populateMessages(messagelist); //CometChatMessageEvents.emit(emitAction, messagelist);
    //abort(don't return messagelist), when the chat window changes
    // if (prevChatWithIdRef && prevChatWithIdRef.current && prevChatWithIdRef.current === chatWithId) {
    //     CometChatMessageEvents.emit(emitAction, messagelist);
    //     //this.props.actionGenerated(enums.ACTIONS["MESSAGES_FETCHED"], messageList);
    // }
  };

  var handleScroll = function handleScroll(event) {
    var scrollTop = event.currentTarget.scrollTop;
    var scrollHeight = event.currentTarget.scrollHeight;
    var clientHeight = event.currentTarget.clientHeight;
    lastScrollTop = scrollHeight - scrollTop;

    if (lastScrollTop === clientHeight) {
      scrolledToBottom(); //CometChatMessageEvents.emit(CometChatMessageEvents.scrolledToBottom, event);
    }

    var top = Math.round(scrollTop) === 0;

    if (top && messageList.length) {
      (0, _hooks.fetchMessages)(messageListManager).then(function (messageList) {
        return messageHandler(messageList, false);
      }).catch(function (error) {//setDecoratorMessage(localize("SOMETHING_WRONG"));
      });
    }
  };
  /**
   * new text and custom message
   */


  var addMessage = function addMessage(message) {
    _2.CometChatSoundManager.play(_2.CometChatSoundManager.Sound.incomingMessage);

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

  var storeMessage = function storeMessage(message) {
    var unreadmessagelist = (0, _toConsumableArray2.default)(unreadMessageList);
    unreadmessagelist.push(message);
    setUnreadMessageList(unreadmessagelist);
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
   * Update message as deleted; show deleted message bubble
   */


  var updateMessageAsDeleted = function updateMessageAsDeleted(message) {
    var messages = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messages.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      if (props.hideDeletedMessage) {
        messages.splice(messageKey, 1);
      } else {
        var messageObject = _objectSpread(_objectSpread({}, messages[messageKey]), message); //const newMessageObject = getCometChatMessage(messageObject);console.log("newMessageObject", newMessageObject);
        //newMessageObject.setDeletedAt(newMessageObject.getDeletedAt());


        messages.splice(messageKey, 1, messageObject);
      }

      setMessageList(messages); //setScrollToBottom(false);
    }
  };
  /**
   * Update message
   */


  var updateMessage = function updateMessage(message) {
    var messagelist = (0, _toConsumableArray2.default)(messageList);
    var messageKey = messagelist.findIndex(function (m) {
      return m.id === message.id;
    });

    if (messageKey > -1) {
      var messageObject = _objectSpread(_objectSpread({}, messageList[messageKey]), message);

      messagelist.splice(messageKey, 1, messageObject);
      setMessageList(messagelist); //setScrollToBottom(false);
    }
  };
  /**
   * append group action message
   */


  var addGroupActionMessage = function addGroupActionMessage(message) {
    if (props.hideGroupActionMessage) {
      return false;
    }

    appendMessage(message);
  };
  /**
   * append group action message
   */


  var addCallActionMessage = function addCallActionMessage(message) {
    if (props.hideCallActionMessage) {
      return false;
    }

    appendMessage(message);
  };
  /**
   * update message list
   */


  var populateMessages = function populateMessages(messages) {
    var messagelist = [].concat((0, _toConsumableArray2.default)(messages), (0, _toConsumableArray2.default)(messageList));
    setMessageList(messagelist);
  };
  /**
   * update message list and scroll to bottom
   */


  var populateMessagesAndScrollToBottom = function populateMessagesAndScrollToBottom(messages) {
    var messagelist = [].concat((0, _toConsumableArray2.default)(messageList), (0, _toConsumableArray2.default)(messages));
    setMessageList(messagelist);
    setScrollToBottom(true);
  };
  /**
   * Upon scrolling to bottom, reload the chat if messages cross the maximum count, 
      * or else render and update (mark them as read) the stored messages
   */


  var scrolledToBottom = function scrolledToBottom() {
    if (!unreadMessageList.length) {
      return false;
    }

    var unreadMessages = (0, _toConsumableArray2.default)(unreadMessageList);
    var messages = (0, _toConsumableArray2.default)(messageList);
    messages = messages.concat(unreadMessages);

    if (messages.length > _.messageConstants.maximumNumOfMessages) {
      reInitializeMessageBuilder();
    } else {
      updateStoredMessages();
    }
  };
  /**
   * upon scrolling to the bottom, update the unread messagess
   */


  var updateStoredMessages = function updateStoredMessages() {
    var unreadMessages = (0, _toConsumableArray2.default)(unreadMessageList);
    var messages = (0, _toConsumableArray2.default)(messageList);
    unreadMessages.forEach(function (unreadMessage) {
      //if (unreadMessage.receiverType === CometChat.RECEIVER_TYPE.USER || unreadMessage.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      messages.push(unreadMessage);
      markMessageAsRead(unreadMessage); //}
    });
    setMessageList(messages);
    setScrollToBottom(true);
    setUnreadMessageList([]);
  };
  /**
   * reset message list
   */


  var resetChatWindow = function resetChatWindow() {
    setMessageList([]);
  };

  var handlers = {
    onTextMessageReceived: handleNewMessages,
    onMediaMessageReceived: handleNewMessages,
    onCustomMessageReceived: handleNewCustomMessages,
    onMessagesDelivered: handleMessageDeliveryAndReadReceipt,
    onMessagesRead: handleMessageDeliveryAndReadReceipt,
    onMessageDeleted: handleMessageDelete,
    onMessageEdited: handleMessageEdit,
    onGroupMemberScopeChanged: handleNewGroupActionMessage,
    onGroupMemberKicked: handleNewGroupActionMessage,
    onGroupMemberBanned: handleNewGroupActionMessage,
    onGroupMemberUnbanned: handleNewGroupActionMessage,
    onMemberAddedToGroup: handleNewGroupActionMessage,
    onGroupMemberLeft: handleNewGroupActionMessage,
    onGroupMemberJoined: handleNewGroupActionMessage,
    onIncomingCallReceived: handleNewCallActionMessage,
    onIncomingCallCancelled: handleNewCallActionMessage,
    onOutgoingCallAccepted: handleNewCallActionMessage,
    onOutgoingCallRejected: handleNewCallActionMessage
  };

  _.CometChatMessageEvents.addListener(_.CometChatMessageEvents.messageEdited, updateMessage);

  (0, _hooks.Hooks)(props, setLoggedInUser, messageList, setMessageList, setScrollToBottom, prevChatWithIdRef, chatWithId, setDecoratorMessage, setChatWith, setChatWithId, messageHandler, messageListManager, messageListCallback, handlers, callbackData);
  var decoratorMessageContainer = decoratorMessage.length && !props.children ? /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.decoratorMessageStyle)(),
    className: "messages__decorator-message"
  }, /*#__PURE__*/_react.default.createElement("p", {
    style: (0, _style.decoratorMessageTxtStyle)(props),
    className: "decorator-message"
  }, decoratorMessage)) : null;

  var renderItems = function renderItems() {
    //const messageAlignment = props.configurations?.messageAlignment || defaultMessageConfiguration.messageAlignment;
    //const messageTimeAlignment = props.configurations?.messageTimeAlignment || defaultMessageConfiguration.messageTimeAlignment;
    return messageList.map(function (eachMessage) {
      var _eachMessage$sender;

      var messageKey = eachMessage._id || eachMessage.id;
      var className = "message__".concat(eachMessage.type, " message__kit__background");
      var messageStyle = (loggedInUser === null || loggedInUser === void 0 ? void 0 : loggedInUser.uid) === (eachMessage === null || eachMessage === void 0 ? void 0 : (_eachMessage$sender = eachMessage.sender) === null || _eachMessage$sender === void 0 ? void 0 : _eachMessage$sender.uid) ? {
        backgroundColor: "#39f",
        textColor: "#fff",
        cornerRadius: "12px",
        iconTint: "#fff",
        usernameFont: "11px Inter sans-serif",
        usernameColor: "rgba(20, 20, 20, 0.4)",
        documentStyle: {
          title: (0, _2.localize)("SHARED_COLLABORATIVE_DOCUMENT"),
          titleFont: "14px Inter, sans-serif",
          titleColor: "#fff",
          buttonText: (0, _2.localize)("LAUNCH"),
          buttonTextColor: "#39f",
          buttonTextFont: "600 14px Inter",
          buttonBackgroundColor: "#fff",
          iconColor: "#fff"
        },
        whiteboardStyle: {
          title: (0, _2.localize)("CREATED_WHITEBOARD"),
          titleFont: "14px Inter, sans-serif",
          titleColor: "#fff",
          buttonText: (0, _2.localize)("LAUNCH"),
          buttonTextColor: "#39f",
          buttonTextFont: "600 14px Inter",
          buttonBackgroundColor: "#fff",
          iconColor: "#fff"
        }
      } : {
        backgroundColor: "rgb(246, 246, 246)",
        textColor: "rgb(20, 20, 20)",
        cornerRadius: "12px",
        iconTint: "#39f",
        usernameFont: "11px Inter sans-serif",
        usernameColor: "rgba(20, 20, 20, 0.4)",
        documentStyle: {
          title: (0, _2.localize)("SHARED_COLLABORATIVE_DOCUMENT"),
          titleFont: "14px Inter, sans-serif",
          titleColor: "rgb(20, 20, 20)",
          buttonText: (0, _2.localize)("JOIN"),
          buttonTextColor: "#39f",
          buttonTextFont: "600 14px Inter",
          buttonBackgroundColor: "#fff",
          iconColor: "#39f"
        },
        whiteboardStyle: {
          title: (0, _2.localize)("SHARED_COLLABORATIVE_WHITEBOARD"),
          titleFont: "14px Inter, sans-serif",
          titleColor: "rgb(20, 20, 20)",
          buttonText: (0, _2.localize)("JOIN"),
          buttonTextColor: "#39f",
          buttonTextFont: "600 14px Inter",
          buttonBackgroundColor: "#fff",
          iconColor: "#39f"
        }
      };
      return /*#__PURE__*/_react.default.createElement("div", {
        key: messageKey,
        className: className,
        style: (0, _style.messageBubbleStyle)(props, loggedInUser, eachMessage)
      }, /*#__PURE__*/_react.default.createElement(_.CometChatMessageBubble, {
        key: messageKey,
        messageKey: messageKey,
        messageObject: eachMessage,
        messageAlignment: props.messageAlignment,
        messageTimeAlignment: props.messageTimeAlignment,
        loggedInUser: loggedInUser,
        configurations: props.configurations,
        messageStyle: messageStyle,
        onMessageOptionClick: handleMessageOptionClick
      }));
    });
  };

  return /*#__PURE__*/_react.default.createElement("div", {
    className: "chat__list",
    style: (0, _style.chatListStyle)()
  }, decoratorMessageContainer, /*#__PURE__*/_react.default.createElement("div", {
    className: "list__wrapper",
    style: (0, _style.listWrapperStyle)(props),
    ref: messageListEndRef,
    onScroll: handleScroll
  }, renderItems()));
};

exports.CometChatMessageList = CometChatMessageList;
CometChatMessageList.propTypes = {
  loggedInUser: _propTypes.default.object,
  user: _propTypes.default.object,
  group: _propTypes.default.object,
  parentMessage: _propTypes.default.object,
  messageAlignment: _propTypes.default.oneOf(["leftAligned", "standard"]),
  messageTimeAlignment: _propTypes.default.oneOf(["top", "bottom"]),
  hideDeletedMessage: _propTypes.default.bool,
  hideGroupActionMessage: _propTypes.default.bool,
  hideCallActionMessage: _propTypes.default.bool,
  configurations: _propTypes.default.array
};
CometChatMessageList.defaultProps = {
  loggedInUser: null,
  user: null,
  group: null,
  parentMessage: null,
  messageAlignment: "standard",
  messageTimeAlignment: "bottom",
  hideDeletedMessage: false,
  hideGroupActionMessage: false,
  hideCallActionMessage: false,
  configurations: []
};