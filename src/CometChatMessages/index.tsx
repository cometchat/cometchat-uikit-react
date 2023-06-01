import { useRef, useState, useMemo, useCallback, useContext } from "react";
import "my-cstom-package-lit";
import { CometChat } from "@cometchat-pro/chat";
import { MessagesStyle, MessageComposerConfiguration, MessageHeaderConfiguration, MessageListConfiguration, ThreadedMessagesConfiguration, DetailsConfiguration } from 'uikit-utils-lerna';
import { CometChatMessageEvents, CometChatGroupEvents, IGroupLeft, CometChatUserEvents } from "uikit-resources-lerna";
import { DefaultMessagesStyle, MessagesComposerDivStyle, MessagesDetailsDivStyle, MessagesDivStyle, MessagesHeaderDivStyle, MessagesListDivStyle, MessagesWrapperStyle, ThreadedMessagesDivStyle } from "./style";
import { CometChatMessageList } from "../CometChatMessageList";
import { CometChatMessageHeader } from "../CometChatMessageHeader";
import { CometChatMessageComposer } from "../CometChatMessageComposer";
import { Hooks } from "./hooks";
import { CometChatThreadedMessages } from "../CometChatThreadedMessages";
import { CometChatDetails } from "../CometChatDetails";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { CometChatContext } from "../CometChatContext";
import InfoIcon from './assets/Info.svg';
import LiveReactionIcon from './assets/heart-reaction.png';

interface IMessagesProps {
    user?: CometChat.User,
    group?: CometChat.Group,
    hideMessageComposer?: boolean,
    disableTyping?: boolean,
    messageHeaderConfiguration?: MessageHeaderConfiguration,
    messageListConfiguration?: MessageListConfiguration,
    messageComposerConfiguration?: MessageComposerConfiguration,
    threadedMessagesConfiguration?: ThreadedMessagesConfiguration,
    detailsConfiguration?: DetailsConfiguration,
    customSoundForIncomingMessages?: string,
    customSoundForOutgoingMessages?: string,
    disableSoundForMessages?: boolean,
    messagesStyle?: MessagesStyle,
    messageHeaderView?: any,
    messageComposerView?: any,
    messageListView?: any,
    hideMessageHeader?: boolean,
    hideDetails?: boolean,
    auxiliaryMenu?: any
}

const defaultProps: IMessagesProps = {
    user: undefined,
    group: undefined,
    hideMessageComposer: false,
    disableTyping: false,
    messageHeaderConfiguration: new MessageHeaderConfiguration({}),
    messageListConfiguration: new MessageListConfiguration({}),
    messageComposerConfiguration: new MessageComposerConfiguration({}),
    threadedMessagesConfiguration: new ThreadedMessagesConfiguration({}),
    detailsConfiguration: new DetailsConfiguration({}),
    customSoundForIncomingMessages: '',
    customSoundForOutgoingMessages: '',
    disableSoundForMessages: false,
    messagesStyle: new MessagesStyle({
        width: "100%",
        height: "100%",
        background: "white",
        borderRadius: "none",
        border: "1px solid rgba(20, 20, 20, 0.1)",
        messageTextColor: "rgba(20, 20, 20, 0.33)",
        messageTextFont: "700 22px Inter",
    }),
    messageHeaderView: null,
    messageComposerView: null,
    messageListView: null,
    hideMessageHeader: false,
    hideDetails: false,
    auxiliaryMenu: null
};

const detailsButtonStyle = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: "0",
    background: "transparent",
    buttonIconTint: "#3399FF",
    padding: 0
};

const CometChatMessages = (props: IMessagesProps) => {
    const {theme} = useContext(CometChatContext);

    const {
        user,
        group,
        hideMessageComposer,
        disableTyping,
        messageHeaderConfiguration,
        messageListConfiguration,
        messageComposerConfiguration,
        threadedMessagesConfiguration,
        detailsConfiguration,
        customSoundForIncomingMessages,
        customSoundForOutgoingMessages,
        disableSoundForMessages,
        messagesStyle,
        messageHeaderView,
        messageComposerView,
        messageListView,
        hideMessageHeader,
        hideDetails,
        auxiliaryMenu
    } = props;

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);

    const [activeUser, setActiveUser] = useState(user);
    const [activeGroup, setActiveGroup] = useState(group);

    const ccHeaderMenuRef = useRef(null);
    const threadMessageObjectRef = useRef<CometChat.BaseMessage | null>(null);
    const parentBubbleViewCallbackRef = useRef<Function | null>(null);

    const [liveReaction, setLiveReaction] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    const [openThreadedMessages, setOpenThreadedMessages] = useState(false);

    let messagesRequestBuilder = useMemo(()=> {
        if(user) {
            return new CometChat.MessagesRequestBuilder().setUID(user.getUid()).setCategories(ChatConfigurator.getDataSource().getAllMessageCategories()).setTypes(ChatConfigurator.getDataSource().getAllMessageTypes()).setLimit(20).hideReplies(true);
        } else if (group) {
            return new CometChat.MessagesRequestBuilder().setGUID(group.getGuid()).setCategories(ChatConfigurator.getDataSource().getAllMessageCategories()).setTypes(ChatConfigurator.getDataSource().getAllMessageTypes()).setLimit(20).hideReplies(true);
        }
    }, [user, group]);
    

    let reactionName: string = LiveReactionIcon,
        infoIconURL: string = InfoIcon;

    const getMessagesStyle = useCallback(() => {
        let defaultStyle: MessagesStyle = DefaultMessagesStyle(theme);
        return { ...defaultStyle, ...messagesStyle };
    }, [messagesStyle, theme]);

    const liveReactionStart = useCallback((reactionName : string) => {
        if (liveReaction) {
            reactionName = "";
            setLiveReaction(false);
        } else {
            setLiveReaction(true);
            setTimeout(
                () => {
                    reactionName = "";
                    setLiveReaction(false);
                },
                1500
            );
        }
    }, [liveReaction, setLiveReaction])

    const subscribeToEvents = useCallback(() => {
        try {
            const ccLiveReaction = CometChatMessageEvents.ccLiveReaction.subscribe(
                (reactionName: any) => {
                    liveReactionStart(reactionName);
                }
            );
            const ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe(
                (value: CometChat.Group) => {
                    if (activeGroup && activeGroup.getGuid() === group?.getGuid()) {
                        setOpenDetails(false);
                        setOpenThreadedMessages(false);
                        setActiveGroup(value);
                    }
                }
            );
            const ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
                (item: IGroupLeft) => {
                    if (activeGroup?.getGuid() === item.leftGroup.getGuid()) {
                        if (loggedInUser?.getUid() === item?.userLeft.getUid()) {
                            setOpenDetails(false);
                            setOpenThreadedMessages(false);
                        }
                        setActiveGroup(item.leftGroup);
                    }
                }
            );
            const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(
                (blockedUser: CometChat.User) => {
                    if (activeUser?.getUid() === blockedUser.getUid()) {
                        blockedUser.setBlockedByMe(true);
                        setActiveUser(blockedUser);
                    }
                }
            );
            const ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe(
                (unblockedUser: CometChat.User) => {
                    if (activeUser?.getUid() === unblockedUser.getUid()) {
                        unblockedUser.setBlockedByMe(false);
                        setActiveUser(unblockedUser);
                    }
                }
            );

            return () => {
                try {
                    ccLiveReaction?.unsubscribe();
                    ccGroupDeleted?.unsubscribe();
                    ccGroupLeft?.unsubscribe();
                    ccUserBlocked?.unsubscribe();
                    ccUserUnBlocked?.unsubscribe();
                } catch (error: any) {
                    console.log('error', error)
                }
            }
        } catch (error: any) {
            console.log('error', error)
        }
    }, [liveReactionStart, setOpenDetails, setOpenThreadedMessages, activeGroup, activeUser, loggedInUser, group]);

    const openThreadView = (message: CometChat.BaseMessage, callback: Function) => {
        threadMessageObjectRef.current = message;
        parentBubbleViewCallbackRef.current = callback;
        setOpenThreadedMessages(true);
    }

    const openDetailsPage = () => {
        setOpenDetails(true);
    }

    const closeDetailsPage = () => {
        setOpenDetails(false);
    }

    const closeThreadView = () => {
        threadMessageObjectRef.current = null;
        parentBubbleViewCallbackRef.current = null;
        setOpenThreadedMessages(false);
    }

    const chatListStyle = () => {
        let defaultMessagesStyle = getMessagesStyle();
        return {
            background: defaultMessagesStyle.background || theme.palette.getBackground(),
            height: defaultMessagesStyle.height,
            width: defaultMessagesStyle.width,
            border: defaultMessagesStyle.border,
            borderRadius: defaultMessagesStyle.borderRadius
        }
    }

    const getHeaderMenu = useCallback(() => {
        const defaultAuxiliaryMenu = ChatConfigurator.getDataSource().getAuxiliaryHeaderMenu(activeUser, activeGroup);
        return(
            <>
                { 
                    auxiliaryMenu ? 
                        auxiliaryMenu : 
                        defaultAuxiliaryMenu.map((auxMenu : any) => auxMenu)
                }
                { !hideDetails ? <div className="cc__messages__header__menu__wrapper" style={{ height: '100%', width: '100%', border: 'none', background: 'transparent', borderRadius: 0}}><cometchat-button iconURL={infoIconURL} buttonStyle={JSON.stringify(detailsButtonStyle)} ref={ccHeaderMenuRef} onClick={openDetailsPage}></cometchat-button></div> : null }
            </>
        );
    }, [auxiliaryMenu, activeUser, activeGroup, hideDetails, infoIconURL]);

    Hooks(
        loggedInUser,
        setLoggedInUser,
        subscribeToEvents,
        ccHeaderMenuRef,
        setOpenDetails,
        messageListConfiguration,
        user ?? null,
        setActiveUser,
        group ?? null,
        setActiveGroup
    )

    return (
        <div className="cc__messages__wrapper" style={MessagesWrapperStyle(theme)}>
            {
                activeUser || activeGroup ?

                    <div className="cc__messages" style={{ ...chatListStyle(), ...MessagesDivStyle }}>
                        <div style={{ height: '100%', width: '100%' }}>
                        {
                            !hideMessageHeader ?
                                <div className="cc__messages__header" style={MessagesHeaderDivStyle}>
                                    {messageHeaderView ?
                                        messageHeaderView :
                                        <CometChatMessageHeader
                                            user={activeUser}
                                            group={activeGroup}
                                            subtitleView={messageHeaderConfiguration?.subtitleView}
                                            disableUsersPresence={messageHeaderConfiguration?.disableUsersPresence}
                                            protectedGroupIcon={messageHeaderConfiguration?.protectedGroupIcon}
                                            privateGroupIcon={messageHeaderConfiguration?.privateGroupIcon}
                                            menu={messageHeaderConfiguration?.menu ? messageHeaderConfiguration.menu : getHeaderMenu()}
                                            avatarStyle={messageHeaderConfiguration?.avatarStyle}
                                            statusIndicatorStyle={messageHeaderConfiguration?.statusIndicatorStyle}
                                            messageHeaderStyle={messageHeaderConfiguration?.messageHeaderStyle}
                                            listItemStyle={messageHeaderConfiguration?.listItemStyle}
                                            backButtonIconURL={messageHeaderConfiguration?.backButtonIconURL}
                                            hideBackButton={messageHeaderConfiguration?.hideBackButton}
                                            listItemView={messageHeaderConfiguration?.listItemView}
                                            onError={messageHeaderConfiguration?.onError}
                                            onBack={messageHeaderConfiguration?.onBack}
                                            disableTyping={disableTyping}
                                        />
                                    }
                                </div>
                                : null
                        }

                        {
                            messageListView ?
                                messageListView :
                                <div className="cc__messages__list" style={MessagesListDivStyle}>
                                    <CometChatMessageList
                                        user={activeUser}
                                        group={activeGroup}
                                        emptyStateView={messageListConfiguration?.emptyStateView}
                                        errorStateView={messageListConfiguration?.errorStateView}
                                        loadingStateView={messageListConfiguration?.loadingStateView}
                                        disableSoundForMessages={disableSoundForMessages}
                                        customSoundForMessages={customSoundForIncomingMessages}
                                        disableReceipt={messageListConfiguration?.disableReceipt}
                                        readIcon={messageListConfiguration?.readIcon}
                                        deliveredIcon={messageListConfiguration?.deliveredIcon}
                                        sentIcon={messageListConfiguration?.sentIcon}
                                        waitIcon={messageListConfiguration?.waitIcon}
                                        errorIcon={messageListConfiguration?.errorIcon}
                                        alignment={messageListConfiguration?.alignment}
                                        showAvatar={messageListConfiguration?.showAvatar}
                                        datePattern={messageListConfiguration?.datePattern}
                                        timestampAlignment={messageListConfiguration?.timestampAlignment}
                                        DateSeparatorPattern={messageListConfiguration?.DateSeparatorPattern}
                                        templates={messageListConfiguration?.messageTypes}
                                        messagesRequestBuilder={messageListConfiguration?.messagesRequestBuilder || messagesRequestBuilder}
                                        thresholdValue={messageListConfiguration?.thresholdValue}
                                        onThreadRepliesClick={messageListConfiguration?.onThreadRepliesClick || openThreadView}
                                        headerView={messageListConfiguration?.headerView}
                                        footerView={messageListConfiguration?.footerView}
                                        avatarStyle={messageListConfiguration?.avatarStyle}
                                        dateSeparatorStyle={messageListConfiguration?.dateSeparatorStyle}
                                        messageListStyle={messageListConfiguration?.messageListStyle}
                                        onError={messageListConfiguration?.onError}
                                    />
                                </div>
                        }

                        {
                            !hideMessageComposer ?
                                <div className="cc__messages__composer" style={MessagesComposerDivStyle(theme)}>
                                    {
                                        messageComposerView ?
                                            messageComposerView :
                                            <CometChatMessageComposer
                                                user={activeUser}
                                                group={activeGroup}
                                                text={messageComposerConfiguration?.text}
                                                headerView={messageComposerConfiguration?.headerView}
                                                onTextChange={messageComposerConfiguration?.onTextChange}
                                                attachmentIconURL={messageComposerConfiguration?.attachmentIconURL}
                                                attachmentOptions={messageComposerConfiguration?.attachmentOptions}
                                                secondaryButtonView={messageComposerConfiguration?.secondaryButtonView}
                                                auxiliaryButtonView={messageComposerConfiguration?.auxilaryButtonView}
                                                auxiliaryButtonAlignment={messageComposerConfiguration?.auxiliaryButtonsAlignment}
                                                sendButtonView={messageComposerConfiguration?.sendButtonView}
                                                hideLiveReaction={messageComposerConfiguration?.hideLiveReaction}
                                                LiveReactionIconURL={messageComposerConfiguration?.LiveReactionIconURL}
                                                messageComposerStyle={messageComposerConfiguration?.messageComposerStyle}
                                                onSendButtonClick={messageComposerConfiguration?.onSendButtonClick}
                                                onError={messageComposerConfiguration?.onError}
                                                disableSoundForMessages={disableSoundForMessages}
                                                customSoundForMessage={customSoundForOutgoingMessages}
                                            />
                                    }
                                </div>
                                : null
                        }
                        </div>
                        
                        {
                            openThreadedMessages && threadMessageObjectRef.current ?
                                <div className="cc__messages__threadedmessages" style={ThreadedMessagesDivStyle}>
                                    <CometChatThreadedMessages
                                        parentMessage={threadMessageObjectRef.current}
                                        onClose={threadedMessagesConfiguration?.onClose || closeThreadView}
                                        onError={threadedMessagesConfiguration?.onError}
                                        closeIconURL={threadedMessagesConfiguration?.closeIconURL}
                                        bubbleView={threadedMessagesConfiguration?.bubbleView || parentBubbleViewCallbackRef.current}
                                        messageActionView={threadedMessagesConfiguration?.messageActionView}
                                        messageListConfiguration={messageListConfiguration}
                                        messageComposerConfiguration={messageComposerConfiguration}
                                        threadedMessagesStyle={threadedMessagesConfiguration?.threadedMessagesStyle}
                                    />
                                </div> :
                                null
                        }

                    </div>
                    : null
            }

            {
                liveReaction ?
                    <div className="cc__messages__livereaction">
                        <cometchat-live-reaction reactionIconURL={reactionName}></cometchat-live-reaction>
                    </div> :
                    null
            }

            {
                openDetails ?
                    <div className="cc__messages__details" style={MessagesDetailsDivStyle}>
                        <CometChatDetails
                            user={activeUser}
                            group={activeGroup}
                            closeButtonIconURL={detailsConfiguration?.closeButtonIconURL}
                            hideProfile={detailsConfiguration?.hideProfile}
                            subtitleView={detailsConfiguration?.subtitleView}
                            customProfileView={detailsConfiguration?.customProfileView}
                            data={detailsConfiguration?.data ? (user, group) => detailsConfiguration?.data : undefined}
                            disableUsersPresence={detailsConfiguration?.disableUsersPresence}
                            privateGroupIcon={detailsConfiguration?.privateGroupIcon}
                            protectedGroupIcon={detailsConfiguration?.protectedGroupIcon}
                            onError={detailsConfiguration?.onError}
                            onClose={detailsConfiguration?.onClose || closeDetailsPage}
                            leaveDialogStyle={detailsConfiguration?.leaveDialogStyle}
                            statusIndicatorStyle={detailsConfiguration?.statusIndicatorStyle}
                            avatarStyle={detailsConfiguration?.avatarStyle}
                            detailsStyle={detailsConfiguration?.detailsStyle}
                            listItemStyle={detailsConfiguration?.listItemStyle}
                            groupMembersConfiguration={detailsConfiguration?.groupMembersConfiguration}
                            addMembersConfiguration={detailsConfiguration?.addMembersConfiguration}
                            bannedMembersConfiguration={detailsConfiguration?.bannedMembersConfiguration}
                            transferOwnershipConfiguration={detailsConfiguration?.transferOwnershipConfiguration}
                        />
                    </div> :
                    null
            }

        </div>
    );
}

CometChatMessages.defaultProps = defaultProps;
export { CometChatMessages };