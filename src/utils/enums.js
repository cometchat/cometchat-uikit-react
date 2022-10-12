export const USER_JOINED = "onUserJoined";
export const USER_LEFT = "onUserLeft";

export const TEXT_MESSAGE_RECEIVED = "onTextMessageReceived";
export const MEDIA_MESSAGE_RECEIVED = "onMediaMessageReceived";
export const CUSTOM_MESSAGE_RECEIVED = "onCustomMessageReceived";
export const MESSAGE_DELIVERED = "onMessagesDelivered";
export const MESSAGE_READ = "onMessagesRead";
export const MESSAGE_DELETED = "onMessageDeleted";
export const MESSAGE_EDITED = "onMessageEdited";
export const MESSAGE_SENT = "messageSent";
export const DIRECT_CALL = "directCall";
export const CALL_TYPE_DIRECT = "DIRECT_CALL";
export const SESSION_ID = "sessionid";
export const DIRECT_CALL_ENDED = "directcallended";
export const DIRECT_CALL_STARTED = "directcallstarted";
export const START_DIRECT_CALL = "startdirectcall";
export const INCOMING_DIRECT_CALL = "incomingdirectCall";
export const OUTGOING_DIRECT_CALL = "outgoingdirectCall";
export const REPLY_PREVIEW = "replyPreview";
export const MESSAGE_OBJECT = "messageObject";

export const INCOMING_CALL_RECEIVED = "onIncomingCallReceived";
export const OUTGOING_CALL_ACCEPTED = "onOutgoingCallAccepted";
export const OUTGOING_CALL_REJECTED = "onOutgoingCallRejected";
export const INCOMING_CALL_CANCELLED = "onIncomingCallCancelled";

export const CALL_ENDED = "onCallEnded";

export const GROUP_MEMBER_SCOPE_CHANGED = "onGroupMemberScopeChanged";
export const GROUP_MEMBER_KICKED = "onGroupMemberKicked";
export const GROUP_MEMBER_BANNED = "onGroupMemberBanned";
export const GROUP_MEMBER_UNBANNED = "onGroupMemberUnbanned";
export const GROUP_MEMBER_ADDED = "onMemberAddedToGroup";
export const GROUP_MEMBER_LEFT = "onGroupMemberLeft";
export const GROUP_MEMBER_JOINED = "onGroupMemberJoined";

export const USER_ONLINE = "onUserOnline";

export const USER = "user";
export const GROUP = "group";
export const USER_OFFLINE = "onUserOffline";

export const TYPING_STARTED = "onTypingStarted";
export const TYPING_ENDED = "onTypingEnded";

export const CUSTOM_TYPE_POLL = "extension_poll";
export const CUSTOM_TYPE_STICKER = "extension_sticker";

export const ACTION_TYPE_GROUPMEMBER = "groupMember";

export const LIVE_REACTION_KEY = "live_reaction";
export const LIVE_REACTIONS = {
  heart: "./resources/heart.png",
  thumbsup: "👍",
  clap: "👏",
  wink: "😉",
};

export const LEFT_GROUP = "leftGroup";
export const DELETE_GROUP = "groupDeleted";

export const SEND_SMART_REPLY = "sendSmartReply";
export const SEND_STICKER = "sendSticker";
export const CLOSE_STICKER = "closeSticker";

export const CUSTOM_MESSAGE_RECEIVE = "customMessageReceived";
export const MESSAGE_RECEIVED = "messageReceived";
export const MESSAGE_FETCHED = "messageFetched";
export const MESSAGE_FETCHED_AGAIN = "messageFetchedAgain";
export const OLDER_MESSAGES_FETCHED = "olderMessagesFetched";
export const MESSAGE_COMPOSED = "messageComposed";
export const MESSAGE_UPDATED = "messageUpdated";
export const THREAD_PARENT_MESSAGE_UPDATED = "threadParentMessageUpdated";
export const EDIT = "edit";
export const DELETE = "delete";
export const VIEW_ACTUAL_IMAGE = "viewActualImage";
export const NEW_CONVERSATION_OPENED = "newConversationOpened";
export const VIEW_MESSAGE_THREAD = "viewMessageThread";
export const DELETE_MESSAGE = "deleteMessage";
export const EDIT_MESSAGE = "editMessage";
export const MESSAGE_EDIT = "messageEdited";
export const AUDIO_CALL = "audioCall";
export const VIDEO_CALL = "videoCall";
export const VIEW_DETAIL = "viewDetail";
export const MENU_CLICKED = "menuClicked";
export const SEND_REACTION = "sendReaction";
export const SHOW_REACTION = "showReaction";
export const STOP_REACTION = "stopReaction";
export const CLEAR_MESSAGE_TO_BE_UPDATED = "clearMessageToBeEdited";
export const MESSAGE_DELETE = "messageDeleted";

export const CLOSE_THREAD_CLICKED = "closeThreadClicked";
export const CLOSE_FULL_SCREEN_IMAGE = "closeFullScreenImage";
export const CLOSE_DETAIL_CLICKED = "closeDetailClicked";
export const CHANGE_THREAD_PARENT_MESSAGE_REPLY_COUNT =
  "changeThreadParentMessageReplyCount";
export const BLOCK_USER = "blockUser";
export const UNBLOCK_USER = "unblockUser";

export const CLOSE_POLL_VIEW = "closePollView";

export const POLL_CREATED = "pollCreated";
export const POLL_ANSWERED = "pollAnswered";

export const CLOSE_CREATE_GROUP_VIEW = "closeCreateGroupView";
export const GROUP_CREATED = "groupCreated";

export const PUBLIC_GROUP = "public";
export const PRIVATE_GROUP = "private";
export const PROTECTED_GROUP = "protected";
export const MEMBER_SCOPE_CHANGED = "memberScopeChanged";
export const MEMBERS_ADDED = "membersAdded";
export const MEMBERS_UPDATED = "membersUpdated";
export const MEMBER_UPDATED = "memberUpdated";
export const GROUP_UPDATED = "groupUpdated";

export const OPEN_VIEW_MEMBER = "openViewMember";
export const CLOSE_ADD_VIEW_MEMBER = "closeAddMembersView";
export const UPDATE_GROUP_PARTICIPANTS = "updateGroupParticipants";
export const ADD_GROUP_PARTICIPANTS = "addGroupParticipants";
export const REMOVE_GROUP_PARTICIPANTS = "removeGroupParticipants";

export const CHANGE_SCOPE = "changescope";
export const BAN = "ban";
export const KICK = "kick";

export const CLOSE_MENU_CLICKED = "closeMenuClicked";

export const ACCEPT_INCOMING_CALL = "acceptIncomingCall";
export const ACCEPTED_INCOMING_CALL = "acceptedIncomingCall";
export const REJECTED_INCOMING_CALL = "rejectedIncomingCall";
export const CALL_UPDATED = "callUpdated";
export const OUT_GOING_CALL_REJECTED = "outgoingCallRejected";
export const USER_JOINED_CALL = "userJoinedCall";
export const USER_LEFT_CALL = "userLeftCall";
export const CALL_ENDED_BY_USER = "callEnded";
export const CALL_ERROR = "callError";
export const OUTGOING_CALL_CANCELLED = "outgoingCallCancelled";
export const BAN_MEMBER = "banmember";
export const UNBAN_GROUP_MEMBERS = "unbanGroupMembers";
export const UNBAN = "unban";
export const FETCH_BANNED_MEMBERS = "fetchBannedMembers";
export const MEMBER_UNBANNED = "memberUnbanned";

export const REACT_TO_MESSAGE = "reactToMessage";
export const MESSAGE__READ = "messageRead";

export const TAB_CHANGED = "tabChanged";

//New

export const ANSWER_WRAPPER_STYLE = "answerWrapperStyle";

export const APP_SYSTEM = "app_system";
export const SENDER = "sender";
export const RECEIVER = "receiver";

export const STICKERS = "stickers";

export const GET = "GET";
export const POST = "POST";
export const V1_FETCH = "v1/fetch";
export const V1_CREATE = "v1/create";
export const V1_VOTE = "v1/vote";
export const V1_REACT = "v1/react";
export const V2_CREATE = "v2/create";
export const V2_VOTE = "v2/vote";

export const POLLS = "polls";
export const REACTIONS = "reactions";
export const LINKS = "links";
export const LINK_PREVIEW = "link-preview";
export const REPLY_MESSAGE_PRIVATELY = "replyPrivately";
export const EXTENSIONS = "extensions";
export const VOTERS = "voters";
export const DATA = "data";
export const STICKER_URL = "sticker_url";
export const STICKER_NAME = "sticker_name";
export const STICKER = "Sticker";
export const CUSTOM_DATA = "customData";
export const SMART_REPLY = "smart-reply";
export const REPLY_POSITIVE = "reply_positive";
export const REPLY_NEUTRAL = "reply_neutral";
export const REPLY_NEGATIVE = "reply_negative";
export const READ_AT = "readAt";
export const STATUS = "status";
export const GUID = "guid";
export const UID = "uid";

export const DECREMENT = "decrement";
export const SUCCESS = "success";

export const CONVERSATION_LIST = "conversationList";
export const GROUP_LIST = "groupList";
export const USER_LIST = "userList";
export const INFO_SCREEN = "infoScreen";
export const CONVERSATION_WITH = "conversationWith";

export const INCOMING_CALL_ = "incoming_call_";
export const Boolean = "boolean";
export const ENDED = "ended";
export const OUTGOING_CALL = "outgoingCall";
export const INCOMING_CALL = "incomingCall";
export const LEFT = "left";
export const CALL_SCREEN_ = "callscreen_";
export const CHAT_LIST_ = "chatlist_";
export const CHAT_LIST_USER_ = "chatlist_user_";
export const CHAT_LIST_GROUP_ = "chatlist_group_";
export const CHAT_LIST_CALL_ = "chatlist_call_";
export const DESTROYED = "destroyed";
export const ITEM = "item";
export const GROUP_TO_UPDATE = "groupToUpdate";
export const SCOPE = "scope";
export const MEMBERS_COUNT = "membersCount";
export const GROUP_TO_LEAVE = "groupToLeave";
export const GROUP_TO_DELETE = "groupToDelete";
export const LAST_MESSAGE = "lastMessage";
export const CONVERSATION_DETAILS = "conversationDetails";
export const DELETED_AT = "deletedAt";
export const SENT_AT = "sentAt";
export const USER_LIST_ = "userlist_";
export const TYPE = "type";
export const ADD = "add";
export const GROUP_DETAIL_USER_ = "group_detail_user_";
export const GROUP_DETAIL_GROUP_ = "group_detail_group_";
export const GROUP_LIST_ = "grouplist_";
export const HAS_JOINED = "hasJoined";
export const PARENT_MESSAGE_ID = "parentMessageId";
export const MESSAGE_TO_BE_EDITED = "messageToBeEdited";
export const MESSAGE_TO_REACT = "messageToReact";
export const LOAD = "load";
export const HEAD_USER_ = "head_user_";
export const HEAD_MESSAGE_ = "head_message_";
export const HEAD_GROUP_ = "head_group_";

export const MESSAGE_ = "message_";
export const GROUP_ = "group_";
export const CALL_ = "call_";
export const REACHED_TOP_OF_CONVERSATION = "reachedTopOfConversation";
export const MESSAGED = "messages";
export const DELIVERY = "delivery";
export const READ = "read";
export const METADATA = "metadata";
export const INJECTED = "@injected";
export const ERROR = "error";
export const PARENT_MESSAGE = "parentMessage";
export const REPLY_COUNT = "replyCount";
export const COMPOSED_THREAD_MESSAGE = "composedThreadMessage";
export const GROUP_MESSAGE = "groupMessage";
export const CALL_MESSAGE = "callMessage";
export const REACTION = "reaction";
export const DELIVERED_AT = "deliveredAt";
export const THUMBNAIL_GENERATION = "thumbnail-generation";
export const URL_SMALL = "url_small";
export const URL_MEDIUM = "url_medium";
export const BLOB = "blob";
export const CUSTOM_STICKERS = "customStickers";
export const DEFAULT_STICKERS = "defaultStickers";
export const OPTION_ITEMS = "optionItems";
export const MESSAGE_DETAILS = "messageDetails";
export const NAME = "name";
export const COUNT = "count";

export const NEW_MESSAGES = "newMessagesArrived";
export const REFRESHING_MESSAGES = "refreshingMessages";
export const MESSAGES_REFRESHED = "messageRefreshed";
export const IN_PROGRESS = "inprogress";
export const BREAKPOINT_MIN_WIDTH = "320";
export const BREAKPOINT_MAX_WIDTH = "767";
export const MAX_MESSAGE_COUNT = 600;
export const IS_ACTIVE = "isActive";
export const TRANSALATE = "translate";
export const REPLY = "reply";
export const REPLY_IN_THREAD = "reply in thread";
export const REACT = "react";
export const SHARE = "share";
export const COPY = "copy";
export const FORWARD = "forward";
export const INFORMATION = "information";