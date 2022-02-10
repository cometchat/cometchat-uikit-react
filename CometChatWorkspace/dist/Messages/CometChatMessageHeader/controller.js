"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessageHeaderManager = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _chat = require("@cometchat-pro/chat");

var MessageHeaderManager = /*#__PURE__*/function () {
  function MessageHeaderManager() {
    (0, _classCallCheck2.default)(this, MessageHeaderManager);
    (0, _defineProperty2.default)(this, "userListenerId", "head_user_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "msgListenerId", "head_message_" + new Date().getTime());
    (0, _defineProperty2.default)(this, "groupListenerId", "head_group_" + new Date().getTime());
  }

  (0, _createClass2.default)(MessageHeaderManager, [{
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

      _chat.CometChat.addMessageListener(this.msgListenerId, new _chat.CometChat.MessageListener({
        onTypingStarted: function onTypingStarted(typingIndicator) {
          callback("onTypingStarted", typingIndicator);
        },
        onTypingEnded: function onTypingEnded(typingIndicator) {
          callback("onTypingEnded", typingIndicator);
        }
      }));

      _chat.CometChat.addGroupListener(this.groupListenerId, new _chat.CometChat.GroupListener({
        onGroupMemberKicked: function onGroupMemberKicked(message, kickedUser, kickedBy, kickedFrom) {
          callback("onGroupMemberKicked", kickedFrom, kickedUser);
        },
        onGroupMemberBanned: function onGroupMemberBanned(message, bannedUser, bannedBy, bannedFrom) {
          callback("onGroupMemberBanned", bannedFrom, bannedUser);
        },
        onMemberAddedToGroup: function onMemberAddedToGroup(message, userAdded, userAddedBy, userAddedIn) {
          callback("onMemberAddedToGroup", userAddedIn);
        },
        onGroupMemberLeft: function onGroupMemberLeft(message, leavingUser, group) {
          callback("onGroupMemberLeft", group, leavingUser);
        },
        onGroupMemberJoined: function onGroupMemberJoined(message, joinedUser, joinedGroup) {
          callback("onGroupMemberJoined", joinedGroup);
        }
      }));
    }
  }, {
    key: "removeListeners",
    value: function removeListeners() {
      _chat.CometChat.removeUserListener(this.userListenerId);

      _chat.CometChat.removeMessageListener(this.msgListenerId);

      _chat.CometChat.removeGroupListener(this.groupListenerId);
    }
  }]);
  return MessageHeaderManager;
}();

exports.MessageHeaderManager = MessageHeaderManager;