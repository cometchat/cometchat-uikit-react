import { AvatarConfiguration, BadgeCountConfiguration, StatusIndicatorConfiguration, MessageReceiptConfiguration } from "./";

const ConversationListItemConfiguration = function() {
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
	this.avatarConfiguration = new AvatarConfiguration();
	this.badgeCountConfiguration = new BadgeCountConfiguration();
	this.statusIndicatorConfiguration = new StatusIndicatorConfiguration();
	this.messageReceiptConfiguration = new MessageReceiptConfiguration();
}

export { ConversationListItemConfiguration };