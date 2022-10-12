import { CometChatMessageCategories } from "./CometChatMessageCategories";
import { CometChatMessageTypes } from "./CometChatMessageTypes";
import { CometChatCustomMessageTypes } from "./CometChatCustomMessageTypes";
import { CometChatCustomMessageOptions } from "./CometChatCustomMessageOptions";
import { CometChatMessageOptions } from "./CometChatMessageOptions";
import { CometChatMessageReceiverType } from "./CometChatMessageReceiverType";

const messageConstants = {
  maximumNumOfMessages: 1000,
  liveReactionTimeout: 1500,
};

const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

export const emailPattern = new RegExp(
  wordBoundary.start +
    `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
    wordBoundary.end,
  "gi"
);

export const urlPattern = new RegExp(
  wordBoundary.start +
    `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
    wordBoundary.end,
  "gi"
);

export const phoneNumPattern = new RegExp(
  wordBoundary.start +
    `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
    wordBoundary.end,
  "gi"
);

// const CONSTANTS = {
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

const messageAlignment = Object.freeze({
  leftAligned: "leftAligned",
  standard: "standard",
});

const messageBubbleAlignment = Object.freeze({
  left: "left",
  right: "right",
  center: "center",
});

const messageTimeAlignment = Object.freeze({
  top: "top",
  bottom: "bottom",
});

const messageStatus = Object.freeze({
  inprogress: "inprogress",
  success: "success",
});

export {
  CometChatMessageReceiverType,
  messageConstants,
  messageAlignment,
  messageTimeAlignment,
  messageStatus,
  messageBubbleAlignment,
};

export {
  CometChatMessageCategories,
  CometChatMessageTypes,
  CometChatCustomMessageTypes,
  CometChatMessageOptions,
  CometChatCustomMessageOptions,
};
