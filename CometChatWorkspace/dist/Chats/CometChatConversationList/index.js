"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConversationList = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../");

var _2 = require("../");

var _controller = require("./controller");

var _hooks = require("./hooks");

var _style = require("./style");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * 
 * CometChatConversationList component retrieves the latest conversations that a CometChat logged-in user has been a part of. 
 * The state of the component is communicated via 3 states i.e empty, loading and error
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatConversationList = /*#__PURE__*/_react.default.forwardRef(function (props, ref) {
  var incrementUnreadCount = true;

  var _React$useState = _react.default.useState(new _controller.ConversationListManager(props)),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 1),
      conversationListManager = _React$useState2[0];

  var _React$useState3 = _react.default.useState([]),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      conversationList = _React$useState4[0],
      setConversationList = _React$useState4[1];

  var _React$useState5 = _react.default.useState(null),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      callbackData = _React$useState6[0],
      setCallbackData = _React$useState6[1];

  var _React$useState7 = _react.default.useState("Loading"),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      message = _React$useState8[0],
      setMessage = _React$useState8[1];

  var _React$useState9 = _react.default.useState(props.background),
      _React$useState10 = (0, _slicedToArray2.default)(_React$useState9, 2),
      background = _React$useState10[0],
      setBackground = _React$useState10[1];

  var conversationCallback = function conversationCallback(listenerName) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    setCallbackData({
      name: listenerName,
      args: [].concat(args)
    });
  };
  /**
   * Remove conversation from the conversationlist upon delete
   */


  _react.default.useImperativeHandle(ref, function () {
    return {
      removeConversation: removeConversation
    };
  });
  /**
   *
   * Mark the incoming message as delivered
   */


  var markMessageAsDelivered = function markMessageAsDelivered(message) {
    if (message.hasOwnProperty("deliveredAt") === false) {
      _chat.CometChat.markAsDelivered(message);
    }
  };
  /**
   *
   * If the incoming message is 1-1 conversation, and the conversation type filter is set to groups return false
   * If the incoming message is group conversation, and the conversation type filter is set to users return false
   * else return true
   *
   */


  var filterByConversationType = function filterByConversationType(message) {
    if (props.conversationType !== _2.conversationType["both"]) {
      if (props.conversationType === _2.conversationType["users"] && message.receiverType === _chat.CometChat.RECEIVER_TYPE.GROUP || props.conversationType === _2.conversationType["groups"] && message.receiverType === _chat.CometChat.RECEIVER_TYPE.USER) {
        return false;
      }
    }

    return true;
  };
  /**
   *
   * Converting message object received in the listener callback to conversation object
   */


  var getConversationFromMessage = function getConversationFromMessage(message) {
    return new Promise(function (resolve, reject) {
      _chat.CometChat.CometChatHelper.getConversationFromMessage(message).then(function (conversation) {
        var conversationKey = conversationList.findIndex(function (c) {
          return c.conversationId === conversation.conversationId;
        });

        if (conversationKey > -1) {
          resolve({
            conversationKey: conversationKey,
            conversationId: conversation.conversationId,
            conversationType: conversation.conversationType,
            conversationWith: conversation.conversationWith,
            conversation: conversationList[conversationKey],
            conversations: (0, _toConsumableArray2.default)(conversationList)
          });
        }

        resolve({
          conversationKey: conversationKey,
          conversationId: conversation.conversationId,
          conversationType: conversation.conversationType,
          conversationWith: conversation.conversationWith,
          conversation: conversation,
          conversations: (0, _toConsumableArray2.default)(conversationList)
        });
      }).catch(function (error) {
        return reject(error);
      });
    });
  };

  var getUnreadMessageCount = function getUnreadMessageCount(message) {
    var conversation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // need to discuss w mayur
    var unreadMessageCount = conversation.unreadMessageCount ? Number(conversation.unreadMessageCount) : 0;

    if (incrementUnreadCount === true) {
      unreadMessageCount = shouldIncrementCount(message) ? ++unreadMessageCount : unreadMessageCount;
    } else {
      unreadMessageCount = 0;
    }

    return unreadMessageCount;
  };
  /**
   *
   * If the message is sent by the logged in user, return false
   * If the message has category message or has incrementUnreadCount key in the metadata with value set to true, return true else return false
   *
   */


  var shouldIncrementCount = function shouldIncrementCount(message) {
    var _message$sender, _props$loggedInUser;

    if ((message === null || message === void 0 ? void 0 : (_message$sender = message.sender) === null || _message$sender === void 0 ? void 0 : _message$sender.uid) === ((_props$loggedInUser = props.loggedInUser) === null || _props$loggedInUser === void 0 ? void 0 : _props$loggedInUser.uid)) {
      return false;
    }

    if (message.category === _chat.CometChat.CATEGORY_MESSAGE || (message.metadata && message.metadata.incrementUnreadCount && message.metadata.incrementUnreadCount) === true) {
      return true;
    }

    return false;
  };
  /**
   * play notification sound for incoming messages
   */


  var playNotificationSound = function playNotificationSound(message) {
    var _props$configurations, _props$configurations2;

    /**
     * If unreadcount is not incremented, don't play notification sound
     */
    if (!shouldIncrementCount(message)) {
      return false;
    }
    /**
     * If group action messages are hidden, and the incoming message is of category `action` and type `groupMember`, don't play notification sound
     */


    var hideGroupActionMessages = (_props$configurations = props.configurations) === null || _props$configurations === void 0 ? void 0 : (_props$configurations2 = _props$configurations.ConversationListItemConfiguration) === null || _props$configurations2 === void 0 ? void 0 : _props$configurations2.hideGroupActionMessages;

    if (hideGroupActionMessages === true && message.category === _chat.CometChat.CATEGORY_ACTION && message.type === _chat.CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER) {
      return false;
    }

    if (props.activeConversation && props.activeConversation.conversationType && props.activeConversation.conversationWith) {
      var _props$activeConversa, _props$activeConversa2;

      var receiverType = message.getReceiverType();
      var receiverId = receiverType === _chat.CometChat.RECEIVER_TYPE.USER ? message.getSender().getUid() : message.getReceiverId();

      if (receiverId !== ((_props$activeConversa = props.activeConversation.conversationWith) === null || _props$activeConversa === void 0 ? void 0 : _props$activeConversa.uid) && receiverId !== ((_props$activeConversa2 = props.activeConversation.conversationWith) === null || _props$activeConversa2 === void 0 ? void 0 : _props$activeConversa2.guid)) {
        _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.incomingMessageFromOther);
      }
    } else {
      _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.incomingMessageFromOther);
    } // CometChatSoundManager.play(CometChatSoundManager.Sound["incomingmessage"],
    // "https://proxy.notificationsounds.com/message-tones/pristine-609/download/file-sounds-1150-pristine.mp3");

  };
  /**
   *
   * When a user goes online/ offline
   */


  var handleUsers = function handleUsers(user) {
    var conversationKey = conversationList.findIndex(function (eachConversation) {
      return eachConversation.conversationType && eachConversation.conversationType === _chat.CometChat.RECEIVER_TYPE.USER && eachConversation.conversationWith && eachConversation.conversationWith.uid && eachConversation.conversationWith.uid === user.uid;
    });

    if (conversationKey > -1) {
      var conversation = conversationList[conversationKey];

      var conversationWith = _objectSpread(_objectSpread({}, conversation.conversationWith), {}, {
        status: user.getStatus()
      });

      var newConversation = _objectSpread(_objectSpread({}, conversation), {}, {
        conversationWith: conversationWith
      });

      conversationList.splice(conversationKey, 1, newConversation);
      setConversationList(conversationList);
    }
  };
  /**
   *
   * When a text message / media message / custom message is received
   */


  var handleMessages = function handleMessages() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    /**
     * marking the incoming messages as read
     */

    markMessageAsDelivered(message);
    /**
     * If the incoming message is 1-1 and the conversation type filter is set to group, return false
     * OR
     * If the incoming message is group and the conversation type filter is set to "users", return false
     * ELSE
     * return true
     */

    if (filterByConversationType() === false) {
      return false;
    }

    getConversationFromMessage(message).then(function (response) {
      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

      if (conversationKey > -1) {
        var unreadMessageCount = getUnreadMessageCount(message, conversation);
        var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, unreadMessageCount);
        conversations.splice(conversationKey, 1);
        conversations.unshift(newConversation);
        setConversationList(conversations); //play notification sound

        playNotificationSound(message);
      } else {
        var _unreadMessageCount = getUnreadMessageCount(message);

        var _newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, _unreadMessageCount);

        conversations.unshift(_newConversation);
        setConversationList(conversations); //play notification sound

        playNotificationSound(message);
      }
    });
  };
  /**
   * Listener callback when a message is edited, deleted or updated
   */


  var handleMessageActions = function handleMessageActions() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    getConversationFromMessage(message).then(function (response) {
      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      if (conversationKey > -1 && conversation.lastMessage.id === message.id) {
        var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

        var unreadMessageCount = getUnreadMessageCount(message, conversation);
        var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, conversationWith, unreadMessageCount);
        conversations.splice(conversationKey, 1, newConversation);
        setConversationList(conversations);
      }
    });
  };
  /**
   *
   * Listener callback when a message is read
   */


  var handleMessageReadActions = function handleMessageReadActions() {
    var messageReceipt = arguments.length <= 0 ? undefined : arguments[0];
    var conversationKey = conversationList.findIndex(function (conversation) {
      var _conversation$convers, _conversation$convers2;

      return (messageReceipt === null || messageReceipt === void 0 ? void 0 : messageReceipt.receiverType) === (conversation === null || conversation === void 0 ? void 0 : conversation.conversationType) && ((messageReceipt === null || messageReceipt === void 0 ? void 0 : messageReceipt.receiver) === (conversation === null || conversation === void 0 ? void 0 : (_conversation$convers = conversation.conversationWith) === null || _conversation$convers === void 0 ? void 0 : _conversation$convers.uid) || (messageReceipt === null || messageReceipt === void 0 ? void 0 : messageReceipt.receiver) === (conversation === null || conversation === void 0 ? void 0 : (_conversation$convers2 = conversation.conversationWith) === null || _conversation$convers2 === void 0 ? void 0 : _conversation$convers2.guid));
    });

    if (conversationKey > -1) {
      var _conversation$lastMes;

      var conversations = _objectSpread({}, conversationList);

      var conversation = conversations[conversationKey];
      var unreadMessageCount = conversation.unreadMessageCount;
      /**
       * If the message id in the read receipt is greater than or equal to the lastmessage id, set unreadmessagecount to 0
       */

      if ((messageReceipt === null || messageReceipt === void 0 ? void 0 : messageReceipt.messageId) >= (conversation === null || conversation === void 0 ? void 0 : (_conversation$lastMes = conversation.lastMessage) === null || _conversation$lastMes === void 0 ? void 0 : _conversation$lastMes.id)) {
        unreadMessageCount = 0;
      }

      var newConversation = new _chat.CometChat.Conversation(conversation.conversationId, conversation.conversationType, conversation.lastMessage, conversation.conversationWith, unreadMessageCount);
      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };
  /**
   *
   * Listener callback when a user joins/added to the group
   */


  var handleGroupMemberAddition = function handleGroupMemberAddition() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    var newUser = arguments.length <= 1 ? undefined : arguments[1];
    var group = arguments.length <= 3 ? undefined : arguments[3];
    getConversationFromMessage(message).then(function (response) {
      var _props$loggedInUser2;

      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      if (conversationKey > -1) {
        var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

        var newConversationWith = _objectSpread(_objectSpread({}, conversationWith), group);

        var unreadMessageCount = conversation.unreadMessageCount;
        var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);
        conversations.splice(conversationKey, 1, newConversation);
        setConversationList(conversations);
      } else if (((_props$loggedInUser2 = props.loggedInUser) === null || _props$loggedInUser2 === void 0 ? void 0 : _props$loggedInUser2.uid) === newUser.uid) {
        /**
         * If the loggedin user is added to the group, add the conversation to the chats list
         */
        var _lastMessage = _objectSpread({}, message);

        var _newConversationWith = _objectSpread(_objectSpread(_objectSpread({}, conversationWith), group), {}, {
          hasJoined: true
        });

        var _unreadMessageCount2 = conversation.unreadMessageCount;

        var _newConversation2 = new _chat.CometChat.Conversation(conversationId, conversationType, _lastMessage, _newConversationWith, _unreadMessageCount2);

        conversations.unshift(_newConversation2);
        setConversationList(conversations);
      }
    });
  };
  /**
   *
   * Listener callback when a member is kicked from / has left the group
   */


  var handleGroupMemberRemoval = function handleGroupMemberRemoval() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    var removedUser = arguments.length <= 1 ? undefined : arguments[1];
    var group = arguments.length <= 3 ? undefined : arguments[3];
    getConversationFromMessage(message).then(function (response) {
      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      if (conversationKey > -1) {
        var _props$loggedInUser3;

        /**
         * If the loggedin user is removed from the group, remove the conversation from the chats list
         */
        if (((_props$loggedInUser3 = props.loggedInUser) === null || _props$loggedInUser3 === void 0 ? void 0 : _props$loggedInUser3.uid) === removedUser.uid) {
          conversations.splice(conversationKey, 1);
          setConversationList(conversations);
        } else {
          var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

          var newConversationWith = _objectSpread(_objectSpread({}, conversationWith), group);

          var unreadMessageCount = conversation.unreadMessageCount;
          var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);
          conversations.splice(conversationKey, 1, newConversation);
          setConversationList(conversations);
        }
      }
    });
  };
  /**
   *
   * Listener callback when a member is banned from the group
   */


  var handleGroupMemberBan = function handleGroupMemberBan() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    var removedUser = arguments.length <= 1 ? undefined : arguments[1];
    var group = arguments.length <= 3 ? undefined : arguments[3];
    getConversationFromMessage(message).then(function (response) {
      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      if (conversationKey > -1) {
        var _props$loggedInUser4;

        /**
         * If the loggedin user is banned from the group, remove the conversation from the chats list
         */
        if (((_props$loggedInUser4 = props.loggedInUser) === null || _props$loggedInUser4 === void 0 ? void 0 : _props$loggedInUser4.uid) === removedUser.uid) {
          conversations.splice(conversationKey, 1);
          setConversationList(conversations);
        } else {
          var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

          var newConversationWith = _objectSpread(_objectSpread({}, conversationWith), group);

          var unreadMessageCount = conversation.unreadMessageCount;
          var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);
          conversations.splice(conversationKey, 1, newConversation);
          setConversationList(conversations);
        }
      }
    });
  };
  /**
   *
   * Listener callback when a group member scope is updated
   */


  var handleGroupMemberScopeChange = function handleGroupMemberScopeChange() {
    var message = arguments.length <= 0 ? undefined : arguments[0];
    var user = arguments.length <= 1 ? undefined : arguments[1];
    var newScope = arguments.length <= 2 ? undefined : arguments[2];
    var group = arguments.length <= 4 ? undefined : arguments[4];
    getConversationFromMessage(message).then(function (response) {
      var conversationKey = response.conversationKey,
          conversationId = response.conversationId,
          conversationType = response.conversationType,
          conversationWith = response.conversationWith,
          conversation = response.conversation,
          conversations = response.conversations;

      if (conversationKey > -1) {
        var _props$loggedInUser5;

        var lastMessage = _objectSpread(_objectSpread({}, conversation.lastMessage), message);

        var unreadMessageCount = conversation.unreadMessageCount;

        if (((_props$loggedInUser5 = props.loggedInUser) === null || _props$loggedInUser5 === void 0 ? void 0 : _props$loggedInUser5.uid) === user.uid) {
          var newConversationWith = _objectSpread(_objectSpread(_objectSpread({}, conversationWith), group), {}, {
            scope: newScope
          });

          var newConversation = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, newConversationWith, unreadMessageCount);
          conversations.splice(conversationKey, 1);
          conversations.unshift(newConversation);
          setConversationList(conversations);
        } else {
          var _newConversationWith2 = _objectSpread(_objectSpread({}, conversationWith), group);

          var _newConversation3 = new _chat.CometChat.Conversation(conversationId, conversationType, lastMessage, _newConversationWith2, unreadMessageCount);

          conversations.splice(conversationKey, 1, _newConversation3);
          setConversationList(conversations);
        }
      }
    });
  };
  /**
   *
   * Listener callback for typing events
   */


  var handleTyping = function handleTyping() {
    var typingData = arguments.length <= 0 ? undefined : arguments[0];
    var typingStarted = arguments.length <= 1 ? undefined : arguments[1];
    var conversations = (0, _toConsumableArray2.default)(conversationList);
    var conversationKey = conversations.findIndex(function (conversation) {
      var _conversation$convers3, _typingData$sender, _conversation$convers4;

      return (conversation === null || conversation === void 0 ? void 0 : conversation.conversationType) === (typingData === null || typingData === void 0 ? void 0 : typingData.receiverType) && ((conversation === null || conversation === void 0 ? void 0 : conversation.conversationType) === _chat.CometChat.RECEIVER_TYPE.USER && ((_conversation$convers3 = conversation.conversationWith) === null || _conversation$convers3 === void 0 ? void 0 : _conversation$convers3.uid) === (typingData === null || typingData === void 0 ? void 0 : (_typingData$sender = typingData.sender) === null || _typingData$sender === void 0 ? void 0 : _typingData$sender.uid) || conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.GROUP && ((_conversation$convers4 = conversation.conversationWith) === null || _conversation$convers4 === void 0 ? void 0 : _conversation$convers4.guid) === (typingData === null || typingData === void 0 ? void 0 : typingData.receiverId));
    });

    if (conversationKey > -1) {
      var typingIndicatorText = "";

      if (typingStarted) {
        var _typingData$sender2;

        typingIndicatorText = (typingData === null || typingData === void 0 ? void 0 : typingData.receiverType) === _chat.CometChat.RECEIVER_TYPE.GROUP ? "".concat(typingData === null || typingData === void 0 ? void 0 : (_typingData$sender2 = typingData.sender) === null || _typingData$sender2 === void 0 ? void 0 : _typingData$sender2.name, " ").concat((0, _.localize)("IS_TYPING")) : (0, _.localize)("IS_TYPING");
      }

      var conversation = conversationList[conversationKey];

      var newConversation = _objectSpread(_objectSpread({}, conversation), {}, {
        showTypingIndicator: typingStarted,
        typingIndicatorText: typingIndicatorText
      });

      conversations.splice(conversationKey, 1, newConversation);
      setConversationList(conversations);
    }
  };

  var handlers = {
    onUserOnline: handleUsers,
    onUserOffline: handleUsers,
    onTextMessageReceived: handleMessages,
    onMediaMessageReceived: handleMessages,
    onCustomMessageReceived: handleMessages,
    onIncomingCallReceived: handleMessages,
    onIncomingCallCancelled: handleMessages,
    messageEdited: handleMessageActions,
    onMessageDeleted: handleMessageActions,
    messageRead: handleMessageReadActions,
    onMemberAddedToGroup: handleGroupMemberAddition,
    onGroupMemberJoined: handleGroupMemberAddition,
    onGroupMemberKicked: handleGroupMemberRemoval,
    onGroupMemberLeft: handleGroupMemberRemoval,
    onGroupMemberBanned: handleGroupMemberBan,
    onGroupMemberScopeChanged: handleGroupMemberScopeChange,
    onTypingStarted: handleTyping,
    onTypingEnded: handleTyping
  };
  (0, _hooks.Hooks)(props, setBackground, setMessage, conversationList, setConversationList, conversationCallback, conversationListManager, handlers, callbackData);

  var handleScroll = function handleScroll(event) {
    var bottom = Math.round(event.currentTarget.scrollHeight - event.currentTarget.scrollTop) === Math.round(event.currentTarget.clientHeight);

    if (bottom) {
      (0, _hooks.getConversations)(conversationListManager).then(function (conversations) {
        setConversationList([].concat((0, _toConsumableArray2.default)(conversations), (0, _toConsumableArray2.default)(conversationList)));
      });
    }
  };

  var clickHandler = function clickHandler() {// CometChatConversationList.listeners.(element => {
    // });;
  };
  /**
   * Remove conversation from the conversationlist upon delete
   */


  var removeConversation = function removeConversation(conversation) {
    var conversationKey = conversationList.findIndex(function (c) {
      return c.conversationId === conversation.conversationId;
    });

    if (conversationKey > -1) {
      var newConversationList = (0, _toConsumableArray2.default)(conversationList);
      newConversationList.splice(conversationKey, 1);
      setConversationList(newConversationList);
    }
  };

  var getMessage = function getMessage() {
    if (message.trim().length !== 0) {
      return /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.messageContainerStyle)(),
        className: "chats__message"
      }, /*#__PURE__*/_react.default.createElement("p", {
        style: (0, _style.messageTextStyle)(),
        className: "message"
      }, message));
    }

    return null;
  };

  var renderItems = conversationList.map(function (conversation) {
    var _props$configurations3, _props$configurations4, _props$configurations5, _props$configurations6, _props$configurations7, _props$configurations8, _props$configurations9, _props$configurations10, _props$configurations11, _props$configurations12, _props$configurations15, _props$configurations16, _props$configurations19, _props$configurations20, _props$configurations21, _props$configurations22, _props$configurations23, _props$configurations24, _props$configurations25, _props$configurations26, _props$configurations27, _props$configurations28, _props$configurations29, _props$configurations30, _props$activeConversa3, _props$configurations35;

    var typingIndicatorText = conversation.typingIndicatorText ? conversation.typingIndicatorText : "";
    var background = ((_props$configurations3 = props.configurations) === null || _props$configurations3 === void 0 ? void 0 : (_props$configurations4 = _props$configurations3.ConversationListItemConfiguration) === null || _props$configurations4 === void 0 ? void 0 : _props$configurations4.background) || "transparent";
    var hideStatusIndicator = ((_props$configurations5 = props.configurations) === null || _props$configurations5 === void 0 ? void 0 : (_props$configurations6 = _props$configurations5.ConversationListItemConfiguration) === null || _props$configurations6 === void 0 ? void 0 : _props$configurations6.hideStatusIndicator) || false;
    var hideAvatar = ((_props$configurations7 = props.configurations) === null || _props$configurations7 === void 0 ? void 0 : (_props$configurations8 = _props$configurations7.ConversationListItemConfiguration) === null || _props$configurations8 === void 0 ? void 0 : _props$configurations8.hideAvatar) || false;
    var hideUnreadCount = ((_props$configurations9 = props.configurations) === null || _props$configurations9 === void 0 ? void 0 : (_props$configurations10 = _props$configurations9.ConversationListItemConfiguration) === null || _props$configurations10 === void 0 ? void 0 : _props$configurations10.hideUnreadCount) || false;
    var hideReceipt = false;

    if (((_props$configurations11 = props.configurations) === null || _props$configurations11 === void 0 ? void 0 : (_props$configurations12 = _props$configurations11.ConversationListItemConfiguration) === null || _props$configurations12 === void 0 ? void 0 : _props$configurations12.hideReceipt) !== undefined) {
      var _props$configurations13, _props$configurations14;

      hideReceipt = (_props$configurations13 = props.configurations) === null || _props$configurations13 === void 0 ? void 0 : (_props$configurations14 = _props$configurations13.ConversationListItemConfiguration) === null || _props$configurations14 === void 0 ? void 0 : _props$configurations14.hideReceipt;
    } else if (conversation.showTypingIndicator) {
      hideReceipt = true;
    }

    var showTypingIndicator;

    if (((_props$configurations15 = props.configurations) === null || _props$configurations15 === void 0 ? void 0 : (_props$configurations16 = _props$configurations15.ConversationListItemConfiguration) === null || _props$configurations16 === void 0 ? void 0 : _props$configurations16.showTypingIndicator) !== undefined) {
      var _props$configurations17, _props$configurations18;

      showTypingIndicator = (_props$configurations17 = props.configurations) === null || _props$configurations17 === void 0 ? void 0 : (_props$configurations18 = _props$configurations17.ConversationListItemConfiguration) === null || _props$configurations18 === void 0 ? void 0 : _props$configurations18.showTypingIndicator;
    } else if (conversation.showTypingIndicator === undefined) {
      showTypingIndicator = false;
    } else {
      showTypingIndicator = conversation.showTypingIndicator;
    }

    var hideThreadIndicator = ((_props$configurations19 = props.configurations) === null || _props$configurations19 === void 0 ? void 0 : (_props$configurations20 = _props$configurations19.ConversationListItemConfiguration) === null || _props$configurations20 === void 0 ? void 0 : _props$configurations20.hideThreadIndicator) || false;
    var hideGroupActionMessages = ((_props$configurations21 = props.configurations) === null || _props$configurations21 === void 0 ? void 0 : (_props$configurations22 = _props$configurations21.ConversationListItemConfiguration) === null || _props$configurations22 === void 0 ? void 0 : _props$configurations22.hideGroupActionMessages) || false;
    var hideDeletedMessages = ((_props$configurations23 = props.configurations) === null || _props$configurations23 === void 0 ? void 0 : (_props$configurations24 = _props$configurations23.ConversationListItemConfiguration) === null || _props$configurations24 === void 0 ? void 0 : _props$configurations24.hideDeletedMessages) || false;
    var showDeleteConversation = ((_props$configurations25 = props.configurations) === null || _props$configurations25 === void 0 ? void 0 : (_props$configurations26 = _props$configurations25.ConversationListItemConfiguration) === null || _props$configurations26 === void 0 ? void 0 : _props$configurations26.showDeleteConversation) || true;
    var border = "1px solid rgba(20, 20, 20, 10%)";

    if (((_props$configurations27 = props.configurations) === null || _props$configurations27 === void 0 ? void 0 : (_props$configurations28 = _props$configurations27.ConversationListItemConfiguration) === null || _props$configurations28 === void 0 ? void 0 : _props$configurations28.borderWidth) !== undefined && ((_props$configurations29 = props.configurations) === null || _props$configurations29 === void 0 ? void 0 : (_props$configurations30 = _props$configurations29.ConversationListItemConfiguration) === null || _props$configurations30 === void 0 ? void 0 : _props$configurations30.borderStyle) !== undefined) {
      var _props$configurations31, _props$configurations32, _props$configurations33, _props$configurations34;

      var borderWidth = (_props$configurations31 = props.configurations) === null || _props$configurations31 === void 0 ? void 0 : (_props$configurations32 = _props$configurations31.ConversationListItemConfiguration) === null || _props$configurations32 === void 0 ? void 0 : _props$configurations32.borderWidth;
      var borderStyle = (_props$configurations33 = props.configurations) === null || _props$configurations33 === void 0 ? void 0 : (_props$configurations34 = _props$configurations33.ConversationListItemConfiguration) === null || _props$configurations34 === void 0 ? void 0 : _props$configurations34.borderStyle;
      border = "".concat(borderWidth, " ").concat(borderStyle, " rgba(20, 20, 20, 10%)");
    }

    var isActive = (conversation === null || conversation === void 0 ? void 0 : conversation.conversationId) === (props === null || props === void 0 ? void 0 : (_props$activeConversa3 = props.activeConversation) === null || _props$activeConversa3 === void 0 ? void 0 : _props$activeConversa3.conversationId) ? true : false;
    return /*#__PURE__*/_react.default.createElement(_.CometChatConversationListItem, {
      border: border,
      conversation: conversation,
      isActive: isActive,
      background: background,
      hideAvatar: hideAvatar,
      hideStatusIndicator: hideStatusIndicator,
      hideUnreadCount: hideUnreadCount,
      hideReceipt: hideReceipt,
      showTypingIndicator: showTypingIndicator,
      typingIndicatorText: typingIndicatorText,
      hideThreadIndicator: hideThreadIndicator,
      threadIndicatorText: (0, _.localize)("IN_A_THREAD"),
      hideGroupActionMessages: hideGroupActionMessages,
      hideDeletedMessages: hideDeletedMessages,
      showDeleteConversation: showDeleteConversation,
      key: conversation.conversationId,
      configurations: (_props$configurations35 = props.configurations) === null || _props$configurations35 === void 0 ? void 0 : _props$configurations35.ConversationListItemConfiguration
    });
  });
  return /*#__PURE__*/_react.default.createElement("div", {
    className: "conversationlist",
    style: {
      width: "100%",
      height: "100%"
    }
  }, getMessage(), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatsListStyle)(background),
    className: "chats__list",
    onScroll: handleScroll,
    onClick: clickHandler
  }, renderItems));
});

exports.CometChatConversationList = CometChatConversationList;
CometChatConversationList.propTypes = {
  /** Background of the list, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
  background: _propTypes.default.string,

  /** Active conversation object */
  activeConversation: _propTypes.default.object,

  /** CometChat loggedin user object */
  loggedInUser: _propTypes.default.object,

  /** Filter conversation list, fetch only user/group conversations */
  conversationType: _propTypes.default.oneOf(["users", "groups", "both"]),

  /** Configurable options of child component */
  configurations: _propTypes.default.object
};
CometChatConversationList.defaultProps = {
  background: "transparent",
  loggedInUser: null,
  conversationType: "both",
  activeConversation: null,
  configurations: null
};