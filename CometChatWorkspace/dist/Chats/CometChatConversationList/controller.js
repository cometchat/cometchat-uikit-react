"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConversationListManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var ConversationListManager = /*#__PURE__*/function () {
  function ConversationListManager(props) {
    (0, _classCallCheck2.default)(this, ConversationListManager);
    (0, _defineProperty2.default)(this, "conversationRequest", null);
    (0, _defineProperty2.default)(this, "conversationListenerId", "chatlist_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "userListenerId", "chatlist_user_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "groupListenerId", "chatlist_group_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "callListenerId", "chatlist_call_" + new Date().getTime());

    switch (props.conversationType) {
      case _.conversationType["users"]:
        this.conversationRequest = new _chat.CometChat.ConversationsRequestBuilder().setConversationType(_chat.CometChat.ACTION_TYPE.TYPE_USER).setLimit(30).build();
        break;

      case _.conversationType["groups"]:
        this.conversationRequest = new _chat.CometChat.ConversationsRequestBuilder().setConversationType(_chat.CometChat.ACTION_TYPE.TYPE_GROUP).setLimit(30).build();
        break;

      default:
        this.conversationRequest = new _chat.CometChat.ConversationsRequestBuilder().setLimit(30).build();
        break;
    }
  }

  (0, _createClass2.default)(ConversationListManager, [{
    key: "fetchNextConversation",
    value: function fetchNextConversation() {
      return this.conversationRequest.fetchNext();
    }
  }, {
    key: "attachListeners",
    value: function attachListeners(callback) {
      _chat.CometChat.addUserListener(this.userListenerId, new _chat.CometChat.UserListener({
        onUserOnline: function onUserOnline(onlineUser) {
          /* when someuser/friend comes online, user will be received here */
          callback("onUserOnline", onlineUser);
        },
        onUserOffline: function onUserOffline(offlineUser) {
          /* when someuser/friend went offline, user will be received here */
          callback("onUserOffline", offlineUser);
        }
      }));

      _chat.CometChat.addGroupListener(this.groupListenerId, new _chat.CometChat.GroupListener({
        onGroupMemberScopeChanged: function onGroupMemberScopeChanged(message, changedUser, newScope, oldScope, changedGroup) {
          callback("onGroupMemberScopeChanged", message, changedUser, newScope, oldScope, changedGroup);
        },
        onGroupMemberKicked: function onGroupMemberKicked(message, kickedUser, kickedBy, kickedFrom) {
          callback("onGroupMemberKicked", message, kickedUser, kickedBy, kickedFrom);
        },
        onGroupMemberLeft: function onGroupMemberLeft(message, leavingUser, group) {
          callback("onGroupMemberLeft", message, leavingUser, null, group);
        },
        onGroupMemberBanned: function onGroupMemberBanned(message, bannedUser, bannedBy, bannedFrom) {
          callback("onGroupMemberBanned", message, bannedUser, bannedBy, bannedFrom);
        },
        onMemberAddedToGroup: function onMemberAddedToGroup(message, userAdded, userAddedBy, userAddedIn) {
          callback("onMemberAddedToGroup", message, userAdded, userAddedBy, userAddedIn);
        },
        onGroupMemberJoined: function onGroupMemberJoined(message, joinedUser, joinedGroup) {
          callback("onGroupMemberJoined", message, joinedUser, null, joinedGroup);
        }
      }));

      _chat.CometChat.addMessageListener(this.conversationListenerId, new _chat.CometChat.MessageListener({
        onTextMessageReceived: function onTextMessageReceived(textMessage) {
          callback("onTextMessageReceived", textMessage);
        },
        onMediaMessageReceived: function onMediaMessageReceived(mediaMessage) {
          callback("onMediaMessageReceived", mediaMessage);
        },
        onCustomMessageReceived: function onCustomMessageReceived(customMessage) {
          callback("onCustomMessageReceived", customMessage);
        },
        onMessageDeleted: function onMessageDeleted(deletedMessage) {
          callback("onMessageDeleted", deletedMessage);
        },
        onMessageEdited: function onMessageEdited(editedMessage) {
          callback("onMessageEdited", editedMessage);
        },
        onMessagesRead: function onMessagesRead(messageReceipt) {
          callback("onMessagesRead", messageReceipt);
        },
        onTypingStarted: function onTypingStarted(typingIndicator) {
          callback("onTypingStarted", typingIndicator, true);
        },
        onTypingEnded: function onTypingEnded(typingIndicator) {
          callback("onTypingEnded", typingIndicator, false);
        }
      }));

      _chat.CometChat.addCallListener(this.callListenerId, new _chat.CometChat.CallListener({
        onIncomingCallReceived: function onIncomingCallReceived(call) {
          callback("onIncomingCallReceived", call);
        },
        onIncomingCallCancelled: function onIncomingCallCancelled(call) {
          callback("onIncomingCallCancelled", call);
        }
      }));
    }
  }, {
    key: "removeListeners",
    value: function removeListeners() {
      _chat.CometChat.removeMessageListener(this.conversationListenerId);

      _chat.CometChat.removeUserListener(this.userListenerId);

      _chat.CometChat.removeGroupListener(this.groupListenerId);

      _chat.CometChat.removeCallListener(this.callListenerId);
    }
  }]);
  return ConversationListManager;
}();

exports.ConversationListManager = ConversationListManager;