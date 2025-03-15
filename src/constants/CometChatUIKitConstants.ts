import { CometChat } from "@cometchat/chat-sdk-javascript"

export class CometChatUIKitConstants {
    static MessageCategory = Object.freeze({
        message: CometChat.CATEGORY_MESSAGE,
        custom: CometChat.CATEGORY_CUSTOM,
        action: CometChat.CATEGORY_ACTION,
        call: CometChat.CATEGORY_CALL,
        interactive: CometChat.CATEGORY_INTERACTIVE
    })
    static MessageTypes = Object.freeze({
        text: CometChat.MESSAGE_TYPE.TEXT,
        file: CometChat.MESSAGE_TYPE.FILE,
        image: CometChat.MESSAGE_TYPE.IMAGE,
        audio: CometChat.MESSAGE_TYPE.AUDIO,
        video: CometChat.MESSAGE_TYPE.VIDEO,
        delete: "delete",
        edited: "edited",
        groupMember: "groupMember",
        form: "form",
        card: "card",
        customInteractive: "customInteractive",
        scheduler: "scheduler"
    })
    static groupMemberAction = Object.freeze({
        ROLE: "role",
        BLOCK: "block",
        REMOVE: "remove",
        JOINED: CometChat.ACTION_TYPE.MEMBER_JOINED,
        LEFT: CometChat.ACTION_TYPE.MEMBER_LEFT,
        ADDED: CometChat.ACTION_TYPE.MEMBER_ADDED,
        BANNED: CometChat.ACTION_TYPE.MEMBER_BANNED,
        UNBANNED: CometChat.ACTION_TYPE.MEMBER_UNBANNED,
        KICKED: CometChat.ACTION_TYPE.MEMBER_KICKED,
        INVITED: CometChat.ACTION_TYPE.MEMBER_INVITED,
        SCOPE_CHANGE: CometChat.ACTION_TYPE.MEMBER_SCOPE_CHANGED,
    })
    static MessageReceiverType = Object.freeze({
        user: CometChat.RECEIVER_TYPE.USER,
        group: CometChat.RECEIVER_TYPE.GROUP,
    })
    static userStatusType = Object.freeze({
        online: CometChat.USER_STATUS.ONLINE,
        offline: CometChat.USER_STATUS.OFFLINE,
    })
    static MessageOption = Object.freeze({
        editMessage: "edit",
        deleteMessage: "delete",
        replyMessage: "reply",
        replyInThread: "replyInThread",
        translateMessage: "translate",
        reactToMessage: "react",
        messageInformation: "messageInformation",
        copyMessage: "copy",
        shareMessage: "share",
        forwardMessage: "forward",
        sendMessagePrivately: "sendMessagePrivately",
        replyMessagePrivately: "replyMessagePrivately",
    })

    static GroupOptions = Object.freeze({
        leave: "leave",
        delete: "delete",
        viewMembers: "viewMembers",
        addMembers: "addMembers",
        bannedMembers: "bannedMembers",
    })
    static GroupMemberOptions = Object.freeze({
        kick: "kick",
        ban: "ban",
        unban: "unban",
        changeScope: "changeScope",

    })
    static groupMemberScope = Object.freeze({
        owner: "owner",
        admin: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
        participant: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
        moderator: CometChat.GROUP_MEMBER_SCOPE.MODERATOR
    })
    static UserOptions = Object.freeze({
        block: "block",
        unblock: "unblock",
        viewProfile: "viewProfile",
    })
    static ConversationOptions = Object.freeze({
        delete: "delete"
    })
    static GroupTypes = Object.freeze({
        private: CometChat.GROUP_TYPE.PRIVATE,
        password: CometChat.GROUP_TYPE.PASSWORD,
        public: CometChat.GROUP_TYPE.PUBLIC
    })
    static liveReaction = Object.freeze({
        timeout: 1500
    })
    static messages = Object.freeze({
        MESSAGE_DELIVERED: "onMessagesDelivered",
        MESSAGE_READ: "onMessagesRead",
        MESSAGE_DELETED: "onMessageDeleted",
        MESSAGE_EDITED: "onMessageEdited",
        MESSAGE_SENT: "messageSent",
        TEXT_MESSAGE_RECEIVED: "onTextMessageReceived",
        MEDIA_MESSAGE_RECEIVED: "onMediaMessageReceived",
        CUSTOM_MESSAGE_RECEIVED: "onCustomMessageReceived",
        TRANSIENT_MESSAGE_RECEIVED: "onTransientMessageReceived",
        INTERACTIVE_MESSAGE_RECEIVED: "onInteractiveMessageReceived",
        DELIVERY: "delivery",
        READ: "read",
        APP_SYSTEM: "app_system",
        MESSAGE_REACTION_ADDED: "onMessageReactionAdded",
        MESSAGE_REACTION_REMOVED: "onMessageReactionRemoved",
    })
    static details = Object.freeze({
        primary: "primary",
        secondary: "secondary"
    })
    static calls = Object.freeze({
        meeting: "meeting",
        ongoing: CometChat.CALL_STATUS.ONGOING,
        ended: CometChat.CALL_STATUS.ENDED,
        initiated: CometChat.CALL_STATUS.INITIATED,
        cancelled: CometChat.CALL_STATUS.CANCELLED,
        rejected: CometChat.CALL_STATUS.REJECTED,
        unanswered: CometChat.CALL_STATUS.UNANSWERED,
        busy: CometChat.CALL_STATUS.BUSY,
        activecall: "cometchat:activecall",
        default: CometChat.CALL_MODE.DEFAULT,
        grid: CometChat.CALL_MODE.GRID,
        single: CometChat.CALL_MODE.SINGLE,
        spotlight: CometChat.CALL_MODE.SPOTLIGHT,
        tile: CometChat.CALL_MODE.TILE,
    })
    static goalType = Object.freeze({
        allOf: CometChat.GoalType.ALL_OF,
        anyOf: CometChat.GoalType.ANY_OF,
        anyAction: CometChat.GoalType.ANY_ACTION,
        none: CometChat.GoalType.NONE
    })

    static requestBuilderLimits = Object.freeze({
        reactionListLimit: 10,
        reactionInfoLimit: 10,
        messageListLimit: 30,
        usersLimit: 30,
        groupsLimit: 30,
    })

    static radioNames = Object.freeze({
        conversations: "conversations",
        users: "users",
        groups: "groups",
        changeScope: "changeScope",
        groupMembers: "groupMembers",
    })
}
