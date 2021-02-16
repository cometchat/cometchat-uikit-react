export const USER_JOINED = 'onUserJoined';
export const USER_LEFT = 'onUserLeft';

export const TEXT_MESSAGE_RECEIVED = 'onTextMessageReceived';
export const MEDIA_MESSAGE_RECEIVED = 'onMediaMessageReceived';
export const CUSTOM_MESSAGE_RECEIVED = 'onCustomMessageReceived';
export const MESSAGE_DELIVERED = 'onMessagesDelivered';
export const MESSAGE_READ = 'onMessagesRead';
export const MESSAGE_DELETED = 'onMessageDeleted';
export const MESSAGE_EDITED = 'onMessageEdited';

export const INCOMING_CALL_RECEIVED = 'onIncomingCallReceived';
export const OUTGOING_CALL_ACCEPTED = 'onOutgoingCallAccepted';
export const OUTGOING_CALL_REJECTED = 'onOutgoingCallRejected';
export const INCOMING_CALL_CANCELLED = 'onIncomingCallCancelled';

export const CALL_ENDED = 'onCallEnded';

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

export const CATEGORY_MESSAGE = "message";
export const MESSAGE_TYPE_TEXT = "text";
export const MESSAGE_TYPE_IMAGE = "image";
export const MESSAGE_TYPE_VIDEO = "video";
export const MESSAGE_TYPE_AUDIO = "audio";
export const MESSAGE_TYPE_FILE = "file";

export const CATEGORY_CUSTOM = "custom";
export const CUSTOM_TYPE_POLL = "extension_poll";
export const CUSTOM_TYPE_STICKER = "extension_sticker";
export const CUSTOM_TYPE_DOCUMENT = "extension_document";
export const CUSTOM_TYPE_WHITEBOARD = "extension_whiteboard";
export const CUSTOM_TYPE_MEETING = "meeting";

export const CATEGORY_ACTION = "action";
export const ACTION_TYPE_GROUPMEMBER = "groupMember";
export const ACTION_TYPE_MESSAGE = "message";

export const CATEGORY_CALL = "call";
export const CALL_TYPE_AUDIO = "audio";
export const CALL_TYPE_VIDEO = "video";

export const LIVE_REACTION_KEY = "live_reaction";
export const LIVE_REACTIONS = { "heart": "./resources/heart.png", "thumbsup": "👍", "clap": "👏", "wink": "😉" };
export const MAX_MESSAGE_COUNT = 100;
export const LOCALE_KEY = "cometchat:locale";



export const CHAT_WITH_USER = "user";
export const CHAT_WITH_GROUP = "group";

export const ACTIONS = {
    MESSAGE_SENT: "messageSent",
    MESSAGE_COMPOSED: "messageComposed",
    ERROR_IN_SENDING_MESSAGE: "errorInSendingMessage",
    ACCEPT_DIRECT_CALL: "acceptDirectCall",
    JOIN_DIRECT_CALL: "joinDirectCall",
    START_DIRECT_CALL: "startDirectCall",
    END_DIRECT_CALL: "endDirectCall",
    POLL_CREATED: "pollCreated",
    GROUP_DELETED: "groupDeleted",
    GROUP_LEFT: "leftGroup",
    GROUP_CREATED: "groupCreated"
}