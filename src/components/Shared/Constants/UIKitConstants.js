import { CometChat } from "@cometchat-pro/chat";

const MessageCategoryConstants = {
  message: CometChat.CATEGORY_MESSAGE, //referring to sdk constant variable
  custom: CometChat.CATEGORY_CUSTOM,
  action: CometChat.CATEGORY_ACTION,
  call: CometChat.CATEGORY_CALL,
};

const MessageTypeConstants = {
  text: CometChat.MESSAGE_TYPE.TEXT,
  file: CometChat.MESSAGE_TYPE.FILE,
  image: CometChat.MESSAGE_TYPE.IMAGE,
  audio: CometChat.MESSAGE_TYPE.AUDIO,
  video: CometChat.MESSAGE_TYPE.VIDEO,
  groupMember: CometChat.ACTION_TYPE.TYPE_GROUP_MEMBER,
  messageEdited: CometChat.ACTION_TYPE.MESSAGE_EDITED,
  messageDeleted: CometChat.ACTION_TYPE.MESSAGE_DELETED,
  poll: "extension_poll",
  sticker: "extension_sticker",
  document: "extension_document",
  whiteboard: "extension_whiteboard",
  meeting: "meeting",
  location: "location",
};

const ReceiverTypeConstants = {
  user: CometChat.RECEIVER_TYPE.USER,
  group: CometChat.RECEIVER_TYPE.GROUP,
};

const UserStatusConstants = {
  online: CometChat.USER_STATUS.ONLINE,
  offline: CometChat.USER_STATUS.OFFLINE,
};

const MessageOptionConstants = {
  editMessage: "editMessage",
  deleteMessage: "deleteMessage",
  replyMessage: "replyMessage",
  replyInThread: "replyInThread",
  translateMessage: "translateMessage",
  reactToMessage: "reactToMessage",
  messageInformation: "messageInformation",
  copyMessage: "copyMessage",
  shareMessage: "shareMessage",
  forwardMessage: "forwardMessage",
  sendMessagePrivately: "sendMessagePrivately",
  replyMessagePrivately: "replyMessagePrivately",
};

const MessageOptionForConstants = {
  sender: "sender",
  receiver: "receiver",
  both: "both",
};
const MessageListAlignmentConstants = {
  left: "left",
  standard: "standard",
  leftAligned: "leftAligned",
};

const MessageBubbleAlignmentConstants = {
  left: "left",
  right: "right",
  center: "center",
};

const MessageTimeAlignmentConstants = {
  top: "top",
  bottom: "bottom",
};

const MessageStatusConstants = Object.freeze({
  inprogress: "inprogress",
  success: "success",
});

const messageConstants = {
  maximumNumOfMessages: 50,
  liveReactionTimeout: 1500,
};

const wordBoundary = {
  start: `(?:^|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
  end: `(?=$|:|;|'|"|,|{|}|\\.|\\s|\\!|\\?|\\(|\\)|\\[|\\]|\\*)`,
};

const emailPattern = new RegExp(
  wordBoundary.start +
    `[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}` +
    wordBoundary.end,
  "gi"
);

const urlPattern = new RegExp(
  wordBoundary.start +
    `((https?://|www\\.|pic\\.)[-\\w;/?:@&=+$\\|\\_.!~*\\|'()\\[\\]%#,☺]+[\\w/#](\\(\\))?)` +
    wordBoundary.end,
  "gi"
);

const phoneNumPattern = new RegExp(
  wordBoundary.start +
    `(?:\\+?(\\d{1,3}))?([-. (]*(\\d{3})[-. )]*)?((\\d{3})[-. ]*(\\d{2,4})(?:[-.x ]*(\\d+))?)` +
    wordBoundary.end,
  "gi"
);
const MetadataConstants = {
  liveReaction: "live_reaction",
  file: "file",
  extensions: {
    thumbnailGeneration: "thumbnail-generation",
    polls: "polls",
    document: "document",
    whiteboard: "whiteboard",
    xssFilter: "xss-filter",
    dataMasking: "data-masking",
    profanityFilter: "profanity-filter",
    reactions: "reactions",
    linkPreview: "link-preview",
  },
};

const GroupOptionConstants = {
  leave: "leave",
  delete: "delete",
  viewMembers: "viewMembers",
  addMembers: "addMembers",
  bannedMembers: "bannedMembers",
  voiceCall: "voiceCall",
  videoCall: "videoCall",
  viewInformation: "viewInformation",
};

const GroupMemberOptionConstants = {
  joined: "joined",
  left: "left",
  added: "added",
  kick: "kick",
  ban: "ban",
  unban: "unban",
  changeScope: "changeScope",
};

const UserOptionConstants = {
  blockUnblock: "blockUnblock",
  viewProfile: "viewProfile",
  voiceCall: "voiceCall",
  videoCall: "videoCall",
  viewInformation: "viewInformation",
};

const ConversationOptionConstants = {
  delete: "delete",
  edit: "edit",
};

const ConversationTypeConstants = {
  users: "users",
  groups: "groups",
  both: "both",
};

const GroupTypeConstants = {
  private: CometChat.GROUP_TYPE.PRIVATE,
  password: CometChat.GROUP_TYPE.PASSWORD,
  public: CometChat.GROUP_TYPE.PUBLIC,
};

const GroupMemberScope = {
  admin: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
  moderator: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
  participant: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
};

export const GroupsConstants = {
  MESSAGE_: "message_",
  GROUP_MEMBERS: "members",
  GROUP_MEMBER: "member",

  GROUP_: "group_",
  ENTER_GROUP_NAME: "Name",
  CREATING_MESSSAGE: "Creating...",
  GROUP_PASSWORD_BLANK: "Group password cannot be blank",
  PARTICIPANT: "Participant",
  PUBLIC: "Public",
  PRIVATE: "Private",

  CREATE_GROUP: "Create Group",
  GROUP_LIST_: "grouplist_",
  GROUPS: "Groups",
  GUID: "guid",
  VIEW_MESSAGE_THREAD: "viewMessageThread",
  CLOSE_THREAD_CLICKED: "closeThreadClicked",
  CLOSE_FULL_SCREEN_IMAGE: "closeFullScreenImage",
  VIEW_ACTUAL_IMAGE: "viewActualImage",
  ACTION_TYPE_GROUPMEMBER: "groupMember",
  EDIT: "edit",
  DELETE: "delete",
  MENU_CLICKED: "menuClicked",
  PUBLIC_GROUP: "public",
  PRIVATE_GROUP: "private",
  PROTECTED_GROUP: "protected",
  MEMBER_SCOPE_CHANGED: "memberScopeChanged",
  MEMBERS_ADDED: "membersAdded",
  MEMBER_UNBANNED: "memberUnbanned",
  MEMBERS_UPDATED: "membersUpdated",
  MEMBER_UPDATED: "memberUpdated",
  GROUP_UPDATED: "groupUpdated",
  LEFT_GROUP: "leftGroup",
  DELETE_GROUP: "groupDeleted",
  BREAKPOINT_MIN_WIDTH: "320",
  BREAKPOINT_MAX_WIDTH: "767",
  UID: "uid",
  SEARCH: "Search",
  GROUP_TO_UPDATE: "groupToUpdate",
  SCOPE: "scope",
  GROUP_TO_DELETE: "groupToDelete",
  MEMBERS_COUNT: "membersCount",
  NO_GROUPS_FOUND: "No groups found",
  LOADING_MESSSAGE: "Loading...",
  ERROR: "error",
  GROUP_MEMBER_KICKED: "onGroupMemberKicked",
  HAS_JOINED: "hasJoined",
  CLOSE_CREATE_GROUP_VIEW: "closeCreateGroupView",
  GROUP_CREATED: "groupCreated",
  GROUP_MEMBER_SCOPE_CHANGED: "onGroupMemberScopeChanged",
  GROUP_MEMBER_BANNED: "onGroupMemberBanned",
  GROUP_MEMBER_UNBANNED: "onGroupMemberUnbanned",
  GROUP_MEMBER_ADDED: "onMemberAddedToGroup",
  GROUP_MEMBER_LEFT: "onGroupMemberLeft",
  GROUP_MEMBER_JOINED: "onGroupMemberJoined",
};

export const MetadataKey = Object.freeze({
  file: "file",
  liveReaction: "live_reaction",
  extension: "extensions",
  extensions: {
    thumbnailGeneration: "thumbnail-generation",
    polls: "polls",
    document: "document",
    whiteboard: "whiteboard",
    xssfilter: "xss-filter",
    datamasking: "data-masking",
    profanityfilter: "profanity-filter",
    reactions: "reactions",
    linkpreview: "link-preview",
    smartReply: "smart-reply",
    REPLY_POSITIVE: "reply_positive",
    REPLY_NEUTRAL: "reply_neutral",
    REPLY_NEGATIVE: "reply_negative",
  },
  metadata: "metadata",
  injected: "@injected",
  links: "links",
});

const getExtensionsData = (message, extensionKey) => {
  if (message?.hasOwnProperty("metadata")) {
    const metadata = message.metadata;
    const injectedObject = metadata["@injected"];
    if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
      const extensionsObject = injectedObject["extensions"];
      if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
        return extensionsObject[extensionKey];
      }
    }
  }

  return null;
};

const getMetadataByKey = (message, metadataKey) => {
  if (message.hasOwnProperty("metadata")) {
    const metadata = message["metadata"];
    if (metadata.hasOwnProperty(metadataKey)) {
      return metadata[metadataKey];
    }
  }

  return null;
};

const bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export {
  MessageCategoryConstants,
  MessageTypeConstants,
  ReceiverTypeConstants,
  MessageOptionConstants,
  MessageOptionForConstants,
  MessageListAlignmentConstants,
  MessageBubbleAlignmentConstants,
  MessageTimeAlignmentConstants,
  MessageStatusConstants,
  MetadataConstants,
  GroupOptionConstants,
  GroupMemberOptionConstants,
  UserOptionConstants,
  ConversationOptionConstants,
  ConversationTypeConstants,
  GroupTypeConstants,
  GroupMemberScope,
  getExtensionsData,
  getMetadataByKey,
  bytesToSize,
  UserStatusConstants,
  messageConstants,
  wordBoundary,
  emailPattern,
  urlPattern,
  phoneNumPattern,
};
