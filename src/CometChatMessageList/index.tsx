import { useCallback, useRef, useState, useContext, useMemo } from "react";
import "my-cstom-package-lit";
import { Hooks } from "./hooks";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatSoundManager, MessageReceiptUtils, MessageListStyle, ListStyle } from 'uikit-utils-lerna';
import { CometChatMessageTemplate, localize, CometChatUIKitConstants, CometChatMessageEvents, CometChatGroupEvents, IGroupLeft, IGroupMemberScopeChanged, IGroupMemberAdded, IGroupMemberKickedBanned, MessageStatus, MessageBubbleAlignment, TimestampAlignment, MessageListAlignment, DatePatterns, States, IMessages, CometChatUIEvents, IPanel, IDialog, CometChatCallEvents, IShowOngoingCall, CometChatActionsIcon, CometChatActionsView } from "uikit-resources-lerna";
import { DateStyle, AvatarStyle } from 'my-cstom-package-lit';
import { CometChatMessageBubble } from "../Shared/Views/CometChatMessageBubble";
import { MessageListManager } from "./controller";
import { CometChatList } from "../Shared/Views/CometChatList";
import { defaultAvatarStyle, defaultDateSeparatorStyle, defaultMessageListStyle, dividerStyle, EmptyViewStyle, ErrorViewStyle, LoadingViewStyle, MessageAvatarStyle, MessageBubbleDateStyle, MessageBubbleStyle, MessageDateStyle, MessageLabelStyle, MessageListDivStyle, MessageListFooterStyle, MessageListHeaderStyle, MessageListMessageIndicatorStyle, MessageListUnreadLabelStyle, MessageListWrapperStyle, MessageReceiptStyle, MessageThreadViewStyle, unreadMessageStyle } from "./style";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { CometChatContext } from "../CometChatContext";
import WaitIcon from './assets/wait.svg';
import SentIcon from './assets/message-sent.svg';
import ReadIcon from './assets/message-read.svg';
import DeliveredIcon from './assets/message-delivered.svg';
import RightArrowIcon from './assets/side-arrow.svg';
import LoadingIcon from './assets/Spinner.svg';
import WarningIcon from './assets/warning-small.svg';
import { useCometChatErrorHandler, useRefSync } from "../CometChatCustomHooks";

interface IMessageListProps {
    parentMessageId?: number,
    user?: CometChat.User,
    group?: CometChat.Group,
    emptyStateText?: string,
    errorStateText?: string,
    emptyStateView?: any,
    errorStateView?: any,
    loadingStateView?: any,
    disableReceipt?: boolean,
    disableSoundForMessages?: boolean,
    customSoundForMessages?: string,
    readIcon?: string,
    deliveredIcon?: string,
    sentIcon?: string,
    waitIcon?: string,
    errorIcon?: string,
    loadingIconURL?: string,
    alignment?: MessageListAlignment,
    showAvatar?: boolean,
    datePattern?: DatePatterns,
    timestampAlignment?: TimestampAlignment,
    DateSeparatorPattern?: DatePatterns,
    templates?: CometChatMessageTemplate[],
    messagesRequestBuilder?: CometChat.MessagesRequestBuilder,
    newMessageIndicatorText?: string,
    scrollToBottomOnNewMessages?: boolean,
    thresholdValue?: number,
    onThreadRepliesClick?: Function,
    headerView?: any,
    footerView?: any,
    avatarStyle?: AvatarStyle,
    dateSeparatorStyle?: DateStyle,
    messageListStyle?: MessageListStyle,
    onError?: (error : CometChat.CometChatException) => void,
    hideError?: boolean
}

const defaultProps: IMessageListProps = {
    parentMessageId: 0,
    user: undefined,
    group: undefined,
    emptyStateText: localize("NO_MESSAGES_FOUND"),
    errorStateText: localize("SOMETHING_WRONG"),
    emptyStateView: null,
    errorStateView: null,
    loadingStateView: null,
    disableReceipt: false,
    disableSoundForMessages: false,
    customSoundForMessages: '',
    readIcon: ReadIcon,
    deliveredIcon: DeliveredIcon,
    sentIcon: SentIcon,
    waitIcon: WaitIcon,
    errorIcon: WarningIcon,
    loadingIconURL: LoadingIcon,
    alignment: MessageListAlignment.standard,
    showAvatar: true,
    datePattern: DatePatterns.time,
    timestampAlignment: TimestampAlignment.bottom,
    DateSeparatorPattern: DatePatterns.DayDateTime,
    templates: [],
    messagesRequestBuilder: undefined,
    newMessageIndicatorText: '',
    scrollToBottomOnNewMessages: false,
    thresholdValue: 1000,
    onThreadRepliesClick: () => { },
    headerView: null,
    footerView: null,
    avatarStyle: defaultAvatarStyle,
    dateSeparatorStyle: defaultDateSeparatorStyle,
    messageListStyle: defaultMessageListStyle,
    onError: (error: CometChat.CometChatException) => { console.log(error); },
    hideError: false
};

const CometChatMessageList = (props: IMessageListProps) => {
    const {
        parentMessageId,
        user,
        group,
        emptyStateText,
        errorStateText,
        emptyStateView,
        errorStateView,
        loadingStateView,
        disableReceipt,
        disableSoundForMessages,
        customSoundForMessages,
        readIcon,
        deliveredIcon,
        sentIcon,
        waitIcon,
        errorIcon,
        loadingIconURL,
        alignment,
        showAvatar,
        datePattern,
        timestampAlignment,
        DateSeparatorPattern,
        templates,
        messagesRequestBuilder,
        newMessageIndicatorText,
        scrollToBottomOnNewMessages,
        thresholdValue,
        onThreadRepliesClick,
        headerView,
        footerView,
        avatarStyle,
        dateSeparatorStyle,
        messageListStyle,
        onError,
        hideError
    } = props;

    const [messageList, setMessageList] = useState<any[]>([]);
    const [unreadMessageLabel, showUnreadMessageLabel] = useState(false);
    const [scrollListToBottom, setScrollListToBottom] = useState(true);
    const [messageListState, setMessageListState] = useState<States>(States.loading);
    const [showOngoingCall, setShowOngoingCall] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSmartReply, setShowSmartReply] = useState(false);

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const messageListManager = useRef<any>(null);
    const messageIdRef = useRef({ prevMessageId: 0, nextMessageId: 0 });
    const messagesCountRef = useRef(0);
    const UnreadCountRef = useRef<CometChat.BaseMessage[]>([]);
    const newMessageCountRef = useRef<string>('');
    const unreadMessageLabelRef = useRef(false);
    const { theme } = useContext(CometChatContext);
    const imageModerationDialogRef = useRef(null);
    const userRef = useRefSync(user);
    const groupRef = useRefSync(group);
    const smartReplyViewRef = useRef(null);
    const onErrorCallback = useCometChatErrorHandler(onError);
    let keepRecentMessages: boolean = true,
        isOnBottom: boolean = true,
        timestampEnum: any = TimestampAlignment,
        isFetchingPreviousMessages = false,
        threadedAlignment: MessageBubbleAlignment = MessageBubbleAlignment.left,
        ongoingCallView: any = null,
        chatChanged = true;

    const messagesTemplate = useMemo(()=> {
        return templates && templates.length > 0 ? templates : ChatConfigurator.getDataSource().getAllMessageTemplates(theme);
    }, [templates, theme])

    const messagesTypesMap = useMemo(()=>{
        let messagesTypesArray : {[key : string]: CometChatMessageTemplate} = {};
        messagesTemplate.forEach((el: CometChatMessageTemplate) => {
            messagesTypesArray[el.category + '_' + el.type] = el;
        });
        return messagesTypesArray;
    }, [messagesTemplate]);

    const checkIfMessageBelongsToCurrentChat = useCallback((message: CometChat.BaseMessage) => {
        const receiverType = message.getReceiverType();
        const receiverId = message.getReceiverId();
        const senderId = message.getSender().getUid();

        if(receiverType === CometChatUIKitConstants.MessageReceiverType.user){
            return (receiverId === userRef?.current?.getUid() && senderId === loggedInUser?.getUid()) || (senderId === userRef?.current?.getUid() && receiverId === loggedInUser?.getUid());
        }else{
            return groupRef?.current?.getGuid() === receiverId;
        }
    }, [loggedInUser])

    const openThreadView = useCallback((message: CometChat.BaseMessage) => {
        try {
            setScrollListToBottom(false);
            if (onThreadRepliesClick) {
                onThreadRepliesClick(message, getThreadedMessageBubble);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onThreadRepliesClick, onErrorCallback])

    const getMessageFromList = useCallback((id: number) => {
        try {
            const messageObject = messageList.find((m: CometChat.BaseMessage) => m.getId().toString() === id.toString());
            return messageObject;
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [messageList, onErrorCallback, setMessageList])

    const threadCallback = useCallback((id: number) => {
        try {
            let messageObject: CometChat.BaseMessage = getMessageFromList(id)
            openThreadView(messageObject);
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [getMessageFromList, openThreadView, onErrorCallback])

    const replaceMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            setMessageList((prevMessageList: CometChat.BaseMessage[]) => {
                const messages = prevMessageList.map(
                    (m: CometChat.BaseMessage, id) => {
                        if (m?.getId() === message?.getId()) {
                            return message;
                        } else {
                            return m;
                        }
                    }
                );
                return messages;
            });

            if (!message.getParentMessageId()) {
                messagesCountRef.current -= 1;
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const deleteMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            const messageId: any = message.getId();
            CometChat.deleteMessage(messageId).then(
                (deletedMessage: CometChat.BaseMessage) => {
                    replaceMessage(deletedMessage);
                    CometChatMessageEvents.ccMessageDeleted.next(deletedMessage);
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error)
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [replaceMessage, onErrorCallback])

    const deleteCallback = useCallback((id: number) => {
        try {
            let messageObject: CometChat.BaseMessage = getMessageFromList(id);
            if (messageObject) {
                deleteMessage(messageObject);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback, deleteMessage, getMessageFromList])

    const onEditMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            CometChatMessageEvents.ccMessageEdited.next({ message: message, status: MessageStatus.inprogress });
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const editCallback = useCallback((id: number) => {
        try {
            let messageObject: CometChat.BaseMessage = getMessageFromList(id);
            if (messageObject) {
                onEditMessage(messageObject);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [getMessageFromList, onEditMessage, onErrorCallback])

    const onCopyMessage = useCallback((message: CometChat.TextMessage) => {
        try {
            navigator?.clipboard?.writeText(message.getText());
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const copyCallback = useCallback((id: number) => {
        try {
            let messageObject: CometChat.TextMessage = getMessageFromList(id);
            if (messageObject) {
                onCopyMessage(messageObject);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [getMessageFromList, onCopyMessage, onErrorCallback])

    const messageSent = useCallback((message: CometChat.BaseMessage) => {
        try {
            setMessageList(
                (prevMessageList: CometChat.BaseMessage[]) => {
                    const messages = prevMessageList.map(
                        (m: CometChat.BaseMessage) => {
                            if (m.getMuid() === message.getMuid()) {
                                return message;
                            } else {
                                return m;
                            }
                        }
                    );
                    return messages;
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }

    }, [onErrorCallback])

    const updateEditedMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            if (!message || message.getId() === parentMessageId) {
                return;
            }
            setMessageList(
                (prevMessageList: CometChat.BaseMessage[]) => {
                    prevMessageList.find((m: CometChat.BaseMessage) => m.getId().toString() === message.getId().toString());
                    const messages = prevMessageList.map(
                        (m: CometChat.BaseMessage) => {
                            if (m.getId() === message.getId()) {
                                return message;
                            } else {
                                return m;
                            }
                        }
                    );
                    return messages;
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [parentMessageId, onErrorCallback]);
    
    const updateMessage = useCallback((message: CometChat.BaseMessage, muid: boolean = false) => {
        try {
            if(muid){
                setScrollListToBottom(true);
                messageSent(message);
            }else{
                setScrollListToBottom(false);
                updateEditedMessage(message);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [messageSent, updateEditedMessage, onErrorCallback, setScrollListToBottom])

    const setOptionsCallback = useCallback((options: (CometChatActionsIcon | CometChatActionsView)[]) => {
        try {
            options.forEach((element: CometChatActionsIcon | CometChatActionsView) => {
                switch (element.id) {
                    case CometChatUIKitConstants.MessageOption.deleteMessage:
                        if (!(element as CometChatActionsIcon).onClick) {
                            (element as CometChatActionsIcon).onClick = deleteCallback;
                        }
                        break;
                    case CometChatUIKitConstants.MessageOption.editMessage:
                        if (!(element as CometChatActionsIcon).onClick) {
                            (element as CometChatActionsIcon).onClick = editCallback
                        }
                        break;
                    case CometChatUIKitConstants.MessageOption.copyMessage:
                        if (!(element as CometChatActionsIcon).onClick) {
                            (element as CometChatActionsIcon).onClick = copyCallback
                        }
                        break;
                    case CometChatUIKitConstants.MessageOption.replyInThread:
                        if (!(element as CometChatActionsIcon).onClick) {
                            (element as CometChatActionsIcon).onClick = threadCallback
                        }
                        break;
                    default:
                        break;
                }
            });
            return options;
        } catch (error: any) {
            onErrorCallback(error);
            return options;
        }

    }, [onErrorCallback, deleteCallback, editCallback, threadCallback, copyCallback])

    const setMessageOptions = useCallback((msgObject: CometChat.BaseMessage): (CometChatActionsIcon | CometChatActionsView)[] => {
        let options: (CometChatActionsIcon | CometChatActionsView)[] = [];
        try {
            if (messagesTemplate && messagesTemplate.length > 0 && !msgObject.getDeletedAt() && msgObject.getType() !== CometChatUIKitConstants.MessageTypes.groupMember && msgObject?.getCategory() !== CometChatUIKitConstants.MessageCategory.call) {
                messagesTemplate.forEach(
                    (element: any) => {
                        if (element.type === msgObject.getType() && element.category === msgObject.getCategory()) {
                            options = setOptionsCallback(element?.options?.(loggedInUser, msgObject, theme, group));
                        }
                    }
                );
            }
            return options;
        } catch (error: any) {
            onErrorCallback(error);
            return options;
        }
    }, [setOptionsCallback, onErrorCallback, loggedInUser])

    const setBubbleAlignment = useCallback((item: any) => {
        let bubbleAlignment = MessageBubbleAlignment.center;
        try {
            if (alignment === MessageListAlignment.left) {
                bubbleAlignment = MessageBubbleAlignment.left
            } else {
                if (item.type === CometChatUIKitConstants.MessageTypes.groupMember) {
                    bubbleAlignment = MessageBubbleAlignment.center
                } else if (!item.sender || item?.sender?.uid === loggedInUser?.getUid() && item.type !== CometChatUIKitConstants.MessageTypes.groupMember) {
                    bubbleAlignment = MessageBubbleAlignment.right
                } else {
                    bubbleAlignment = MessageBubbleAlignment.left
                }
            }
            return bubbleAlignment;
        } catch (error: any) {
            onErrorCallback(error);
            return bubbleAlignment;
        }
    }, [alignment, onErrorCallback, loggedInUser])

    const getContentView = useCallback((item: any) => {
        try {
            let _alignment = setBubbleAlignment(item);
            if (messagesTypesMap[item.category + "_" + item.type] && messagesTypesMap[item.category + "_" + item.type]?.contentView) {
                return messagesTypesMap[item.category + "_" + item.type]?.contentView(item, _alignment);
            }
            return null;
        } catch (error: any) {
            onErrorCallback(error);
            return null;
        }
    }, [messagesTypesMap, onErrorCallback, setBubbleAlignment])

    const getBottomView = useCallback((item: any) =>{
        try {
            let _alignment = setBubbleAlignment(item);
            if (messagesTypesMap[item.category + "_" + item.type] && messagesTypesMap[item.category + "_" + item.type]?.bottomView) {
                return messagesTypesMap[item.category + "_" + item.type]?.bottomView(item, _alignment);
            }
            return null;
        } catch (error: any) {
            onErrorCallback(error);
            return null;
        }
    }, [messagesTypesMap, onErrorCallback, setBubbleAlignment])

    const getHeaderView = useCallback((item: any) => {
        try {
            let view: any = null;
            if (messagesTypesMap[item.category + "_" + item.type] && messagesTypesMap[item.category + "_" + item.type]?.headerView) {
                view = messagesTypesMap[item.category + "_" + item.type]?.headerView(item)
            }
            return view;
        } catch (error: any) {
            onErrorCallback(error);
            return null;
        }
    }, [messagesTypesMap, onErrorCallback])

    const getFooterView = useCallback((item: any) => {
        try {
            let view: any = null
            if (messagesTypesMap[item.category + "_" + item.type] && messagesTypesMap[item.category + "_" + item.type]?.footerView) {
                view = messagesTypesMap[item.category + "_" + item.type]?.footerView(item);
            }
            return view;
        } catch (error: any) {
            onErrorCallback(error);
            return null;
        }
    }, [messagesTypesMap, onErrorCallback])

    const getBubbleWrapper = useCallback((item: any) => {
        let view: any = null;
        try {
            if (messagesTypesMap[item.category + "_" + item.type] && messagesTypesMap[item.category + "_" + item.type].bubbleView) {
                view = messagesTypesMap[item.category + "_" + item.type].bubbleView(item);
            }
            return view;
        } catch (error: any) {
            onErrorCallback(error);
            return view;
        }
    }, [messagesTypesMap, onErrorCallback])

    const reinitializeMessagesRequestBuilder = useCallback(() => {
        try {
            if (keepRecentMessages) {
                setMessageList(
                    (prevMessageList: CometChat.BaseMessage[]) => {
                        const messages = prevMessageList.slice(-30);
                        return messages;
                    }
                );
            } else {
                setMessageList(
                    (prevMessageList: CometChat.BaseMessage[]) => {
                        const messages = prevMessageList.slice(0, 30);
                        return messages;
                    }
                );
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])
    
    const prependMessages = useCallback((messages: CometChat.BaseMessage[]) => {
        return new Promise((resolve, reject) => {
            try {
                setMessageList(
                    (prevMessageList: CometChat.BaseMessage[]) => {
                        const updatedMessageList = [...messages, ...prevMessageList];
                        return updatedMessageList;
                    }
                );
                messagesCountRef.current = messagesCountRef.current + messages.length;
                setMessageListState(States.loaded);
                if (messagesCountRef.current > thresholdValue!) {
                    keepRecentMessages = false;
                    reinitializeMessagesRequestBuilder();
                }
                if (chatChanged) {
                    CometChatUIEvents.ccActiveChatChanged.next({user: user, group: group, message: messages[messages?.length - 1]});
                    chatChanged = false;
                }
                resolve(true);
            } catch (error: any) {
                setMessageListState(States.error);
                onErrorCallback(error);
                reject(error);
            }
        });
    }, [thresholdValue, reinitializeMessagesRequestBuilder, onErrorCallback])

    const fetchPreviousMessages = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                if (!isFetchingPreviousMessages) {
                    isFetchingPreviousMessages = true;
                    if (!messageListManager.current.previous) {
                        messageListManager.current.previous = new MessageListManager(
                            messagesRequestBuilder,
                            userRef.current,
                            groupRef.current,
                            messageIdRef.current.prevMessageId
                        );
                    }
                    setMessageListState(States.loading);
                    messageListManager?.current.previous.fetchPreviousMessages().then(
                        (messagesList: any) => {
                            isFetchingPreviousMessages = false;
                            if (messagesList && messagesList.length > 0) {
                                let lastMessage: CometChat.BaseMessage = messagesList[messagesList.length - 1];
                                if (!lastMessage.getDeliveredAt() && !disableReceipt) {
                                    CometChat.markAsDelivered(lastMessage).then(
                                        () => {
                                            messagesList.forEach(
                                                (m: CometChat.BaseMessage) => {
                                                    if (m.getId() <= lastMessage.getId() && m.getSender().getUid() !== loggedInUser?.getUid() && !m.getDeliveredAt()) {
                                                        m.setDeliveredAt(new Date().getTime());
                                                    }
                                                    return m;
                                                }
                                            );
                                        }
                                    )
                                }
                                if (!lastMessage.getReadAt()) {
                                    if (!disableReceipt) {
                                        CometChat.markAsRead(lastMessage).then(
                                            () => {
                                                messagesList.forEach(
                                                    (m: CometChat.BaseMessage) => {
                                                        if (m.getId() <= lastMessage.getId() && m.getSender().getUid() !== loggedInUser?.getUid() && !m.getReadAt()) {
                                                            m.setReadAt(new Date().getTime());
                                                        }
                                                        return m;
                                                    }
                                                );
                                                CometChatMessageEvents.ccMessageRead.next(lastMessage);
                                            }
                                        )
                                    } else {
                                        UnreadCountRef.current = [];
                                    }
                                }

                                prependMessages(messagesList).then(
                                    success => {
                                        resolve(success);
                                    }, error => {
                                        reject(error);
                                    }
                                )
                            } else {
                                if (messagesList.length === 0) {
                                    if (messagesCountRef.current === 0) {
                                        setMessageListState(States.empty);
                                    }
                                }
                                resolve(true);
                            }
                        }, (error: CometChat.CometChatException) => {
                            isFetchingPreviousMessages = false;
                            setMessageListState(States.error);
                            onErrorCallback(error);
                            reject(error);
                        }
                    );
                } else {
                    resolve(true);
                }
            } catch (error: any) {
                onErrorCallback(error);
            }
        });
    }, [disableReceipt, onErrorCallback, prependMessages, loggedInUser]);

    const appendMessages = useCallback((messages: string | any[]) => {
        return new Promise((resolve, reject) => {
            try {
                setMessageList(
                    (prevMessageList: CometChat.BaseMessage[]) => {
                        const updatedMessageList = [...prevMessageList, ...(typeof messages === "string" ? Array.from(messages) : messages)];
                        return updatedMessageList;
                    }
                );
                messagesCountRef.current = messagesCountRef.current + messages.length;
                setMessageListState(States.loaded);
                if (messagesCountRef.current > thresholdValue!) {
                    keepRecentMessages = true;
                    reinitializeMessagesRequestBuilder();
                }
                resolve(true);
            } catch (error: any) {
                setMessageListState(States.error);
                onErrorCallback(error);
                reject(error);
            }
        });
    }, [thresholdValue,reinitializeMessagesRequestBuilder, onErrorCallback])

    const fetchNextMessages = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                if (messageIdRef.current.nextMessageId) {
                    if (!messageListManager.current.next) {
                        messageListManager.current.next = new MessageListManager(
                            messagesRequestBuilder,
                            userRef.current,
                            groupRef.current,
                            messageIdRef.current.nextMessageId
                        );
                    }
                    setMessageListState(States.loading);
                    messageListManager?.current.next.fetchNextMessages()
                        .then(
                            (messagesList : any) => {
                                if (messagesList) {
                                    if (messagesList.length === 0) {
                                        messagesCountRef.current === 0 ? setMessageListState(States.empty) : setMessageListState(States.loaded);
                                        resolve(true);
                                    } else {
                                        appendMessages(messagesList).then(
                                            success => {
                                                resolve(success)
                                            }, error => {
                                                reject(error);
                                            }
                                        );
                                    }
                                } else {
                                    resolve(true);
                                }
                            }, (error: any) => {
                                setMessageListState(States.error);
                                onErrorCallback(error)
                                reject(error);
                            }
                        );
                } else {
                    resolve(true);
                }
            } catch (error: any) {
                onErrorCallback(error);
            }

        });
    }, [appendMessages, onErrorCallback]);

    const updateReplyCount = useCallback((message: CometChat.BaseMessage) => {
        try {
            setMessageList(
                (prevMessageList: CometChat.BaseMessage[]) => {
                    const messages = prevMessageList.map(
                        (m: CometChat.BaseMessage) => {
                            if (m.getId() === message.getParentMessageId()) {
                                if(m.getReplyCount()){
                                    m.setReplyCount(m.getReplyCount() + 1);
                                }else{
                                    m.setReplyCount(1);
                                }
                                return m;
                            } else {
                                return m;
                            }
                        }
                    );
                    return messages;
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const addMessage = useCallback((message: CometChat.BaseMessage) => {
        try {
            messagesCountRef.current += 1;
            setMessageListState(
                (prevState: any) => {
                    if (prevState === States.empty) {
                        return States.loaded;
                    } else {
                        return prevState;
                    }
                }
            );
            if(!message.getParentMessageId() || parentMessageId){
                setMessageList(
                    (prevMessageList: CometChat.BaseMessage[]) => {
                        const messages = [...prevMessageList, message];
                        return messages;
                    }
                );
            }
            if (messagesCountRef.current > thresholdValue!) {
                keepRecentMessages = true;
                reinitializeMessagesRequestBuilder();
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [thresholdValue, onErrorCallback, parentMessageId])

    const getMessageReceipt = useCallback((message: any) => {
        try {
            return MessageReceiptUtils.getReceiptStatus(message);
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const markMessageAsDelivered = useCallback((message: CometChat.BaseMessage) => {
        try {
            if (!disableReceipt && message.getSender().getUid() !== loggedInUser?.getUid() && !message.getDeliveredAt()) {
                CometChat.markAsDelivered(message).then(
                    () => {
                    }, (error: CometChat.CometChatException) => {
                        onErrorCallback(error);
                    }
                );
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [disableReceipt, onErrorCallback, loggedInUser])

    const playAudio = useCallback(() => {
        try {
            // CometChatSoundManager.pause();
            if (!disableSoundForMessages) {
                if (customSoundForMessages) {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage, customSoundForMessages)
                } else {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.incomingMessage)
                }
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [disableSoundForMessages, customSoundForMessages, onErrorCallback])

    const messageReceivedHandler = useCallback((message: CometChat.BaseMessage) => {
        try {
            markMessageAsDelivered(message);
            if (checkIfMessageBelongsToCurrentChat(message)) {
                if(message.getParentMessageId()){
                    updateReplyCount(message);
                }else{
                    addMessage(message);
                }
                if((!message.getParentMessageId()) || (message.getParentMessageId() && parentMessageId && parentMessageId === message.getParentMessageId())){
                    if(!isOnBottom){
                        if (scrollToBottomOnNewMessages) {
                            setTimeout(() => {
                                setScrollListToBottom(true);
                                if (!disableReceipt && message.getSender().getUid() !== loggedInUser?.getUid()) {
                                    CometChat.markAsRead(message).then(
                                        () => {
                                            CometChatMessageEvents.ccMessageRead.next(message);
                                        }, (error : unknown) => {
                                            onErrorCallback(error)
                                        }
                                    );
                                } else {
                                    UnreadCountRef.current = [];
                                }
                            }, 100);
                        } else {
                            setScrollListToBottom(false);
                            let countText = newMessageIndicatorText ? newMessageIndicatorText : UnreadCountRef.current.length > 1 ? localize("NEW_MESSAGES") : localize("NEW_MESSAGE");
                            UnreadCountRef.current.push(message);
                            newMessageCountRef.current = " ↓ " + UnreadCountRef.current.length + " " + countText;
                            unreadMessageLabelRef.current = true;
                        }
                    }else{
                        if (!disableReceipt && message.getSender().getUid() !== loggedInUser?.getUid()) {
                            CometChat.markAsRead(message).then(
                                () => {
                                    CometChatMessageEvents.ccMessageRead.next(message);
                                }, (error : unknown) => {
                                    onErrorCallback(error);
                                }
                            );
                        } else {
                            UnreadCountRef.current = [];
                        }
                    }
                }
            }
            playAudio();
        } catch (error) {
            onErrorCallback(error);
        }
    }, [markMessageAsDelivered, updateReplyCount, parentMessageId, disableReceipt, addMessage, scrollToBottomOnNewMessages, playAudio, onErrorCallback, loggedInUser]);

    const markAllMessagAsDelivered = useCallback((message: CometChat.MessageReceipt) => {
        try {
            setMessageList(
                (prevMessageList: CometChat.BaseMessage[]) => {
                    const messages = prevMessageList.map(
                        (m: CometChat.BaseMessage) => {
                            if (parseInt(m.getId().toString()) <= parseInt(message.getMessageId()) && m.getSender().getUid() === loggedInUser?.getUid() && !m.getDeliveredAt()) {
                                m.setDeliveredAt(message.getDeliveredAt());
                            }
                            return m;
                        }
                    );
                    return messages;
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback, loggedInUser])

    const markAllMessageAsRead = useCallback((message: CometChat.MessageReceipt) => {
        try {
            setMessageList(
                (prevMessageList: CometChat.BaseMessage[]) => {
                    const messages = prevMessageList.map(
                        (m: CometChat.BaseMessage) => {
                            if (parseInt(m.getId().toString()) <= parseInt(message.getMessageId()) && m.getSender().getUid() === loggedInUser?.getUid() && !m.getReadAt()) {
                                m.setReadAt(message.getReadAt());
                                if (parseInt(m.getId().toString()) == parseInt(message.getMessageId())) {
                                    CometChatMessageEvents.ccMessageRead.next(m);
                                }
                            }
                            return m;
                        }
                    );
                    return messages;
                }
            );
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback, loggedInUser])

    const messageReadAndDelivered = useCallback((messageReceipt: CometChat.MessageReceipt) => {
        try {
            if (messageReceipt.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user && messageReceipt.getSender().getUid() === userRef.current?.getUid() && messageReceipt.getReceiver() === loggedInUser?.getUid()) {
                messageReceipt.getReceiptType() === 'delivery' ? markAllMessagAsDelivered(messageReceipt) : markAllMessageAsRead(messageReceipt);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [markAllMessagAsDelivered, markAllMessageAsRead, onErrorCallback, loggedInUser])

    const messageEdited = useCallback((editedMessage: CometChat.BaseMessage) => {
        try {
            if (checkIfMessageBelongsToCurrentChat(editedMessage)) {
                updateEditedMessage(editedMessage);
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [updateEditedMessage, onErrorCallback, loggedInUser])

    const customMessageReceivedHandler = useCallback((customMessage: CometChat.CustomMessage) => {
        try {
            markMessageAsDelivered(customMessage);
            if (checkIfMessageBelongsToCurrentChat(customMessage)) {
                if (customMessage.getParentMessageId()) {
                    updateReplyCount(customMessage);
                }else{
                    addMessage(customMessage);
                }
                if((!customMessage.getParentMessageId()) || (customMessage.getParentMessageId() && parentMessageId && parentMessageId === customMessage.getParentMessageId())){
                    if (!isOnBottom) {
                        if (scrollToBottomOnNewMessages) {
                            setTimeout(() => {
                                setScrollListToBottom(true);
                                if (!disableReceipt && customMessage.getSender().getUid() !== loggedInUser?.getUid()) {
                                    CometChat.markAsRead(customMessage).then(
                                        () => {
                                            CometChatMessageEvents.ccMessageRead.next(customMessage);
                                        }, (error : unknown) => {
                                            onErrorCallback(error)
                                        }
                                    );
                                } else {
                                    UnreadCountRef.current = [];
                                }
                            }, 100);
                        } else {
                            setScrollListToBottom(false);
                            let countText = newMessageIndicatorText ? newMessageIndicatorText : UnreadCountRef.current.length > 1 ? localize("NEW_MESSAGES") : localize("NEW_MESSAGE");
                            UnreadCountRef.current.push(customMessage);
                            newMessageCountRef.current = " ↓ " + UnreadCountRef.current.length + " " + countText;
                            unreadMessageLabelRef.current = true;
                        }
                    }else{
                        if (!disableReceipt && customMessage.getSender().getUid() !== loggedInUser?.getUid()) {
                            CometChat.markAsRead(customMessage).then(
                                () => {
                                    CometChatMessageEvents.ccMessageRead.next(customMessage);
                                }, (error : unknown) => {
                                    onErrorCallback(error)
                                }
                            );
                        } else {
                            UnreadCountRef.current = [];
                        }
                    }
                }
            }
            playAudio();
        } catch (error) {
            onErrorCallback(error);
        }
    }, [markMessageAsDelivered, updateReplyCount, parentMessageId, disableReceipt, addMessage, scrollToBottomOnNewMessages, playAudio, onErrorCallback, loggedInUser])

    const groupActionMessageReceived = useCallback((actionMessage: CometChat.Action | any, group: CometChat.Group) => {
        try {
            if(group?.getGuid() === groupRef?.current?.getGuid()){
                addMessage(actionMessage);
                if (!isOnBottom) {
                    if (scrollToBottomOnNewMessages) {
                        setTimeout(() => {
                            setScrollListToBottom(true);
                        }, 100);
                    } else {
                        setScrollListToBottom(false);
                        let countText = newMessageIndicatorText ? newMessageIndicatorText : UnreadCountRef.current.length > 1 ? localize("NEW_MESSAGES") : localize("NEW_MESSAGE");
                        UnreadCountRef.current.push(actionMessage);
                        newMessageCountRef.current = " ↓ " + UnreadCountRef.current.length + " " + countText;
                        unreadMessageLabelRef.current = true;
                    }
                }
            }
        } catch (error) {
            onErrorCallback(error);
        }
    }, [addMessage, scrollToBottomOnNewMessages, onErrorCallback])

    const callActionMessageReceived = useCallback((callMessage: CometChat.Call) => {
        try {
            if (checkIfMessageBelongsToCurrentChat(callMessage) && ChatConfigurator.names.includes('calling')) {
                addMessage(callMessage);
                if (!isOnBottom) {
                    if (scrollToBottomOnNewMessages) {
                        setTimeout(() => {
                            setScrollListToBottom(true);
                        }, 100);
                    } else {
                        setScrollListToBottom(false);
                        let countText = newMessageIndicatorText ? newMessageIndicatorText : UnreadCountRef.current.length > 1 ? localize("NEW_MESSAGES") : localize("NEW_MESSAGE");
                        UnreadCountRef.current.push(callMessage);
                        newMessageCountRef.current = " ↓ " + UnreadCountRef.current.length + " " + countText;
                        unreadMessageLabelRef.current = true;
                    }
                }
            }
        } catch (error) {
            onErrorCallback(error);
        }
    }, [checkIfMessageBelongsToCurrentChat, addMessage, scrollToBottomOnNewMessages, onErrorCallback, loggedInUser])

    const handleRealTimeMessages = useCallback((key: string = '', message: CometChat.MessageReceipt | CometChat.BaseMessage | CometChat.TransientMessage | any | CometChat.Action | CometChat.Call = null, group: CometChat.Group | null = null) => {
        try {
            switch (key) {
                case CometChatUIKitConstants.messages.TEXT_MESSAGE_RECEIVED:
                case CometChatUIKitConstants.messages.MEDIA_MESSAGE_RECEIVED: {
                    messageReceivedHandler(message);
                    break;
                }
                case CometChatUIKitConstants.messages.MESSAGE_DELIVERED:
                case CometChatUIKitConstants.messages.MESSAGE_READ: {
                    if (!disableReceipt) {
                        messageReadAndDelivered(message);
                    }
                    break;
                }
                case CometChatUIKitConstants.messages.MESSAGE_DELETED:
                case CometChatUIKitConstants.messages.MESSAGE_EDITED: {
                    messageEdited(message);
                    break;
                }
                case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
                case CometChatUIKitConstants.groupMemberAction.JOINED:
                case CometChatUIKitConstants.groupMemberAction.LEFT:
                case CometChatUIKitConstants.groupMemberAction.ADDED:
                case CometChatUIKitConstants.groupMemberAction.KICKED:
                case CometChatUIKitConstants.groupMemberAction.BANNED:
                case CometChatUIKitConstants.groupMemberAction.UNBANNED: {
                    if (group) {
                        groupActionMessageReceived(message, group);
                    }
                    break;
                }
                case CometChatUIKitConstants.messages.CUSTOM_MESSAGE_RECEIVED: {
                    customMessageReceivedHandler(message);
                    break;
                }
                case CometChatUIKitConstants.messages.TRANSIENT_MESSAGE_RECEIVED: {
                    let transientMessage: CometChat.TransientMessage = message as CometChat.TransientMessage;
                    let liveReaction: any = transientMessage.getData();

                    if ((transientMessage.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user && userRef.current && transientMessage?.getSender().getUid() === userRef.current.getUid() && transientMessage.getReceiverId() === loggedInUser?.getUid()) || transientMessage.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group && groupRef.current && transientMessage.getReceiverId() === groupRef.current.getGuid() && transientMessage?.getSender().getUid() !== loggedInUser?.getUid()) {
                        CometChatMessageEvents.ccLiveReaction.next(liveReaction["LIVE_REACTION"]);
                    }
                    break;
                }
                case 'incoming':
                case 'cancelled':
                case 'rejected':
                case 'accepted': {
                    callActionMessageReceived(message);
                    break;
                }
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [messageReceivedHandler, messageReadAndDelivered, messageEdited, groupActionMessageReceived, customMessageReceivedHandler, loggedInUser])

    const onBottomCallback = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                setScrollListToBottom(false);
                isOnBottom = true;
                if (messageListManager.current && messageListManager.current.previous) {
                    messageListManager.current.previous = null;
                }

                const lastMessage: CometChat.BaseMessage = UnreadCountRef.current[UnreadCountRef.current.length - 1];

                if (!disableReceipt && lastMessage) {
                    CometChat.markAsRead(lastMessage).then(
                        () => {
                            UnreadCountRef.current = [];
                            CometChatMessageEvents.ccMessageRead.next(lastMessage);
                        }
                    );
                } else {
                    UnreadCountRef.current = [];
                }

                if (newMessageCountRef.current) {
                    newMessageCountRef.current = '';
                }

                if (unreadMessageLabelRef.current) {
                    unreadMessageLabelRef.current = false;
                }

                fetchNextMessages().then(
                    success => {
                        resolve(success);
                    }, error => {
                        reject(error);
                    }
                );
            } catch (error: any) {
                onErrorCallback(error);
            }
        });
    }, [disableReceipt, unreadMessageLabel, fetchNextMessages, onErrorCallback])

    const onTopCallback = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                setScrollListToBottom(false);
                isOnBottom = false;
                if (messageListManager.current && messageListManager.current.next) {
                    messageListManager.current.next = null;
                }
                fetchPreviousMessages().then(
                    success => {
                        resolve(success);
                    }, error => {
                        reject(error);
                    }
                );
            } catch (error: any) {
                onErrorCallback(error);
            }
        });
    }, [fetchPreviousMessages, onErrorCallback])

    const scrollToBottom = useCallback(() => {
        try {
            setScrollListToBottom(true);
            const lastMessage: CometChat.BaseMessage = UnreadCountRef.current[UnreadCountRef.current.length - 1];
            if (!disableReceipt && lastMessage) {
                CometChat.markAsRead(lastMessage).then(
                    () => {
                        UnreadCountRef.current = [];
                        CometChatMessageEvents.ccMessageRead.next(lastMessage);
                    }
                );
            } else {
                UnreadCountRef.current = [];
            }

            if (newMessageCountRef.current) {
                newMessageCountRef.current = '';
            }

            if (unreadMessageLabelRef.current) {
                unreadMessageLabelRef.current = false;
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [disableReceipt, unreadMessageLabel, onErrorCallback])

    const subscribeToEvents = useCallback(() => {
        try {
            const ccShowOngoingCall = CometChatUIEvents.ccShowOngoingCall.subscribe(
                (data: IShowOngoingCall) => {
                    setShowOngoingCall(true);
                    ongoingCallView = data.child;
                }
            )
            const ccCallEnded = CometChatCallEvents.ccCallEnded.subscribe(
                (call: CometChat.Call) => {
                    setShowOngoingCall(false);
                    ongoingCallView = null;
                    callActionMessageReceived(call);
                }
            )
            const ccCallRejected = CometChatCallEvents.ccCallRejected.subscribe(
                (call: CometChat.Call) => {
                    callActionMessageReceived(call);
                }
            )
            const ccOutgoingCall = CometChatCallEvents.ccOutgoingCall.subscribe(
                (call: CometChat.Call) => {
                    callActionMessageReceived(call);
                }
            )
            const ccCallAccepted = CometChatCallEvents.ccCallAccepted.subscribe(
                (call: CometChat.Call) => {
                    callActionMessageReceived(call);
                }
            )
            const ccShowDialog = CometChatUIEvents.ccShowDialog.subscribe(
                (data: IDialog) => {
                    imageModerationDialogRef.current = data.child;
                    setShowConfirmDialog(true);
                }
            )
            const ccHideDialog = CometChatUIEvents.ccHideDialog.subscribe(
                () => {
                    imageModerationDialogRef.current = null;
                    setShowConfirmDialog(false);
                }
            )
            const ccShowPanel = CometChatUIEvents.ccShowPanel.subscribe(
                (data: IPanel) => {
                    smartReplyViewRef.current = data.child;
                    setShowSmartReply(true);
                }
            )
            const ccHidePanel = CometChatUIEvents.ccHidePanel.subscribe(
                () => {
                    smartReplyViewRef.current = null;
                    setShowSmartReply(false);
                    unreadMessageLabelRef.current = false;
                }
            )
            const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
                (item: IGroupMemberAdded) => {
                    item.messages.map((message) => {
                        groupActionMessageReceived(message, item.userAddedIn)
                    });
                }
            );
            const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
                (item: IGroupMemberKickedBanned) => {
                    groupActionMessageReceived(item.message, item.kickedFrom)
                }
            );
            const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
                (item: IGroupMemberKickedBanned) => {
                    groupActionMessageReceived(item.message, item.kickedFrom)
                }
            );
            const ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(
                (item: IGroupMemberScopeChanged) => {
                    groupActionMessageReceived(item.message, item.group)
                }
            );
            const ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
                (item: IGroupLeft) => {
                    groupActionMessageReceived(item.message, item.leftGroup)
                }
            );
            const ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe(
                (obj: IMessages) => {
                    if (obj?.status === MessageStatus.success) {
                        updateMessage(obj.message, false);
                    }
                }
            );
            const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(
                (obj: IMessages) => {
                    let { message, status } = obj;
                    switch (status) {
                        case MessageStatus.inprogress: {
                            setScrollListToBottom(true);
                            addMessage(message);
                            playAudio();
                            break;
                        }
                        case MessageStatus.success: {
                            if (message.getParentMessageId()) {
                                updateReplyCount(message);
                            }
                            updateMessage(message, true);
                            break;
                        }
                    }
                }
            );

            return () => {
                try {
                    ccMessageEdit?.unsubscribe();
                    ccMessageSent?.unsubscribe();
                    ccGroupMemberAdded?.unsubscribe();
                    ccGroupMemberBanned?.unsubscribe();
                    ccGroupMemberKicked?.unsubscribe();
                    ccGroupMemberScopeChanged?.unsubscribe();
                    ccGroupLeft?.unsubscribe();
                    ccShowOngoingCall?.unsubscribe();
                    ccOutgoingCall?.unsubscribe();
                    ccCallEnded?.unsubscribe()
                    ccCallRejected?.unsubscribe();
                    ccCallAccepted?.unsubscribe();
                    ccShowDialog?.unsubscribe();
                    ccHideDialog?.unsubscribe();
                    ccShowPanel?.unsubscribe();
                    ccHidePanel?.unsubscribe();
                } catch (error: any) {
                    onErrorCallback(error);
                }
            }
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [setShowSmartReply, setScrollListToBottom, groupActionMessageReceived, updateMessage, addMessage, playAudio, updateReplyCount, parentMessageId, onErrorCallback, smartReplyViewRef.current, setShowConfirmDialog, callActionMessageReceived])

    Hooks(
        loggedInUser,
        setLoggedInUser,
        messageListManager,
        fetchPreviousMessages,
        handleRealTimeMessages,
        messagesRequestBuilder,
        user,
        group,
        subscribeToEvents,
        messageIdRef,
        messagesCountRef,
        messageList,
        onErrorCallback,
        setMessageList,
        setScrollListToBottom,
        smartReplyViewRef,
        setShowSmartReply
    );

    const isDateDifferent = useCallback((firstDate: number | undefined, secondDate: number | undefined) => {
        try {
            let firstDateObj: Date, secondDateObj: Date;
            firstDateObj = new Date(firstDate! * 1000);
            secondDateObj = new Date(secondDate! * 1000);
            return firstDateObj.getDate() !== secondDateObj.getDate() || firstDateObj.getMonth() !== secondDateObj.getMonth() || firstDateObj.getFullYear() !== secondDateObj.getFullYear();
        } catch (error: any) {
            onErrorCallback(error);
        }
    }, [onErrorCallback])

    const getLoaderHtml = useMemo(() => {
        if (loadingStateView) {
            return (
                <div className="cc__messagelist__loadingview">
                    <span className="cc__messagelist__customview--loading">{loadingStateView}</span>
                </div>
            )
        } else {
            return (
                <div className="cc__messagelist__loadingview">
                    <cometchat-loader iconURL={loadingIconURL} loaderStyle={JSON.stringify(LoadingViewStyle(messageListStyle, theme))}></cometchat-loader>
                </div>
            );
        }
    }, [loadingStateView, loadingIconURL, messageListStyle])

    const getErrorHtml = useMemo(() => {
        if (errorStateView) {
            return (
                <div className="cc__messagelist__errorview">
                    <span className="cc__messagelist__customview--error">{errorStateView}</span>
                </div>
            )
        } else {
            return (
                <div className="cc__messagelist__errorview">
                    <cometchat-label labelStyle={JSON.stringify(ErrorViewStyle(messageListStyle, theme))} text={errorStateText}></cometchat-label>
                </div>
            )
        }
    }, [errorStateView, errorStateText, messageListStyle])

    const getEmptyHtml = useMemo(() => {
        if (emptyStateView) {
            return (
                <div className="cc__messagelist__emptyview">
                    <span className="cc__messagelist__customview--empty">{emptyStateView}</span>
                </div>
            )
        } else {
            return (
                <div className="cc__messagelist__emptyview">
                    <cometchat-label labelStyle={JSON.stringify(EmptyViewStyle(messageListStyle, theme))} text={emptyStateText}></cometchat-label>
                </div>
            )
        }
    }, [emptyStateView, emptyStateText, messageListStyle])

    const showHeaderTitle = useCallback((message: CometChat.BaseMessage) => {
        if (alignment === MessageListAlignment.left) {
            return true
        } else {
            if (groupRef.current && message?.getCategory() !== CometChatUIKitConstants.MessageCategory.action && !message?.getDeletedAt() && message?.getSender() && message?.getSender()?.getUid() !== loggedInUser?.getUid() && alignment === MessageListAlignment.standard) {
                return true
            } else {
                return false
            }
        }
    }, [alignment, loggedInUser])

    const getBubbleLeadingView = useCallback((item: CometChat.BaseMessage) => {
        if (item?.getCategory() !== CometChatUIKitConstants.MessageCategory.action && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call && showAvatar && showHeaderTitle(item)) {
            return (
                <div>
                    <cometchat-avatar name={item?.getSender()?.getName()} avatarStyle={JSON.stringify(MessageAvatarStyle(avatarStyle, theme))} image={item?.getSender()?.getAvatar()}></cometchat-avatar>
                </div>
            )
        } else {
            return null;
        }
    }, [showAvatar, avatarStyle, showHeaderTitle])

    const getMessageBubbleDate = useCallback((item: CometChat.BaseMessage, i: number) => {
        if (i === 0) {
            return (
                <div className="cc__messagelist__date__container" style = {{display: "flex", justifyContent: "center"}}>
                    <span className="cc__messagelist__date">
                        <cometchat-date timestamp={item.getSentAt()} pattern={DateSeparatorPattern} dateStyle={JSON.stringify(MessageDateStyle(dateSeparatorStyle, theme))}></cometchat-date>
                    </span>
                </div>
            )
        } else {
            if (isDateDifferent(messageList[i - 1]?.getSentAt(), item?.getSentAt())) {
                return (
                    <div className="cc__messagelist__date__container" style = {{display: "flex", justifyContent: "center"}}>
                        <span className="cc__messagelist__date">
                            <cometchat-date timestamp={item.getSentAt()} pattern={DateSeparatorPattern} dateStyle={JSON.stringify(MessageDateStyle(dateSeparatorStyle, theme))}></cometchat-date>
                        </span>
                    </div>
                )
            } else {
                return null;
            }
        }
    }, [DateSeparatorPattern, messageList, dateSeparatorStyle, isDateDifferent, theme]);

    const getBubbleHeaderDate = useCallback((item: CometChat.BaseMessage) => {
        return (
            <>
                <cometchat-date timestamp={item.getSentAt()} dateStyle={JSON.stringify(MessageBubbleDateStyle(messageListStyle, theme))} pattern={datePattern}></cometchat-date>
            </>
        )
    }, [messageListStyle, datePattern])

    const getBubbleHeaderTitle = useCallback((item: CometChat.BaseMessage) => {
        return (
            <>
                <cometchat-label text={item?.getSender()?.getName()} labelStyle={JSON.stringify(MessageLabelStyle)}></cometchat-label>
            </>
        )
    }, [])

    const getBubbleHeader = useCallback((item: CometChat.BaseMessage) => {
        if (getHeaderView(item)) {
            return getHeaderView(item);
        } else {
            if (item?.getCategory() !== CometChatUIKitConstants.MessageCategory.action && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call) {
                return (
                    <div className="cc__messagelist__bubbleheader">
                        {showHeaderTitle(item) ? getBubbleHeaderTitle(item) : null}
                        {timestampAlignment === timestampEnum.top ? getBubbleHeaderDate(item) : null}
                    </div>
                )
            } else {
                return null;
            }
        }
    }, [timestampAlignment, getBubbleHeaderDate, showHeaderTitle, getHeaderView, getBubbleHeaderTitle])

    const getBubbleFooterDate = useCallback((item: CometChat.BaseMessage) => {
        if (timestampAlignment === timestampEnum.bottom && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.action && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call) {
            return (
                <div className="cc__messagelist__bubbledate">
                    <cometchat-date timestamp={item.getSentAt()} dateStyle={JSON.stringify(MessageBubbleDateStyle(messageListStyle, theme))} pattern={datePattern}></cometchat-date>
                </div>
            )
        } else {
            return null;
        }
    }, [timestampAlignment, messageListStyle, datePattern])

    const getBubbleFooterReceipt = useCallback((item: CometChat.BaseMessage) => {
        if (!disableReceipt && (!item?.getSender() || loggedInUser?.getUid() === item?.getSender()?.getUid()) && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.action && item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call) {
            return (
                <div className="cc__messagelist__receipt">
                    <cometchat-receipt receiptStyle={JSON.stringify(MessageReceiptStyle(theme))} receipt={getMessageReceipt(item)} waitIcon={waitIcon} sentIcon={sentIcon} deliveredIcon={deliveredIcon} readIcon={readIcon} errorIcon={errorIcon}></cometchat-receipt>
                </div>
            )
        } else {
            return null;
        }
    }, [disableReceipt, waitIcon, sentIcon, deliveredIcon, readIcon, errorIcon, getMessageReceipt, loggedInUser])

    const getBubbleFooterView = useCallback((item: any) => {
        if (getFooterView(item)) {
            return (
                <div className="cc__messagelist__bubblefooter">
                    {getFooterView(item)}
                </div>
            )
        } else {
            return (
                <>
                    {getBubbleFooterDate(item)}
                    {getBubbleFooterReceipt(item)}
                </>
            );
        }
    }, [getBubbleFooterDate, getBubbleFooterReceipt, getFooterView])

    const getBubbleThreadView = useCallback((item: CometChat.BaseMessage) => {
        if (item?.getReplyCount() && !item?.getDeletedAt()) {
            return (
                <div className="cc__messagelist__threadreplies">
                    <cometchat-divider dividerStyle={JSON.stringify(dividerStyle(theme))}></cometchat-divider>
                    <cometchat-button text={getThreadCount(item)} buttonStyle={JSON.stringify(MessageThreadViewStyle(item, theme, loggedInUser))} iconURL={RightArrowIcon} onClick={() => { openThreadView(item) }}></cometchat-button>
                </div>
            )
        }
    }, [openThreadView, loggedInUser])

    const getMessageBubbleItem = useCallback((item: CometChat.BaseMessage, i: any) => {
        return (
            <div>
                <CometChatMessageBubble leadingView={getBubbleLeadingView(item)} headerView={getBubbleHeader(item)} footerView={getBubbleFooterView(item)} contentView={getContentView(item)} bottomView={getBottomView(item)} id={item?.getId() || item?.getMuid()} options={setMessageOptions(item)} messageBubbleStyle={MessageBubbleStyle(item, theme, alignment, loggedInUser)} alignment={setBubbleAlignment(item)} replyView={null} threadView={getBubbleThreadView(item)}></CometChatMessageBubble>
            </div>
        )
    }, [getBubbleLeadingView, getBubbleHeader, getBubbleFooterView, getContentView, alignment, setBubbleAlignment, getBubbleThreadView, setMessageOptions, loggedInUser])

    const getMessageBubble = useCallback((m: CometChat.BaseMessage, i: any) => {
        return (
            <div className="cc__messagelist__bubble" key={m.getId()}>
                {getMessageBubbleDate(m, i)}
                {getBubbleWrapper(m) ? getBubbleWrapper(m) : getMessageBubbleItem(m, i)}
            </div>
        )
    }, [getBubbleWrapper, getMessageBubbleDate, getMessageBubbleItem])

    const getMessageListFooter = useCallback(() => {
        return (
            <div>
                {smartReplyViewRef.current ? smartReplyViewRef.current : null}
                {footerView && !smartReplyViewRef.current ? footerView : null}
            </div>
        )
    }, [smartReplyViewRef.current, footerView, unreadMessageLabel, scrollToBottom])

    const getThreadCount = (message: CometChat.BaseMessage) => {
        const replyCount = message?.getReplyCount() || 0;
        const suffix = replyCount === 1 ? localize("REPLY") : localize("REPLIES");
        return `${localize("VIEW")} ${replyCount} ${suffix}`;
    }

    const getThreadedMessageBubble = useCallback((item: CometChat.BaseMessage) => {
        return (
            <>
                {getBubbleWrapper(item) ? <div>{getBubbleWrapper(item)}</div> : <CometChatMessageBubble leadingView={getBubbleLeadingView(item)} headerView={getBubbleHeader(item)} footerView={getBubbleFooterView(item)} contentView={getContentView(item)} bottomView={getBottomView(item)} id={item?.getId() || item?.getMuid()} messageBubbleStyle={MessageBubbleStyle(item, theme, alignment, loggedInUser)} alignment={threadedAlignment} replyView={null} threadView={null} options={setMessageOptions(item)}></CometChatMessageBubble>}
            </>
        );
    }, [getBubbleLeadingView, getBubbleHeader, getBubbleFooterView, getContentView, alignment, setMessageOptions, getBubbleWrapper, loggedInUser])

    const getListItem = useMemo(() =>  {
        return function (message: CometChat.BaseMessage, index: number): any {
            return getMessageBubble(message, index);
        }
    }, [getMessageBubble])

    const getListStyle = useMemo(() => {
        return new ListStyle({
          height: messageListStyle?.height || "100%",
          width: messageListStyle?.width || "100%",
          background: messageListStyle?.background || theme.palette.getBackground(),
        });
      }, [messageListStyle, theme]);

    const getCurrentMessageListState = useCallback(() => {
        return messageListState === States.loaded && messagesCountRef.current === 0 ? States.empty : messageListState
    }, [messageListState, messagesCountRef])

    return (
        <>
            <div className="cc__messagelist__wrapper" style={MessageListWrapperStyle(messageListStyle)}>
                <div className="cc__messagelist__headerview" style={MessageListHeaderStyle()}>
                    {
                        headerView ? headerView : null
                    }
                </div>

                <div className="cc__messagelist" style={MessageListDivStyle()}>
                    <CometChatList
                        title={''}
                        hideSearch={true}
                        showSectionHeader={false}
                        list={messageList}
                        listItem={getListItem}
                        onScrolledToBottom={onBottomCallback}
                        onScrolledToTop={onTopCallback}
                        listItemKey="getId"
                        state={getCurrentMessageListState()}
                        loadingView={getLoaderHtml}
                        loadingIconURL={loadingIconURL}
                        hideError={hideError}
                        errorStateView={getErrorHtml}
                        errorStateText={errorStateText}
                        emptyStateView={getEmptyHtml}
                        emptyStateText={emptyStateText}
                        scrollToBottom={scrollListToBottom}
                        theme={theme}
                        listStyle = {getListStyle}
                    />
                    {
                        unreadMessageLabelRef.current && UnreadCountRef.current && UnreadCountRef.current.length > 0 && !isOnBottom ?
                            <div style={MessageListUnreadLabelStyle()}>
                                <div className="cc__messagelist__messageindicator" style={MessageListMessageIndicatorStyle()}>
                                    <cometchat-button text={newMessageCountRef.current} buttonStyle={JSON.stringify(unreadMessageStyle())} onClick={scrollToBottom}></cometchat-button>
                                </div>
                            </div> :
                            null
                    }
                </div>
                

                <div className="cc__messagelist__footerview" style={MessageListFooterStyle()}>
                    {getMessageListFooter()}
                </div>
            </div>

            {
                showOngoingCall ?
                    ongoingCallView :
                    null
            }
            
            {
                showConfirmDialog && imageModerationDialogRef.current ?
                    imageModerationDialogRef.current :
                    null
            }
        </>
    );
}

CometChatMessageList.defaultProps = defaultProps;
export { CometChatMessageList };