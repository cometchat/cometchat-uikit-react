import { CometChat } from "@cometchat-pro/chat";
import { useCallback, useRef, useState, useContext, JSX } from "react";
import { ListItemStyle, AvatarStyle, BaseStyle } from 'my-cstom-package-lit';
import { CometChatGroupEvents, IGroupMemberAdded, IGroupMemberKickedBanned, IGroupMemberJoined, IOwnershipChanged, IGroupLeft, localize, CometChatUIKitConstants } from 'uikit-resources-lerna';
import { MessageHeaderStyle } from 'uikit-utils-lerna';
import { CometChatListItemStyle, defaultAvatarStyle, defaultBackButtonStyle, defaultListItemStyle, defaultMessageHeaderStyle, defaultStatusIndicatorStyle, MessageHeaderBackButtonStyle, MessageHeaderDivStyle, MessageHeaderListItemStyle, MessageHeaderMenuStyle, MessageHeaderWrapperStyle, subtitleStyle } from "./style";
import { Hooks } from "./hooks";
import { CometChatContext } from "../CometChatContext";
import PrivateGroupIcon from './assets/Private.svg';
import PasswordGroupIcon from './assets/Locked.svg';
import BackIcon from './assets/backbutton.svg';
import { useCometChatErrorHandler, useRefSync, useStateRef } from "../CometChatCustomHooks";

interface IMessageHeaderProps {
    avatarStyle?: AvatarStyle,
    statusIndicatorStyle?: BaseStyle,
    messageHeaderStyle?: MessageHeaderStyle,
    listItemStyle?: ListItemStyle,
    subtitleView?: any,
    disableUsersPresence?: boolean,
    disableTyping?: boolean,
    protectedGroupIcon?: string,
    privateGroupIcon?: string,
    menu?: any,
    user?: CometChat.User,
    group?: CometChat.Group,
    backButtonIconURL?: string
    hideBackButton?: boolean,
    listItemView?: any,
    onError?: (error: CometChat.CometChatException) => void,
    onBack?: () => void
}

export const CometChatMessageHeader = (props: IMessageHeaderProps) => {
    const { theme } = useContext(CometChatContext);
    const {
        avatarStyle = {},
        statusIndicatorStyle = {},
        messageHeaderStyle = {},
        listItemStyle = {},
        subtitleView = null,
        disableUsersPresence = false,
        disableTyping = false,
        protectedGroupIcon = PasswordGroupIcon,
        privateGroupIcon = PrivateGroupIcon,
        menu = null,
        user,
        group,
        backButtonIconURL = BackIcon,
        hideBackButton = false,
        listItemView = null,
        onError,
        onBack = () => {}
    } = props;

    const [subtitleText, setSubtitleText] = useState('');
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const userRef = useRefSync(user);
    const groupRef = useRefSync(group);
    const onBackRef = useRefSync(onBack);
    const [ccBackBtnElement, setCCBackBtnRef] = useStateRef<JSX.IntrinsicElements["cometchat-button"] | null>(null);
    const isTypingRef = useRef(false);
    const onErrorCallback = useCometChatErrorHandler(onError);

    let backButtonStyle: any = defaultBackButtonStyle();

    const setSubTitle = useCallback(() => {
        const user = userRef.current;
        const group = groupRef.current;
        if (user) {
            setSubtitleText(user.getStatus());
        }
        else if (group) {
            const count = group.getMembersCount();
            const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
            setSubtitleText(`${count} ${membersText}`);
        }
    }, [groupRef, userRef]);

    const updateSubtitle = useCallback(() => {
        const user = userRef.current;
        const group = groupRef.current;
        if (user) {
            setSubtitleText(user.getStatus());
        }
        else if (group) {
            const count = group.getMembersCount();
            const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
            setSubtitleText(`${count} ${membersText}`);
        }
    }, [userRef, groupRef]);

    const updateUserStatus = useCallback((userObject: CometChat.User) => {
        const user = userRef.current;
        if (user) {
            user.setStatus(userObject.getStatus());
            setSubtitleText(user.getStatus());
        }
    }, [userRef]);

    const setTypingIndicatorText = useCallback((typing: CometChat.TypingIndicator) => {
        try {
            const sender = typing?.getSender();
            const receiverId = typing?.getReceiverId();
            if (sender?.getUid() === userRef?.current?.getUid() && loggedInUser?.getUid() === receiverId) {
                setSubtitleText(localize("IS_TYPING"));
            }
            if (groupRef?.current?.getGuid() === receiverId) {
                setSubtitleText(`${sender?.getName()} ${localize("IS_TYPING")}`);
            }
        } catch(error: any){
            onErrorCallback(error);
        }
    }, [userRef, groupRef, onErrorCallback, loggedInUser]);

    const subscribeToEvents = useCallback(() => {
        try{
            const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(
                (item: IGroupMemberAdded) => {
                    if (groupRef?.current?.getGuid() === item?.userAddedIn?.getGuid()) {
                        if (item?.usersAdded.length > 0) {
                            item?.usersAdded.forEach(
                                (userAdded: CometChat.User) => {
                                    if (userAdded?.getUid() === loggedInUser?.getUid()) {
                                        groupRef?.current?.setHasJoined(true);
                                    }
                                }
                            )
                        }
                        groupRef?.current?.setMembersCount(item?.userAddedIn?.getMembersCount());
                        updateSubtitle();
                    }
                }
            )
            const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
                (item: IGroupMemberKickedBanned) => {
                    if (groupRef?.current?.getGuid() === item?.kickedFrom?.getGuid()) {
                        if (loggedInUser?.getUid() === item?.kickedUser?.getUid()) {
                            groupRef?.current?.setHasJoined(false);
                        }
                        groupRef?.current?.setMembersCount(item?.kickedFrom?.getMembersCount());
                        updateSubtitle();
                    }
                }
            )
            const ccGroupMemberJoined = CometChatGroupEvents.ccGroupMemberJoined.subscribe(
                (item: IGroupMemberJoined) => {
                    if (groupRef?.current?.getGuid() === item?.joinedGroup?.getGuid()) {
                        if (loggedInUser?.getUid() === item?.joinedUser?.getUid()) {
                            groupRef?.current?.setHasJoined(true);
                        }
                        groupRef?.current?.setMembersCount(item?.joinedGroup?.getMembersCount());
                        updateSubtitle();
                    }
                }
            )
            const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
                (item: IGroupMemberKickedBanned) => {
                    if (groupRef?.current?.getGuid() === item?.kickedFrom?.getGuid()) {
                        if (loggedInUser?.getUid() === item?.kickedUser?.getUid()) {
                            groupRef?.current?.setHasJoined(false);
                        }
                        groupRef?.current?.setMembersCount(item?.kickedFrom?.getMembersCount());
                        updateSubtitle();
                    }
                }
            )
            const ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe(
                (item: IOwnershipChanged) => {
                    if (groupRef?.current?.getGuid() === item?.group?.getGuid()) {
                        groupRef?.current?.setOwner(item?.group?.getOwner());
                        updateSubtitle();
                    }
                }
            )
            const ccGroupLeft = CometChatGroupEvents.ccGroupLeft.subscribe(
                (item: IGroupLeft) => {
                    if (groupRef?.current?.getGuid() === item?.leftGroup?.getGuid()) {
                        if (loggedInUser?.getUid() === item?.userLeft?.getUid()) {
                            groupRef?.current?.setHasJoined(false);
                        }
                        groupRef?.current?.setMembersCount(item?.leftGroup?.getMembersCount());
                        updateSubtitle();
                    }
                }
            )

            return () => {
                try{
                    ccGroupMemberAdded.unsubscribe();
                    ccGroupMemberBanned.unsubscribe();
                    ccGroupMemberJoined.unsubscribe();
                    ccGroupMemberKicked.unsubscribe();
                    ccOwnershipChanged.unsubscribe();
                    ccGroupLeft.unsubscribe();
                }catch(error: any){
                    onErrorCallback(error);
                }
            }
        }catch(error: any){
            onErrorCallback(error);
        }
    }, [groupRef, updateSubtitle, onErrorCallback, loggedInUser]);

    const attachListeners = useCallback(() => {
        const userListenerId = "userList_" + Date.now();
        const msgListenerId = "message_" + Date.now();
        const groupsListenerId = "groupsList_" + Date.now();
        if (!disableUsersPresence) {
            CometChat.addUserListener(
                userListenerId,
                new CometChat.UserListener({
                    onUserOnline: (onlineUser: CometChat.User) => {
                        if (userRef.current?.getUid() === onlineUser.getUid()) {
                            updateUserStatus(onlineUser);
                        }
                    },
                    onUserOffline: (offlineUser: CometChat.User) => {
                        if (userRef.current?.getUid() === offlineUser?.getUid()) {
                            updateUserStatus(offlineUser);
                        }
                    },
                })
            );
        }
        if (!disableTyping) {
            CometChat.addMessageListener(
                msgListenerId,
                new CometChat.MessageListener({
                    onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
                        isTypingRef.current = true;
                        setTypingIndicatorText(typingIndicator);
                    },
                    onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
                        isTypingRef.current = false;
                        updateSubtitle();
                    },
                })
            );
        }
        CometChat.addGroupListener(
            groupsListenerId,
            new CometChat.GroupListener({
                onGroupMemberScopeChanged: (message: CometChat.Action, changedUser: CometChat.User, newScope: CometChat.GroupMemberScope, oldScope: CometChat.GroupMemberScope, changedGroup: CometChat.Group) => {
                    if (groupRef.current?.getGuid() === changedGroup?.getGuid() && changedUser.getUid() === loggedInUser?.getUid()) {
                        groupRef.current?.setScope(newScope);
                    }
                    updateSubtitle();
                },
                onGroupMemberKicked: (message: CometChat.Action, kickedUser: CometChat.User, kickedBy: CometChat.User, kickedFrom: CometChat.Group) => {
                    if (groupRef.current?.getGuid() === kickedFrom?.getGuid()) {
                        if (kickedUser.getUid() === loggedInUser?.getUid()) {
                            groupRef.current?.setHasJoined(false);
                        }
                        groupRef.current?.setMembersCount(kickedFrom?.getMembersCount());
                        updateSubtitle();
                    }
                },
                onMemberAddedToGroup: (message: CometChat.Action, userAdded: CometChat.User, userAddedBy: CometChat.User, userAddedIn: CometChat.Group) => {
                    if (groupRef.current?.getGuid() === userAddedIn.getGuid()) {
                        if (userAdded.getUid() === loggedInUser?.getUid()) {
                            groupRef.current?.setHasJoined(true);
                        }
                        groupRef.current?.setMembersCount(userAddedIn?.getMembersCount());
                        updateSubtitle();
                    }
                },
                onGroupMemberLeft: (message: CometChat.Action, leavingUser: CometChat.User, groupObject: CometChat.Group) => {
                    if (groupRef.current?.getGuid() === groupObject.getGuid()) {
                        if (leavingUser.getUid() === loggedInUser?.getUid()) {
                            groupRef.current?.setHasJoined(false);
                        }
                        groupRef.current?.setMembersCount(groupObject.getMembersCount());
                        updateSubtitle();
                    }
                },
                onGroupMemberJoined: (message: CometChat.Action, joinedUser: CometChat.User, joinedGroup: CometChat.Group) => {
                    if (groupRef.current?.getGuid() === joinedGroup.getGuid()) {
                        if (joinedUser.getUid() === loggedInUser?.getUid()) {
                            groupRef.current?.setHasJoined(true);
                        }
                        groupRef.current?.setMembersCount(joinedGroup.getMembersCount());
                        updateSubtitle();
                    }
                },
                onGroupMemberBanned: (message: CometChat.Action, bannedUser: CometChat.User, bannedBy: CometChat.User, bannedFrom: CometChat.Group) => {
                    if(groupRef.current?.getGuid() === bannedFrom.getGuid()){
                        if(bannedUser.getUid() === loggedInUser?.getUid()){
                            groupRef.current?.setHasJoined(false);
                        }
                        groupRef.current?.setMembersCount(bannedFrom.getMembersCount());
                        updateSubtitle();
                    }
                }
            })
        );
        return () => {
            CometChat.removeUserListener(userListenerId);
            CometChat.removeMessageListener(msgListenerId);
            CometChat.removeGroupListener(groupsListenerId);
        };
    }, [userRef, groupRef, updateUserStatus, disableTyping, updateSubtitle, setTypingIndicatorText, loggedInUser, disableUsersPresence]);

    const checkStatusType = useCallback(() => {
        if (userRef.current) {
            if (!disableUsersPresence && userRef.current.getStatus() === CometChatUIKitConstants.userStatusType.online) {
                return "#00f300";
            }
        }
        else if (groupRef.current) {
            const groupType = groupRef.current.getType();
            if (groupType === CometChatUIKitConstants.GroupTypes.private) {
                return "#00f300";
            }
            else if (groupType === CometChatUIKitConstants.GroupTypes.password) {
                return "#F7A500";
            }
        }
        return null;
    }, [userRef, groupRef, disableUsersPresence]);

    const checkGroupType = useCallback(() => {
        let image: string = "";
        if (groupRef.current) {
            switch (groupRef.current?.getType()) {
                case CometChatUIKitConstants.GroupTypes.password:
                    image = protectedGroupIcon;
                    break;
                case CometChatUIKitConstants.GroupTypes.private:
                    image = privateGroupIcon;
                    break;
                default:
                    image = ""
                    break;
            }
        }
        return image
    }, [groupRef, protectedGroupIcon, privateGroupIcon]);

    const getAvatarStyle = useCallback(() => {
        return { ...new AvatarStyle(defaultAvatarStyle(theme)), ...avatarStyle };
    }, [avatarStyle, theme]);

    const getStatusIndicatorStyle = useCallback(() => {
        return { ...defaultStatusIndicatorStyle(), ...statusIndicatorStyle };
    }, [statusIndicatorStyle]);

    const getMessageHeaderStyle = useCallback(() => {
        return { ...new MessageHeaderStyle(defaultMessageHeaderStyle(theme)), ...messageHeaderStyle };
    }, [messageHeaderStyle, theme]);

    const getListItemStyle = useCallback(() => {
        return { ...new ListItemStyle(defaultListItemStyle(theme)), ...listItemStyle };
    }, [listItemStyle, theme]);

    const getSubtitleView = useCallback(() => {
        if (subtitleView) {
            return subtitleView;
        } 
        return (
            <div>
                <cometchat-label 
                    text={subtitleText} 
                    labelStyle={JSON.stringify(subtitleStyle(userRef.current, isTypingRef, getMessageHeaderStyle(), theme))} 
                />
            </div>
        );
    }, [userRef, subtitleView, subtitleText, getMessageHeaderStyle, theme]);

    const getListItemView = useCallback(() => {
        if (listItemView) {
            return listItemView;
        } else {
            return (
                <cometchat-list-item avatarName={userRef.current?.getName() || groupRef.current?.getName()}
                    avatarURL={userRef.current?.getAvatar() || groupRef.current?.getIcon()} listItemStyle={JSON.stringify(getListItemStyle())}
                    statusIndicatorColor={checkStatusType()} statusIndicatorIcon={checkGroupType()}
                    title={userRef.current?.getName() || groupRef.current?.getName()} hideSeparator={true}
                    statusIndicatorStyle={JSON.stringify(getStatusIndicatorStyle())} avatarStyle={JSON.stringify(getAvatarStyle())} style={CometChatListItemStyle()}>
                    <div slot="subtitleView">
                        {getSubtitleView()}
                    </div>
                </cometchat-list-item>
            )
        }
    }, [userRef, groupRef, listItemView, getSubtitleView, getAvatarStyle, getStatusIndicatorStyle, getListItemStyle, checkGroupType, checkStatusType]);

    Hooks(
        loggedInUser,
        setLoggedInUser,
        subscribeToEvents,
        attachListeners,
        onErrorCallback,
        ccBackBtnElement,
        onBackRef,
        setSubTitle
    )

    return (
        <div className="cc__messageheader__wrapper" style={MessageHeaderWrapperStyle(getMessageHeaderStyle())}>

            <div className="cc__messageheader" style={MessageHeaderDivStyle()}>

                {
                    !hideBackButton ?
                        <div className="cc__messageheader__backbutton" style={MessageHeaderBackButtonStyle()}>
                            <cometchat-button iconURL={backButtonIconURL} buttonStyle={JSON.stringify(backButtonStyle)} ref={setCCBackBtnRef}></cometchat-button>
                        </div> :
                        null
                }

                <div className="cc__messageheader__listitem" style={MessageHeaderListItemStyle()}>
                    {getListItemView()}
                </div>

            </div>

            {
                menu ?
                    <div className="cc__messageheader__menu" style={MessageHeaderMenuStyle()}>
                        {menu}
                    </div> :
                    null
            }
        </div>
    );
}
