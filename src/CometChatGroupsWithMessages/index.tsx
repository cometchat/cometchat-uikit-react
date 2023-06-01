import { CometChat } from "@cometchat-pro/chat";
import { CreateGroupStyle, JoinGroupStyle, ListItemStyle } from "my-cstom-package-lit";
import { useCallback, useRef, useState, useContext, JSX } from "react";
import { CometChatGroupEvents, CometChatUIKitConstants, fontHelper, IGroupLeft, IGroupMemberAdded, IGroupMemberJoined, IGroupMemberKickedBanned, IOwnershipChanged, localize } from "uikit-resources-lerna";
import { CreateGroupConfiguration, GroupsConfiguration, JoinGroupConfiguration, MessageHeaderStyle, MessagesConfiguration, WithMessagesStyle } from "uikit-utils-lerna";
import { CometChatGroups } from "../CometChatGroups";
import { CometChatMessageHeader } from "../CometChatMessageHeader";
import { CometChatMessages } from "../CometChatMessages";
import { Hooks } from "./hooks";
import { EmptyMessagesDivStyle, MobileLayoutStyle, WithMessagesMainStyle, WithMessagesSidebarStyle, WithMessagesWrapperStyle } from "./style";
import { CometChatContext } from "../CometChatContext";
import CreateIcon from "./assets/create-button.svg";
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";

interface IGroupsWithMessagesProps {
    group?: CometChat.Group,
    isMobileView?: boolean,
    messageText?: string,
    groupsWithMessagesStyle?: WithMessagesStyle,
    messagesConfiguration?: MessagesConfiguration,
    groupsConfiguration?: GroupsConfiguration,
    createGroupConfiguration?: CreateGroupConfiguration,
    joinGroupConfiguration?: JoinGroupConfiguration,
    onError?: any,
    hideCreateGroup?: boolean
}

const defaultProps: IGroupsWithMessagesProps = {
    group: undefined,
    isMobileView: false,
    messageText: localize("NO_CHATS_SELECTED"),
    groupsWithMessagesStyle: {},
    messagesConfiguration: new MessagesConfiguration({}),
    groupsConfiguration: new GroupsConfiguration({}),
    createGroupConfiguration: new CreateGroupConfiguration({}),
    joinGroupConfiguration: new JoinGroupConfiguration({}),
    onError: (error: CometChat.CometChatException) => { console.log(error) },
    hideCreateGroup: false
};

const createGroupButtonStyle: any = {
    height: "24px",
    width: "24px",
    border: "none",
    borderRadius: '0',
    background: "transparent",
    buttonIconTint: "RGB(51, 153, 255)"
};

const CometChatGroupsWithMessages = (props: IGroupsWithMessagesProps) => {
    const { theme } = useContext(CometChatContext);
    const {
        group,
        isMobileView,
        messageText,
        groupsWithMessagesStyle,
        messagesConfiguration,
        groupsConfiguration,
        createGroupConfiguration,
        joinGroupConfiguration,
        onError,
        hideCreateGroup
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
        }),
        defaultCreateGroupStyle: CreateGroupStyle = new CreateGroupStyle({
            boxShadow: `${theme.palette.getAccent100()} 4px 16px 32px 4px`,
            groupTypeTextFont: fontHelper(theme.typography.subtitle2),
            groupTypeBorder: `1px solid ${theme.palette.getAccent600()}`,
            groupTypeBorderRadius: "0",
            groupTypeTextColor: theme.palette.getAccent(),
            groupTypeTextBackground: "transparent",
            groupTypeBackground: theme.palette.getAccent100(),
            groupTypeBoxShadow: "",
            activeGroupTypeTextFont: fontHelper(theme.typography.subtitle2),
            activeGroupTypeTextColor: theme.palette.getAccent(),
            activeGroupTypeBackground: theme.palette.getAccent900(),
            activeGroupTypeBoxShadow: `${theme.palette.getAccent200()} 0 3px 8px 0`,
            activeGroupTypeBorderRadius: "8px",
            activeGroupTypeBorder: "none",
            groupTypeTextBoxShadow: "none",
            groupTypeTextBorderRadius: "0",
            closeIconTint: theme.palette.getPrimary(),
            titleTextFont: fontHelper(theme.typography.title1),
            titleTextColor: theme.palette.getAccent(),
            errorTextFont: fontHelper(theme.typography.subtitle1),
            errorTextBackground: theme.palette.getError(),
            errorTextBorderRadius: "8px",
            errorTextBorder: "none",
            errorTextColor: theme.palette.getError(),
            nameInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
            nameInputPlaceholderTextColor: theme.palette.getAccent600(),
            nameInputBackground: theme.palette.getAccent100(),
            nameInputTextFont: fontHelper(theme.typography.subtitle1),
            nameInputTextColor: theme.palette.getAccent(),
            nameInputBorder: "none",
            nameInputBorderRadius: "8px",
            nameInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
            passwordInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
            passwordInputPlaceholderTextColor: theme.palette.getAccent600(),
            passwordInputBackground: theme.palette.getAccent100(),
            passwordInputBorder: "none",
            passwordInputBorderRadius: "8px",
            passwordInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
            passwordInputTextFont: fontHelper(theme.typography.subtitle1),
            passwordInputTextColor: theme.palette.getAccent(),
            createGroupButtonTextFont: fontHelper(theme.typography.text2),
            createGroupButtonTextColor: theme.palette.getAccent900("light"),
            createGroupButtonBackground: theme.palette.getPrimary(),
            createGroupButtonBorderRadius: "8px",
            createGroupButtonBorder: "none",
            height: "620px",
            width: "360px",
            borderRadius: "8px",
            background: theme.palette.getBackground()
        }),
        defaultJoinGroupStyle: JoinGroupStyle = new JoinGroupStyle({
            boxShadow: `${theme.palette.getAccent100()} 0px 16px 32px 0px`,
            titleTextFont: fontHelper(theme.typography.title1),
            titleTextColor: theme.palette.getAccent(),
            passwordInputPlaceholderTextFont: fontHelper(theme.typography.subtitle1),
            passwordInputPlaceholderTextColor: theme.palette.getAccent600(),
            passwordInputBackground: theme.palette.getAccent100(),
            passwordInputBorder: "none",
            passwordInputBorderRadius: "8px",
            passwordInputBoxShadow: `${theme.palette.getAccent100()} 0 0 0 1px`,
            passwordInputTextFont: fontHelper(theme.typography.subtitle1),
            passwordInputTextColor: theme.palette.getAccent(),
            height: "100%",
            width: "100%",
            joinButtonTextFont: fontHelper(theme.typography.subtitle1),
            joinButtonTextColor: theme.palette.getAccent("dark"),
            joinButtonBackground: theme.palette.getPrimary(),
            joinButtonBorderRadius: "8px",
            joinButtonBorder: "none",
            background: theme.palette.getBackground()
        }),
        defaultMessageHeaderStyle: MessageHeaderStyle = new MessageHeaderStyle({
            background: theme.palette.getBackground(),
            border: `none`,
            onlineStatusColor: theme.palette.getSuccess(),
            privateGroupIconBackground: theme.palette.getSuccess(),
            passwordGroupIconBackground: "RGB(247, 165, 0)",
            backButtonIconTint: theme.palette.getPrimary(),
            subtitleTextColor: theme.palette.getAccent600(),
            subtitleTextFont: fontHelper(theme.typography.subtitle2),
            typingIndicatorTextColor: theme.palette.getPrimary(),
            typingIndicatorTextFont: fontHelper(theme.typography.subtitle1),
        }),
        defaultListItemStyle: ListItemStyle = new ListItemStyle({
            height: "45px",
            width: "100%",
            background: theme.palette.getBackground(),
            activeBackground: "transparent",
            borderRadius: "0",
            titleFont: fontHelper(theme.typography.title2),
            titleColor: theme.palette.getAccent(),
            border: "none",
            separatorColor: "",
            hoverBackground: "transparent"
        });

    const joinGroupConfigRef = useRefSync(joinGroupConfiguration);
    const messagesConfigRef = useRefSync(messagesConfiguration);
    const withMessagesStyleRef = useRefSync({...defaultWithMessagesStyle, ...groupsWithMessagesStyle});
    const createGroupStyleRef = useRefSync({...defaultCreateGroupStyle, ...createGroupConfiguration?.createGroupStyle});
    const joinGroupStyleRef = useRefSync({...defaultJoinGroupStyle, ...joinGroupConfigRef?.current?.joinGroupStyle});
    const messageHeaderStyleRef = useRefSync({...defaultMessageHeaderStyle, ...joinGroupConfigRef?.current?.messageHeaderConfiguration?.messageHeaderStyle});
    const listItemStyleRef = useRefSync({...defaultListItemStyle, ...joinGroupConfigRef?.current?.messageHeaderConfiguration?.listItemStyle});
    const createGroupConfigCreateClick = createGroupConfiguration?.createClick;
    const joinGroupConfigOnError = joinGroupConfiguration?.onError;
    const joinGroupConfigJoinClick = joinGroupConfiguration?.joinClick;

    labelStyle.textFont = groupsWithMessagesStyle?.messageTextFont || defaultWithMessagesStyle.messageTextFont;
    labelStyle.textColor = groupsWithMessagesStyle?.messageTextColor || defaultWithMessagesStyle.messageTextColor;

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const [createGroupElement, setCreateGroupRef] = useStateRef<JSX.IntrinsicElements["cometchat-create-group"] | null>(null);
    const [joinGroupElement, setJoinGroupRef] = useStateRef<JSX.IntrinsicElements["cometchat-join-group"] | null>(null);
    const createGroupButtonRef = useRef(null);
    const [openCreateGroupPage, setOpenCreateGroupPage] = useState(false);
    const [openPasswordModal, setOpenPasswordModal] = useState(false);
    const [protectedGroup, setProtectedGroup] = useState<CometChat.Group | null>(null);
    const [activeGroup, setActiveGroup] = useState<CometChat.Group | null>(group ?? null);
    const onErrorCallback = useCometChatErrorHandler(onError);

    const onBack = () => {
        setActiveGroup(null);
    }

    const openCreateGroup = () => {
        setOpenCreateGroupPage(true);
    }
    
    const closeCreateGroup = useCallback(() => {
        setOpenCreateGroupPage(false);
    }, []);

    const closeJoinGroup = () => {
        setOpenPasswordModal(false);
    }

    const onItemClick = (group: CometChat.Group) => {
        try{
            setOpenPasswordModal(false);
            if (group.getHasJoined()) {
                setActiveGroup(group);
                return;
            }
            if (group.getType() === CometChatUIKitConstants.GroupTypes.password) {
                setActiveGroup(null);
                setProtectedGroup(group);
                setOpenPasswordModal(true);
                return;
            }
            CometChat.joinGroup(group).then(
                (groupJoined: CometChat.Group) => {
                    setActiveGroup(groupJoined);
                }, (error: CometChat.CometChatException) => {
                    onErrorCallback(error);
                }
            );
        }catch(error: any){
            onErrorCallback(error);
        }
    };

    const onGroupJoined = useCallback(
        (event: any) => {
            try{
                let group: CometChat.Group = event?.detail?.response;
                setOpenPasswordModal(false);
                setProtectedGroup(null);
                if(group) {
                    setActiveGroup(group);
                }
            }catch(error: any){
                onErrorCallback(error);
            }
        }, [setActiveGroup, setProtectedGroup, setOpenPasswordModal, onErrorCallback]
    )

    const subscribeToEvents = useCallback(
        () => {
            try{
                const ccGroupDeleted = CometChatGroupEvents.ccGroupDeleted.subscribe(
                    (group: CometChat.Group) => {
                        if (activeGroup && activeGroup.getGuid() === group.getGuid()) {
                            setActiveGroup(null);
                        }
                    }
                );
                const ccGroupCreated = CometChatGroupEvents.ccGroupCreated.subscribe(
                    (group: CometChat.Group) => {
                        if (group) {
                            setActiveGroup(group);
                            setOpenCreateGroupPage(false);
                        }
                    }
                );
                const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
                    (item: IGroupMemberAdded) => {
                        if (activeGroup && activeGroup.getGuid() === item?.userAddedIn!.getGuid()) {
                            setActiveGroup(item?.userAddedIn);
                            setOpenCreateGroupPage(false);
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
                        }
                    }
                );
                const ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
                    (item: IGroupLeft) => {
                        if (activeGroup && activeGroup.getGuid() === item?.leftGroup!.getGuid() && loggedInUser?.getUid() === item?.userLeft?.getUid()) {
                            setActiveGroup(item?.leftGroup);
                        }
                    }
                );

                return () => {
                    ccGroupDeleted.unsubscribe();
                    ccGroupMemberAdded.unsubscribe();
                    ccGroupMemberBanned.unsubscribe();
                    ccGroupMemberJoined.unsubscribe();
                    ccGroupMemberKicked.unsubscribe();
                    ccOwnershipChanged.unsubscribe();
                    ccGroupLeft.unsubscribe();
                    ccGroupCreated.unsubscribe();
                }
            }catch(error: any){
                onErrorCallback(error);
            }
        }, [activeGroup, setActiveGroup, setOpenCreateGroupPage, onErrorCallback, loggedInUser]
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

    const groupsWrapperStyles = () => {
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

    const getWithMessagesJoinGroupStyle = () => {
        if(isMobileView){
            return {...emptyMessageStyle(), ...MobileLayoutStyle};
        }else{
            return emptyMessageStyle();
        }
    }

    Hooks(
        loggedInUser,
        setLoggedInUser,
        subscribeToEvents,
        onErrorCallback,
        isMobileView,
        messagesConfigRef,
        joinGroupConfigRef,
        group,
        setActiveGroup,
        messagesConfiguration,
        onBack,
        createGroupElement,
        createGroupButtonRef,
        openCreateGroup,
        closeCreateGroup,
        joinGroupElement,
        onGroupJoined,
        createGroupConfigCreateClick,
        joinGroupConfigOnError,
        joinGroupConfigJoinClick
    );

    const getDefaultGroupMenus = useCallback(() =>{
        if(!hideCreateGroup){
            return (<cometchat-button iconURL={CreateIcon} buttonStyle={JSON.stringify(createGroupButtonStyle)} ref={createGroupButtonRef}></cometchat-button>);
        }else{
            return null;
        }
        
    }, [hideCreateGroup]);
    
    return(
        <>
            <div className="cc__withmessages__wrapper" style={{...WithMessagesWrapperStyle, ...groupsWrapperStyles()}}>
                <div className="cc__withmessages__sidebar" style={getWithMessagesSidebarStyle()}>
                    <CometChatGroups
                        activeGroup={activeGroup ?? undefined}
                        hideSearch={groupsConfiguration?.hideSearch}
                        searchIconURL={groupsConfiguration?.searchIconURL}
                        searchRequestBuilder={groupsConfiguration?.searchRequestBuilder}
                        onItemClick={groupsConfiguration?.onItemClick || onItemClick}
                        groupsStyle={groupsConfiguration?.groupsStyle}
                        subtitleView={groupsConfiguration?.subtitleView}
                        options={groupsConfiguration?.options ?? undefined}
                        privateGroupIcon={groupsConfiguration?.privateGroupIcon}
                        passwordGroupIcon={groupsConfiguration?.protectedGroupIcon}
                        groupsRequestBuilder={groupsConfiguration?.groupsRequestBuilder}
                        emptyStateView={groupsConfiguration?.emptyStateView}
                        onSelect={groupsConfiguration?.onSelect}
                        loadingIconURL={groupsConfiguration?.loadingIconURL}
                        errorStateView={groupsConfiguration?.errorStateView}
                        loadingStateView={groupsConfiguration?.loadingStateView}
                        titleAlignment={groupsConfiguration?.titleAlignment}
                        listItemView={groupsConfiguration?.listItemView}
                        menus={groupsConfiguration?.menu || getDefaultGroupMenus()}
                        hideSeparator={groupsConfiguration?.hideSeparator}
                        hideError={groupsConfiguration?.hideError}
                        selectionMode={groupsConfiguration?.selectionMode}
                        listItemStyle={groupsConfiguration?.listItemStyle}
                    />
                </div>

                {
                    activeGroup ? 
                        <div className="cc__withmessages__main" style={getWithMessagesMainStyle()}>
                            <CometChatMessages
                                group = {activeGroup}
                                messageHeaderConfiguration = {messagesConfigRef?.current?.messageHeaderConfiguration}
                                messageListConfiguration = {messagesConfigRef?.current?.messageListConfiguration}
                                messageComposerConfiguration = {messagesConfigRef?.current?.messageComposerConfiguration}
                                messagesStyle = {messagesConfigRef?.current?.messagesStyle}
                                customSoundForIncomingMessages = {messagesConfigRef?.current?.customSoundForIncomingMessages}
                                customSoundForOutgoingMessages = {messagesConfigRef?.current?.customSoundForOutgoingMessages}
                                detailsConfiguration = {messagesConfigRef?.current?.detailsConfiguration}
                                disableSoundForMessages = {messagesConfigRef?.current?.disableSoundForMessages}
                                disableTyping = {messagesConfigRef?.current?.disableTyping}
                                hideMessageComposer = {messagesConfigRef?.current?.hideMessageComposer}
                                hideMessageHeader = {messagesConfigRef?.current?.hideMessageHeader}
                                messageComposerView = {messagesConfigRef?.current?.messageComposerView}
                                messageHeaderView = {messagesConfigRef?.current?.messageHeaderView}
                                messageListView = {messagesConfigRef?.current?.messageListView}
                            />
                        </div>
                    : null
                }
                
                {
                    !activeGroup && !openPasswordModal && !protectedGroup ?
                        <div className="cc__decorator__message--empty" style={{...EmptyMessagesDivStyle, ...emptyMessageStyle()}}>
                            <cometchat-label text={messageText} labelStyle={JSON.stringify(labelStyle)}></cometchat-label>
                        </div> :
                        null
                }

                {
                    openPasswordModal && !activeGroup && protectedGroup ? 
                        <div className="cc__withmessages__joingroup" style={getWithMessagesJoinGroupStyle()}>
                            <cometchat-join-group 
                                group={protectedGroup} 
                                joinGroupStyle={JSON.stringify(joinGroupStyleRef?.current)}
                                ref={setJoinGroupRef}
                            >
                                <div slot='headerView'>
                                    <CometChatMessageHeader
                                        group={protectedGroup}
                                        subtitleView={joinGroupConfigRef?.current?.messageHeaderConfiguration?.subtitleView}
                                        disableUsersPresence={joinGroupConfigRef?.current?.messageHeaderConfiguration?.disableUsersPresence} 
                                        protectedGroupIcon={joinGroupConfigRef?.current?.messageHeaderConfiguration?.protectedGroupIcon} 
                                        privateGroupIcon={joinGroupConfigRef?.current?.messageHeaderConfiguration?.privateGroupIcon} 
                                        menu={joinGroupConfigRef?.current?.messageHeaderConfiguration?.menu} 
                                        messageHeaderStyle={messageHeaderStyleRef.current}
                                        backButtonIconURL={joinGroupConfigRef?.current?.messageHeaderConfiguration?.backButtonIconURL} 
                                        hideBackButton={joinGroupConfigRef?.current?.messageHeaderConfiguration?.hideBackButton} 
                                        onError={joinGroupConfigRef?.current?.messageHeaderConfiguration?.onError} 
                                        onBack={joinGroupConfigRef?.current?.messageHeaderConfiguration?.onBack || closeJoinGroup} 
                                        listItemStyle={listItemStyleRef.current} 
                                        statusIndicatorStyle={joinGroupConfigRef?.current?.messageHeaderConfiguration?.statusIndicatorStyle}
                                        avatarStyle={joinGroupConfigRef?.current?.messageHeaderConfiguration?.avatarStyle}
                                    />
                                </div>
                            </cometchat-join-group>
                        </div> :
                        null
                }
            </div>

            {
                openCreateGroupPage ?
                    <cometchat-backdrop>
                        <cometchat-create-group 
                            createGroupStyle={JSON.stringify(createGroupStyleRef?.current)}
                            closeButtonIconURL={createGroupConfiguration?.closeButtonIconURL}
                            ref={setCreateGroupRef}
                        ></cometchat-create-group>
                    </cometchat-backdrop> : 
                    null
            }
        </>
    );
}

CometChatGroupsWithMessages.defaultProps = defaultProps;
export { CometChatGroupsWithMessages };