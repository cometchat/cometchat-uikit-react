export const TEXT_MESSAGE_RECEIVED = 'onTextMessageReceived';
export const MEDIA_MESSAGE_RECEIVED = 'onMediaMessageReceived';
export const CUSTOM_MESSAGE_RECEIVED = 'onCustomMessageReceived';
export const MESSAGE_DELIVERED = 'onMessagesDelivered';
export const MESSAGE_READ = 'onMessagesRead';
export const MESSAGE_DELETED = 'onMessageDeleted';
export const MESSAGE_EDITED = 'onMessageEdited';
export const TRANSIENT_MESSAGE_RECEIVED = "onTransientMessageReceived";

export const INCOMING_CALL_RECEIVED = 'onIncomingCallReceived';
export const OUTGOING_CALL_ACCEPTED = 'onOutgoingCallAccepted';
export const OUTGOING_CALL_REJECTED = 'onOutgoingCallRejected';
export const INCOMING_CALL_CANCELLED = 'onIncomingCallCancelled';

export const GROUP_MEMBER_SCOPE_CHANGED = "onGroupMemberScopeChanged";
export const GROUP_MEMBER_KICKED = "onGroupMemberKicked";
export const GROUP_MEMBER_BANNED = "onGroupMemberBanned";
export const GROUP_MEMBER_UNBANNED = "onGroupMemberUnbanned";
export const GROUP_MEMBER_ADDED = "onMemberAddedToGroup";
export const GROUP_MEMBER_LEFT = "onGroupMemberLeft";
export const GROUP_MEMBER_JOINED = "onGroupMemberJoined";

export const USER_ONLINE = "onUserOnline";
export const USER_OFFLINE = "onUserOffline";

export const TYPING_STARTED = "onTypingStarted";
export const TYPING_ENDED = "onTypingEnded";

export const CUSTOM_TYPE_POLL = "extension_poll";
export const CUSTOM_TYPE_STICKER = "extension_sticker";
export const CUSTOM_TYPE_DOCUMENT = "extension_document";
export const CUSTOM_TYPE_WHITEBOARD = "extension_whiteboard";
export const CUSTOM_TYPE_MEETING = "meeting";

export const CONSTANTS = {
	LOCALE: "cometchat:locale",
	ACTIVECALL: "cometchat:activecall",
	MAX_MESSAGE_COUNT: 1000,
	METADATA_TYPE_LIVEREACTION: "live_reaction",
	LIVE_REACTIONS: { heart: "./resources/heart.png", thumbsup: "👍", clap: "👏", wink: "😉" },
	MESSAGES_COMPONENT: "messages",
	EMBEDDED_COMPONENT: "embedded",
	OUTGOING_DEFAULT_CALLING: "outgoing_default",
	INCOMING_DEFAULT_CALLING: "incoming_default",
	INCOMING_DIRECT_CALLING: "incoming_direct",
	OUTGOING_DIRECT_CALLING: "outgoing_direct",
	AUDIO: {
		INCOMING_MESSAGE: "incomingMessage",
		INCOMING_OTHER_MESSAGE: "incomingOtherMessage",
		OUTGOING_MESSAGE: "outgoingMessage",
		INCOMING_CALL: "incomingCall",
		OUTGOING_CALL: "outgoingCall",
	},
	ERROR_CODES: {
		ERR_CHAT_API_FAILURE: "ERR_CHAT_API_FAILURE",
	},
	CALLS: {
		ONGOING_CALL: "noOngoingCall",
		ONGOING_CALL_SAME_GROUP: "ongoingDirectCallInSameGroup",
		ONGOING_CALL_DIFF_GROUP: "ongoingDirectCallInDifferentGroup",
	},
	GROUPS: {
		OWNER: "owner",
	},
	LIVE_REACTION_INTERVAL: 1500,
	FILE_METADATA: "file",
};

export const ACTIONS = {
	MESSAGE_SENT: "messageSent",
	MESSAGE_COMPOSED: "messageComposed",
	ERROR_IN_SENDING_MESSAGE: "errorInSendingMessage",
	ACCEPT_DIRECT_CALL: "acceptDirectCall",
	JOIN_DIRECT_CALL: "joinDirectCall",
	START_DIRECT_CALL: "startDirectCall",
	DIRECT_CALL_ENDED: "directCallEnded",
	POLL_CREATED: "pollCreated",
	GROUP_DELETED: "groupDeleted",
	GROUP_LEFT: "leftGroup",
	GROUP_CREATED: "groupCreated",
	VIEW_DETAIL: "viewDetail",
	VIEW_THREADED_MESSAGE: "viewThreadedMessage",
	CLOSE_THREADED_MESSAGE: "closeThreadedMessage",
	TOGGLE_SIDEBAR: "toggleSidebar",
	ON_MESSAGE_EDITED: "onMessageEdited",
	ON_MESSAGE_DELETED: "onMessageDeleted",
	ON_MESSAGE_READ_DELIVERED: "onMessageReadAndDelivered",
	DELETE_MESSAGE: "deleteMessage",
	MESSAGE_DELETED: "messageDeleted",
	EDIT_MESSAGE: "editMessage",
	MESSAGE_EDITED: "messageEdited",
	CLOSE_GROUP_DETAIL: "closeGroupDetail",
	CLOSE_USER_DETAIL: "closeUserDetail",
	VIEW_ORIGINAL_IMAGE: "viewOriginalImage",
	FETCH_GROUP_MEMBERS: "fetchGroupMembers",
	SCOPECHANGE_GROUPMEMBER_SUCCESS: "updateGroupMember",
	BAN_GROUP_MEMBER: "ban",
	KICK_GROUP_MEMBER: "kick",
	BAN_GROUPMEMBER_SUCCESS: "banGroupMember",
	KICK_GROUPMEMBER_SUCCESS: "kickGroupMember",
	CHANGE_SCOPE_GROUP_MEMBER: "changescope",
	UNBAN_GROUP_MEMBER: "unban",
	ADD_GROUP_MEMBER_SUCCESS: "addGroupMembers",
	FETCH_BANNED_GROUP_MEMBERS: "fetchBannedGroupMembers",
	UNBAN_GROUP_MEMBER_SUCCESS: "unbanGroupMembers",
	REACT_TO_MESSAGE: "reactToMessage",
	INITIATE_VIDEO_CALL: "initiateVideoCall",
	INITIATE_AUDIO_CALL: "initiateAudioCall",
	CHANGE_TAB: "changeTab",
	ITEM_CLICKED: "itemClicked",
	THREAD_MESSAGE_COMPOSED: "threadMessageComposed",
	SEND_LIVE_REACTION: "sendReaction",
	STOP_LIVE_REACTION: "stopReaction",
	SHOW_LIVE_REACTION: "showReaction",
	CLEAR_EDIT_PREVIEW: "clearEditPreview",
	MESSAGE_RECEIVED: "messageReceived",
	CUSTOM_MESSAGE_RECEIVED: "customMessageReceived",
	MESSAGE_READ: "messageRead",
	MESSAGES_INITIAL_FETCH: "messageInitialFetch",
	MESSAGES_FETCHED: "messageFetched",
	REFRESHING_MESSAGES: "refreshingMessages",
	MESSAGES_REFRESHED: "messageRefreshed",
	NEW_MESSAGES: "newMessagesArrived",
	CLEAR_UNREAD_MESSAGES: "clearUnreadMessages",
	START_AUDIO_CALL: "startAudioCall",
	START_VIDEO_CALL: "startVideoCall",
	OUTGOING_CALL_ACCEPTED: "outgoingCallAccepted",
	OUTGOING_CALL_REJECTED: "outgoingCallRejected",
	OUTGOING_CALL_CANCELLED: "outgoingCallCancelled",
	INCOMING_CALL_ACCEPTED: "incomingCallAccepted",
	INCOMING_CALL_REJECTED: "incomingCallRejected",
	CALL_ENDED: "callEnded",
	USER_JOINED_CALL: "userJoinedCall",
	USER_LEFT_CALL: "userLeftCall",
	DELETE_CONVERSATION: "deleteConversation",
	CONVERSATION_DELETED: "conversationDeleted",
	SEND_STICKER: "sendSticker",
	CLOSE_STICKER_KEYBOARD: "closeStickerKeyboard",
	ERROR: "errorOccurred",
	INFO: "infoMessage",
	TRANSLATE_MESSAGE: "translateMessage"
};

export const EVENTS = {
	NEW_MESSAGES: "newMessagesArrived",
	CLEAR_UNREAD_MESSAGES: "clearUnreadMessages",
};


export const KEYS = {
	METADATA: "metadata",
	INCREMENT_UNREAD_COUNT: "incrementUnreadCount",
};