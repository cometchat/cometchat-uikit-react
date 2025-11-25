import { CometChat } from "@cometchat/chat-sdk-javascript"

export class CometChatUIKitConstants {
    static MessageCategory = Object.freeze({
        message: CometChat.CATEGORY_MESSAGE,
        custom: CometChat.CATEGORY_CUSTOM,
        action: CometChat.CATEGORY_ACTION,
        call: CometChat.CATEGORY_CALL,
        interactive: CometChat.CATEGORY_INTERACTIVE,
        agentic:CometChat.MessageCategory.AGENTIC
    })
    static moderationStatus = Object.freeze({
        pending: CometChat.ModerationStatus.PENDING,
        approved: CometChat.ModerationStatus.APPROVED,
        disapproved: CometChat.ModerationStatus.DISAPPROVED,
        unmoderated: CometChat.ModerationStatus.UNMODERATED,
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
        scheduler: "scheduler",
        assistant:CometChat.MESSAGE_TYPE.ASSISTANT,
        toolArguments: CometChat.MESSAGE_TYPE.TOOL_ARGUMENTS,
        toolResults: CometChat.MESSAGE_TYPE.TOOL_RESULT,

        
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
        flagMessage: "flagMessage",
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

    static mimeTypes = Object.freeze({
        audio: "audio/*, .aac, .aif, .aiff, .caf, .mp3, .mp4, .wav, .m4a, .wma, .flac, .alac, .oga, .ra, .ram, .mid, .midi, .mka, .opus, .ac3, .amr, .ape, .dts, .wv, .tta, .pcm, .snd, .au, .cda, .vox, .m4b, .m3u, .pls, .ogg",
        video: "video/*, .mov, .mp4, .m4v, .avi, .mpg, .mpeg, .m2ts, .mts, .3gp, .3g2, .flv, .wmv, .vob, .ts, .webm, .f4v, .f4a, .f4b, .swf, .rm, .rmvb, .divx, .xvid, .mxf, .asf, .amv, .smv, .avchd, .qt",
        image: "image/*, .heic, .heif, .jpg, .jpeg, .png, .gif, .bmp, .tiff, .tif, .psd, .svg, .ico, .raw, .dng, .eps, .webp, .jfif, .jp2, .jpf, .jpx, .jpm, .mj2, .hdr, .exr, .pbm, .pgm, .ppm, .pnm, .tga, .dds, .svgz, .djvu, .ai, .cdr",
    })
    static streamMessageTypes = Object.freeze({
        run_started: CometChat.AI_ASSISTANT_EVENTS.RUN_STARTED,
        text_message_start: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_START,
        text_message_content: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_CONTENT,
        text_message_end: CometChat.AI_ASSISTANT_EVENTS.TEXT_MESSAGE_END,
        run_finished: CometChat.AI_ASSISTANT_EVENTS.RUN_FINISHED,
        tool_call_start: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_STARTED,
        tool_call_end: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_ENDED,
        tool_call_args: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_ARGUMENT,
        tool_call_result: CometChat.AI_ASSISTANT_EVENTS.TOOL_CALL_RESULT
    })
}
