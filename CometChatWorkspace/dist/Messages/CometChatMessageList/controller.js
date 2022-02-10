"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessageListManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var MessageListManager = /*#__PURE__*/function () {
  function MessageListManager(props) {
    (0, _classCallCheck2.default)(this, MessageListManager);
    (0, _defineProperty2.default)(this, "limit", 30);
    (0, _defineProperty2.default)(this, "parentMessageId", null);
    (0, _defineProperty2.default)(this, "messageRequest", null);
    (0, _defineProperty2.default)(this, "messageListenerId", "message_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "groupListenerId", "group_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "callListenerId", "call_" + new Date().getTime());
    var messageCategories = new Set();
    var messageTypes = new Set(); //if there is no message filtering set, show just text messages

    if (props.configurations.length === 0) {
      messageCategories.add(_.CometChatMessageCategories.message);
      messageTypes.add(_.CometChatMessageTypes.text);
    } //message filter applied


    props.configurations.forEach(function (eachMessageTemplate) {
      messageCategories.add(eachMessageTemplate.category);
      messageTypes.add(eachMessageTemplate.type);
    });
    var categories = Array.from(messageCategories);
    var types = Array.from(messageTypes);

    if (props.user && props.user.uid) {
      if (props.parentMessage && props.parentMessage.id) {
        this.messageRequest = new _chat.CometChat.MessagesRequestBuilder().setUID(props.user.uid).setParentMessageId(props.parentMessage.id).setCategories(categories).setTypes(types).hideDeletedMessages(props.hideDeletedMessages).setLimit(this.limit).build();
      } else {
        this.messageRequest = new _chat.CometChat.MessagesRequestBuilder().setUID(props.user.uid).setCategories(categories).setTypes(types).hideReplies(true).hideDeletedMessages(props.hideDeletedMessages).setLimit(this.limit).build();
      }
    } else if (props.group && props.group.guid) {
      if (props.parentMessage && props.parentMessage.id) {
        this.messageRequest = new _chat.CometChat.MessagesRequestBuilder().setGUID(props.group.guid).setParentMessageId(props.parentMessage.id).setCategories(categories).setTypes(types).hideDeletedMessages(props.hideDeletedMessages).setLimit(this.limit).build();
      } else {
        this.messageRequest = new _chat.CometChat.MessagesRequestBuilder().setGUID(props.group.guid).setCategories(categories).setTypes(types).hideReplies(true).hideDeletedMessages(props.hideDeletedMessages).setLimit(this.limit).build();
      }
    }
  }

  (0, _createClass2.default)(MessageListManager, [{
    key: "fetchPreviousMessages",
    value: function fetchPreviousMessages() {
      return this.messageRequest.fetchPrevious();
    }
  }, {
    key: "attachListeners",
    value: function attachListeners(callback) {
      _chat.CometChat.addMessageListener(this.messageListenerId, new _chat.CometChat.MessageListener({
        onTextMessageReceived: function onTextMessageReceived(textMessage) {
          callback("onTextMessageReceived", textMessage);
        },
        onMediaMessageReceived: function onMediaMessageReceived(mediaMessage) {
          callback("onMediaMessageReceived", mediaMessage);
        },
        onCustomMessageReceived: function onCustomMessageReceived(customMessage) {
          callback("onCustomMessageReceived", customMessage);
        },
        onMessagesDelivered: function onMessagesDelivered(messageReceipt) {
          callback("onMessagesDelivered", messageReceipt);
        },
        onMessagesRead: function onMessagesRead(messageReceipt) {
          callback("onMessagesRead", messageReceipt);
        },
        onMessageDeleted: function onMessageDeleted(deletedMessage) {
          callback("onMessageDeleted", deletedMessage);
        },
        onMessageEdited: function onMessageEdited(editedMessage) {
          callback("onMessageEdited", editedMessage);
        }
      }));

      _chat.CometChat.addGroupListener(this.groupListenerId, new _chat.CometChat.GroupListener({
        onGroupMemberScopeChanged: function onGroupMemberScopeChanged(message, changedUser, newScope, oldScope, changedGroup) {
          callback("onGroupMemberScopeChanged", message, changedUser, newScope, oldScope, changedGroup);
        },
        onGroupMemberLeft: function onGroupMemberLeft(message, leavingUser, group) {
          callback("onGroupMemberLeft", message, leavingUser, group);
        },
        onGroupMemberKicked: function onGroupMemberKicked(message, kickedUser, kickedBy, kickedFrom) {
          callback("onGroupMemberKicked", message, kickedUser, kickedBy, kickedFrom);
        },
        onGroupMemberBanned: function onGroupMemberBanned(message, bannedUser, bannedBy, bannedFrom) {
          callback("onGroupMemberBanned", message, bannedUser, bannedBy, bannedFrom);
        },
        onGroupMemberUnbanned: function onGroupMemberUnbanned(message, unbannedUser, unbannedBy, unbannedFrom) {
          callback("onGroupMemberUnbanned", message, unbannedUser, unbannedBy, unbannedFrom);
        },
        onMemberAddedToGroup: function onMemberAddedToGroup(message, userAdded, userAddedBy, userAddedIn) {
          callback("onMemberAddedToGroup", message, userAdded, userAddedBy, userAddedIn);
        },
        onGroupMemberJoined: function onGroupMemberJoined(message, joinedUser, joinedGroup) {
          callback("onGroupMemberJoined", message, joinedUser, null, joinedGroup);
        }
      }));

      _chat.CometChat.addCallListener(this.callListenerId, new _chat.CometChat.CallListener({
        onIncomingCallReceived: function onIncomingCallReceived(call) {
          callback("onIncomingCallReceived", call);
        },
        onIncomingCallCancelled: function onIncomingCallCancelled(call) {
          callback("onIncomingCallCancelled", call);
        },
        onOutgoingCallAccepted: function onOutgoingCallAccepted(call) {
          callback("onOutgoingCallAccepted", call);
        },
        onOutgoingCallRejected: function onOutgoingCallRejected(call) {
          callback("onOutgoingCallAccepted", call);
        }
      }));
    }
  }, {
    key: "removeListeners",
    value: function removeListeners() {
      _chat.CometChat.removeMessageListener(this.messageListenerId);

      _chat.CometChat.removeGroupListener(this.groupListenerId);

      _chat.CometChat.removeCallListener(this.callListenerId);
    }
  }]);
  return MessageListManager;
}();

exports.MessageListManager = MessageListManager;