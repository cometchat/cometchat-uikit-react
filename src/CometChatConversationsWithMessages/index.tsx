import { CometChat } from "@cometchat-pro/chat";
import { useCallback, useRef, useState, useContext } from "react";
import { CometChatConversationEvents, CometChatGroupEvents, CometChatUIKitConstants, fontHelper, IGroupLeft, IGroupMemberAdded, IGroupMemberJoined, IGroupMemberKickedBanned, IOwnershipChanged, localize } from "uikit-resources-lerna";
import { CometChatUIKitUtility, ConversationsConfiguration, MessagesConfiguration, WithMessagesStyle } from "uikit-utils-lerna";
import { CometChatConversations } from "../CometChatConversations";
import { CometChatMessages } from "../CometChatMessages";
import { Hooks } from "./hooks";
import { EmptyMessagesDivStyle, MobileLayoutStyle, WithMessagesMainStyle, WithMessagesSidebarStyle, WithMessagesWrapperStyle } from "./style";
import { CometChatContext } from "../CometChatContext"
import { useCometChatErrorHandler } from "../CometChatCustomHooks";

interface IConversationsWithMessagesProps {
    user?: CometChat.User,
    group?: CometChat.Group,
    isMobileView?: boolean,
    messageText?: string,
    conversationsWithMessagesStyle?: WithMessagesStyle,
    messagesConfiguration?: MessagesConfiguration,
    conversationsConfiguration?: ConversationsConfiguration,
    onError?: any,
}

const defaultProps: IConversationsWithMessagesProps = {
    user: undefined,
    group: undefined,
    isMobileView: false,
    messageText: localize("NO_CHATS_SELECTED"),
    conversationsWithMessagesStyle: {},
    messagesConfiguration: new MessagesConfiguration({}),
    conversationsConfiguration: new ConversationsConfiguration({}),
    onError: (error: CometChat.CometChatException) => { console.log(error) },
};

const CometChatConversationsWithMessages = (props: IConversationsWithMessagesProps) => {
    const { theme } = useContext(CometChatContext);
    const {
        user,
        group,
        isMobileView,
        messageText,
        conversationsWithMessagesStyle,
        messagesConfiguration,
        conversationsConfiguration,
        onError
    } = props;

    let labelStyle: any = {
        background: "transparent",
        textFont: "700 22px Inter",
        textColor: "rgba(20, 20, 20, 0.33)"
    },
        defaultWithMessagesStyle: WithMessagesStyle = new WithMessagesStyle({
            width: "100%",
            height: "100%",
            background: theme.palette.getBackground(),
            borderRadius: "none",
            border: "none",
            messageTextColor: theme.palette.getAccent600(),
            messageTextFont: fontHelper(theme.typography.title1),
        });

    const withMessagesStyleRef = useRef({ ...defaultWithMessagesStyle, ...conversationsWithMessagesStyle });

    labelStyle.textFont = withMessagesStyleRef.current.messageTextFont;
    labelStyle.textColor = withMessagesStyleRef.current.messageTextColor;

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

    const [activeConversation, setActiveConversation] = useState<CometChat.Conversation | null>(null);
    const [activeUser, setActiveUser] = useState(user ?? null);
    const [activeGroup, setActiveGroup] = useState(group ?? null);

    const onErrorCallback = useCometChatErrorHandler(onError);

    const setActiveChat = useCallback(
        async () => {
            try {
                let type: string = activeUser ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
                let conversationWith: string | undefined = activeUser ? activeUser?.getUid() : activeGroup?.getGuid();
                if (typeof conversationWith === "string") {
                    setActiveConversation(await CometChat.getConversation(conversationWith, type));
                }
            } catch (error: any) {
                onErrorCallback(error);
            }
        }, [activeUser, activeGroup, setActiveConversation, onErrorCallback]
    );

    const onBack = () => {
        setActiveUser(null);
        setActiveGroup(null);
        setActiveConversation(null);
    }

    const onItemClick = (conversation: CometChat.Conversation) => {
        try{
            setActiveConversation(conversation);
            if (conversation.getConversationType() && conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.user) {
                setActiveGroup(null);
                setActiveUser(conversation.getConversationWith() as CometChat.User);
            } else if (conversation.getConversationType() && conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
                setActiveUser(null);
                setActiveGroup(conversation.getConversationWith() as CometChat.Group);
            } else {
                return;
            }
        }catch(error: any){
            onErrorCallback(error);
        }
    };

    const removeActiveChatList = useCallback(
        (conversation: CometChat.Conversation) => {
            try {
                const conversationType = conversation.getConversationType();
                const conversationWith = conversation.getConversationWith();
                if (conversationType === CometChatUIKitConstants.MessageReceiverType.user && activeUser && activeUser.getUid() === (conversationWith as CometChat.User).getUid()) {
                    setActiveUser(null);
                } else if (conversationType === CometChatUIKitConstants.MessageReceiverType.group && activeGroup && activeGroup.getGuid() === (conversationWith as CometChat.Group).getGuid()) {
                    setActiveGroup(null);
                } else {
                    return;
                }
            } catch (error: any) {
                onErrorCallback(error);
            }
        }, [activeGroup, setActiveGroup, activeUser, setActiveUser, onErrorCallback]
    )

    const subscribeToEvents = useCallback(
        () => {
            try{
                const ccConversationDeleted = CometChatConversationEvents.ccConversationDeleted.subscribe(
                    (conversation: CometChat.Conversation) => {
                        removeActiveChatList(conversation);
                    }
                );
                const ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe(
                    (group: CometChat.Group) => {
                        if (activeGroup && activeGroup.getGuid() === group.getGuid()) {
                            setActiveConversation(null);
                            setActiveGroup(null);
                        }
                    }
                );
                const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
                    (item: IGroupMemberAdded) => {
                        if (activeGroup && activeGroup.getGuid() === item?.userAddedIn!.getGuid()) {
                            setActiveGroup(item?.userAddedIn);
                        }
                    }
                )
                const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
                    (item: IGroupMemberKickedBanned) => {
                        if (activeGroup && activeGroup.getGuid() === item?.kickedFrom!.getGuid()) {
                            setActiveGroup(item?.kickedFrom);
                        }
                    }
                )
                const ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe(
                    (item: IGroupMemberJoined) => {
                        if (activeGroup && activeGroup.getGuid() === item?.joinedGroup!.getGuid()) {
                            setActiveGroup(item?.joinedGroup);
                        }
                    }
                )
                const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
                    (item: IGroupMemberKickedBanned) => {
                        if (activeGroup && activeGroup.getGuid() === item?.kickedFrom!.getGuid()) {
                            setActiveGroup(item?.kickedFrom);
                        }
                    }
                )
                const ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe(
                    (item: IOwnershipChanged) => {
                        if (activeGroup && activeGroup.getGuid() === item?.group!.getGuid()) {
                            setActiveGroup(item?.group);
                            setActiveConversation(
                                prevState => {
                                    if (prevState) {
                                        let tempConversation : CometChat.Conversation = CometChatUIKitUtility.clone(prevState);
                                    tempConversation.setConversationWith(item?.group);
                                    return tempConversation;
                                    }
                                    return prevState;
                                }
                            );
                        }
                    }
                );
                const ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
                    (item: IGroupLeft) => {
                        if (activeGroup && activeGroup.getGuid() === item?.leftGroup!.getGuid() && loggedInUser?.getUid() === item?.userLeft?.getUid()) {
                            setActiveGroup(null);
                            setActiveConversation(null);
                        }
                    }
                );

                return () => {
                    try{
                        ccConversationDeleted?.unsubscribe();
                        ccGroupDeleted?.unsubscribe();
                        ccGroupMemberAdded?.unsubscribe();
                        ccGroupMemberBanned?.unsubscribe();
                        ccGroupMemberJoined?.unsubscribe();
                        ccGroupMemberKicked?.unsubscribe();
                        ccOwnershipChanged?.unsubscribe();
                        ccGroupLeft?.unsubscribe();
                    }catch(error: any){
                        onErrorCallback(error);
                    }
                }
            }catch(error: any){
                onErrorCallback(error);
            }
        }, [activeGroup, setActiveConversation, setActiveGroup, removeActiveChatList, onErrorCallback, loggedInUser]
    )

    const emptyMessageStyle = () => {
        return {
            background: withMessagesStyleRef.current.background || theme.palette.getBackground(),
            height: withMessagesStyleRef.current.height,
            width: `calc(${withMessagesStyleRef.current.width} - 280px)`,
            border: withMessagesStyleRef.current.border,
            borderRadius: withMessagesStyleRef.current.borderRadius,
        }
    }

    const chatsWrapperStyles = () => {
        return {
            height: withMessagesStyleRef.current.height,
            width: withMessagesStyleRef.current.width,
            border: withMessagesStyleRef.current.border,
            borderRadius: withMessagesStyleRef.current.borderRadius,
            background: withMessagesStyleRef.current.background || theme.palette.getBackground(),
        }
    }

    const getWithMessagesSidebarStyle = useCallback(
        () => {
            if(isMobileView){
                return MobileLayoutStyle;
            }else{
                return WithMessagesSidebarStyle;
            }
        }, [isMobileView]
    );

    const getWithMessagesMainStyle = useCallback(
        () => {
            if(isMobileView){
                return MobileLayoutStyle;
            }else{
                return WithMessagesMainStyle;
            }
        }, [isMobileView]
    );

    function makeMessageHeaderConfiguration(messagesConfiguration : MessagesConfiguration | undefined) {
        let messageHeaderConfiguration = CometChatUIKitUtility.clone(messagesConfiguration?.messageHeaderConfiguration);
        if (!messageHeaderConfiguration) {
            return undefined;
        }
        if (!messageHeaderConfiguration.onBack) {
            messageHeaderConfiguration.onBack = onBack; 
        }
        if (isMobileView) {
            messageHeaderConfiguration.hideBackButton = false;
        }
        else {
            messageHeaderConfiguration.hideBackButton = true;
        }
        return messageHeaderConfiguration;
    }

    Hooks(
        loggedInUser,
        setLoggedInUser,
        subscribeToEvents,
        onErrorCallback,
        setActiveChat,
        user,
        group
    );

    return(
        <div className="cc__withmessages__wrapper" style={{...WithMessagesWrapperStyle, ...chatsWrapperStyles()}}>
            <div className="cc__withmessages__sidebar" style={getWithMessagesSidebarStyle()}>
                <CometChatConversations
                    activeConversation= {activeConversation ?? undefined}
                    onItemClick= {conversationsConfiguration?.onItemClick || onItemClick}
                    conversationsStyle= {conversationsConfiguration?.conversationsStyle}
                    subtitleView= {conversationsConfiguration?.subtitleView}
                    options= {conversationsConfiguration?.options ?? undefined}
                    disableUsersPresence= {conversationsConfiguration?.disableUsersPresence}
                    disableReceipt= {conversationsConfiguration?.disableReceipt}
                    disableTyping= {conversationsConfiguration?.disableTyping}
                    deliveredIcon= {conversationsConfiguration?.deliveredIcon}
                    readIcon= {conversationsConfiguration?.readIcon}
                    waitIcon= {conversationsConfiguration?.waitIcon}
                    errorIcon= {conversationsConfiguration?.errorIcon}
                    datePattern= {conversationsConfiguration?.datePattern}
                    receiptStyle= {conversationsConfiguration?.receiptStyle}
                    sentIcon= {conversationsConfiguration?.sentIcon}
                    privateGroupIcon= {conversationsConfiguration?.privateGroupIcon}
                    protectedGroupIcon= {conversationsConfiguration?.protectedGroupIcon}
                    customSoundForMessages= {conversationsConfiguration?.customSoundForMessages}
                    conversationsRequestBuilder= {conversationsConfiguration?.conversationsRequestBuilder}
                    emptyStateView= {conversationsConfiguration?.emptyStateView}
                    onSelect= {conversationsConfiguration?.onSelect}
                    loadingIconURL= {conversationsConfiguration?.loadingIconURL}
                    errorStateView= {conversationsConfiguration?.errorStateView}
                    loadingStateView= {conversationsConfiguration?.loadingStateView}
                    titleAlignment= {conversationsConfiguration?.titleAlignment}
                    listItemView= {conversationsConfiguration?.listItemView}
                    menus= {conversationsConfiguration?.menu}
                    hideSeparator= {conversationsConfiguration?.hideSeparator}
                    hideError= {conversationsConfiguration?.hideError}
                    selectionMode= {conversationsConfiguration?.selectionMode}
                    disableSoundForMessages= {conversationsConfiguration?.disableSoundForMessages}
                    deleteConversationDialogStyle= {conversationsConfiguration?.deleteConversationDialogStyle}
                    badgeStyle= {conversationsConfiguration?.badgeStyle}
                    dateStyle= {conversationsConfiguration?.dateStyle}
                    listItemStyle= {conversationsConfiguration?.listItemStyle}
                    backdropStyle={conversationsConfiguration?.backdropStyle}
                />
            </div>

            {
                activeUser || activeGroup ? 
                    <div className="cc__withmessages__main" style={getWithMessagesMainStyle()}>
                        <CometChatMessages
                            user = {activeUser ?? undefined}
                            group = {activeGroup ?? undefined}
                            messageHeaderConfiguration = {makeMessageHeaderConfiguration(messagesConfiguration)}
                            messageListConfiguration = {messagesConfiguration?.messageListConfiguration}
                            messageComposerConfiguration = {messagesConfiguration?.messageComposerConfiguration}
                            messagesStyle = {messagesConfiguration?.messagesStyle}
                            customSoundForIncomingMessages = {messagesConfiguration?.customSoundForIncomingMessages}
                            customSoundForOutgoingMessages = {messagesConfiguration?.customSoundForOutgoingMessages}
                            detailsConfiguration = {messagesConfiguration?.detailsConfiguration}
                            disableSoundForMessages = {messagesConfiguration?.disableSoundForMessages}
                            disableTyping = {messagesConfiguration?.disableTyping}
                            hideMessageComposer = {messagesConfiguration?.hideMessageComposer}
                            hideMessageHeader = {messagesConfiguration?.hideMessageHeader}
                            messageComposerView = {messagesConfiguration?.messageComposerView}
                            messageHeaderView = {messagesConfiguration?.messageHeaderView}
                            messageListView = {messagesConfiguration?.messageListView}
                        />
                    </div>
                : null
            }
            
            {
                !activeUser && !activeGroup ?
                    <div className="cc__decorator__message--empty" style={{...EmptyMessagesDivStyle, ...emptyMessageStyle()}}>
                        <cometchat-label text={messageText} labelStyle={JSON.stringify(labelStyle)}></cometchat-label>
                    </div> :
                    null
            }
            
        </div>
    );
}

CometChatConversationsWithMessages.defaultProps = defaultProps;
export { CometChatConversationsWithMessages };
