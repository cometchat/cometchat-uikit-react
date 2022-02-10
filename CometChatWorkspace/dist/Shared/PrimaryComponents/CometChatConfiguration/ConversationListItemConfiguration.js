"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConversationListItemConfiguration = void 0;

var _ = require("./");

var ConversationListItemConfiguration = function ConversationListItemConfiguration() {
  this.borderWidth = "0 0 1px 0";
  this.borderStyle = "solid";
  this.background = "transparent";
  this.hideStatusIndicator = false;
  this.hideAvatar = false;
  this.hideUnreadCount = false;
  this.hideReceipt = false;
  this.showTypingIndicator = true;
  this.hideThreadIndicator = false;
  this.hideGroupActionMessages = false;
  this.hideDeletedMessages = false;
  this.showDeleteConversation = true;
  this.avatarConfiguration = new _.AvatarConfiguration();
  this.badgeCountConfiguration = new _.BadgeCountConfiguration();
  this.statusIndicatorConfiguration = new _.StatusIndicatorConfiguration();
  this.messageReceiptConfiguration = new _.MessageReceiptConfiguration();
};

exports.ConversationListItemConfiguration = ConversationListItemConfiguration;