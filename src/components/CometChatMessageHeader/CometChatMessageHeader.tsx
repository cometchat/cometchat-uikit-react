import { JSX, ReactNode, useCallback, useRef, useState } from "react";
import { useCometChatErrorHandler, useRefSync } from "../../CometChatCustomHooks";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChatMessageHeader } from "./useCometChatMessageHeader";
import { ChatConfigurator } from '../../utils/ChatConfigurator';
import { localize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageUtils } from "../../utils/MessageUtils";
import { CometChatListItem } from '../BaseComponents/CometChatListItem/CometChatListItem';
import { CometChatUIKitConstants } from "../../constants/CometChatUIKitConstants";
import { CometChatGroupEvents, IGroupLeft, IGroupMemberAdded, IGroupMemberJoined, IGroupMemberKickedBanned, IOwnershipChanged } from "../../events/CometChatGroupEvents";
import { CometChatButton } from "../BaseComponents/CometChatButton/CometChatButton";
import ConversationSummaryIcon from '../../assets/conversation_summary.svg';
import { CometChatUIEvents } from "../../events/CometChatUIEvents";
import { CometChatConversationSummary } from "../BaseComponents/CometChatConversationSummary/CometChatConversationSummary";
import { PanelAlignment } from "../../Enums/Enums";
import { ComposerId } from "../../utils/MessagesDataSource";

/**
 * Interface for the props accepted by the CometChatMessageHeader component.
 */
interface MessageHeaderProps {
    
    /**
     * Shows the conversation summary button.
     * @default false
     */
    showConversationSummaryButton?: boolean;

    /**
     * Hides the back button in the header in mobile view.
     * @deprecated Use 'showBackButton' prop instead. This prop is deprecated and will be removed in future versions.
     * @default false
     */
    hideBackButton?: boolean;

    /**
     * Hides the back button in the header in mobile view.
     * @default false
     */
    showBackButton?: boolean;
  
    /**
     * Hides the video call button.
     * @default false
     */
    hideVideoCallButton?: boolean;
  
    /**
     * Hides the voice call button.
     * @default false
     */
    hideVoiceCallButton?: boolean;
  
    /**
     * Hides the user's online/offline status indicator.
     * @default false
     */
    hideUserStatus?: boolean;
  
    /**
     * A `CometChat.User` object representing the user whose information (e.g., status) is displayed.
     */
    user?: CometChat.User;
  
    /**
     * A `CometChat.Group` object representing the group whose details (e.g., member count) are displayed.
     */
    group?: CometChat.Group;
  
    /**
     * Number of messages for which the summary should be shown.
     * @default 1000
     */
    summaryGenerationMessageCount?: number;

    /**
     * Enables the auto generation of conversation summary.
     * @default false
     */
    enableAutoSummaryGeneration?: boolean;

    /**
     * Callback function to handle errors related to CometChat operations.
     *
     * @param error - An instance of `CometChat.CometChatException` representing the error.
     * @returns void
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;
  
    /**
     * Callback function triggered when the back action is performed.
     *
     * @returns void
     */
    onBack?: () => void;
  
    /**
     * A custom JSX element for rendering a menu. It can be used to add options or actions.
     */
    auxiliaryButtonView?: JSX.Element;
  
    /**
     * A custom JSX element for rendering a list item view, typically used to show user or group details.
     */
    itemView?: JSX.Element;
  
    /**
     * A function that renders a JSX element to display the leading view.
     */
    leadingView?: JSX.Element;
  
    /**
     * A function that renders a JSX element to display the title view.
     */
    titleView?: JSX.Element;
  
    /**
     * Custom subtitle view, allowing you to render a JSX element as the subtitle.
     * It can be used to provide additional information under the title.
     */
    subtitleView?: JSX.Element;
  
    /**
     * A function that renders a JSX element to display the trailing view.
     */
    trailingView?: JSX.Element;
  }

/** Functional component for rendering the CometChatMessageHeader */

export const CometChatMessageHeader = (props: MessageHeaderProps) => {
    /** Destructures props with default values */

    const {
        subtitleView = null,
        hideVideoCallButton = false,
        hideVoiceCallButton = false,
        auxiliaryButtonView = null,
        user,
        group,
        itemView = null,
        onError,
        onBack = () => { },
        hideBackButton = true,
        leadingView,
        titleView,
        trailingView,
        hideUserStatus = false,
        showConversationSummaryButton = false,
        enableAutoSummaryGeneration = false,
        summaryGenerationMessageCount = 1000,
        showBackButton = false
    } = props;

    /** States and ref used in the component */
    const [subtitleText, setSubtitleText] = useState('');
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const userRef = useRefSync(user);
    const groupRef = useRefSync(group);
    const classNameRef = useRef("");
    const isTypingRef = useRef(false);
    const onErrorCallback = useCometChatErrorHandler(onError);

    const updateSubtitle = useCallback(() => {
        try {
            const user = userRef.current;
            const group = groupRef.current;
            if (user && !hideUserStatus) {
                updateLastActiveInfo(user);
            }
            else if (group) {
                const count = group.getMembersCount();
                const membersText = localize(count > 1 ? "MEMBERS" : "MEMBER");
                setSubtitleText(`${count} ${membersText}`);
            }
            else if(!isTypingRef.current && hideUserStatus){
                setSubtitleText("")
            }
        } catch (error) {
            onErrorCallback(error, 'updateSubtitle');
        }
    }, [props.user, props.group,hideUserStatus]);

    const subscribeToEvents = useCallback(() => {
        try {
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
                try {
                    ccGroupMemberAdded.unsubscribe();
                    ccGroupMemberBanned.unsubscribe();
                    ccGroupMemberJoined.unsubscribe();
                    ccGroupMemberKicked.unsubscribe();
                    ccOwnershipChanged.unsubscribe();
                    ccGroupLeft.unsubscribe();
                } catch (error: any) {
                    onErrorCallback(error, 'subscribeToEvents');
                }
            }
        } catch (error: any) {
            onErrorCallback(error, 'subscribeToEvents');
        }
    }, [groupRef, updateSubtitle, onErrorCallback, loggedInUser]);

    /* The purpose of this function is to update the subtitle text with the user status and last activity. */
    const updateLastActiveInfo = (user: CometChat.User) => {
        try {
            if (user.getStatus() === CometChatUIKitConstants.userStatusType.online) {
                setSubtitleText(localize(user.getStatus().toUpperCase()));
            } else {
                if (user.getLastActiveAt()) {
                    const date = user.getLastActiveAt().toString().length === 10 ? new Date(user.getLastActiveAt() * 1000) : new Date(user.getLastActiveAt());
                    const timeDifferenceInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60
                    if (timeDifferenceInMinutes < 60) {
                        if (Math.ceil(timeDifferenceInMinutes) == 0 || Math.ceil(timeDifferenceInMinutes) == 1) {
                            setSubtitleText(`${localize("LAST_SEEN")} 1 minute ago`);
                        } else {
                            setSubtitleText(`${localize("LAST_SEEN")} ` + Math.ceil(timeDifferenceInMinutes) + " minutes ago");
                        }
                    } else if (timeDifferenceInMinutes == 60) {
                        setSubtitleText(`${localize("LAST_SEEN")} 1 hour ago`)
                    } else {
                        const dateString = date.getDate();
                        const monthString = date.toLocaleString('en-Us', { month: "short" });
                        let timeString: number | string = date.getHours();
                        let postString = "AM";
                        if (timeString > 11) {
                            postString = "PM";
                            timeString = timeString !== 12 ? timeString % 12 : timeString;
                        }
                        if (timeString < 10) {
                            timeString = `0${timeString}`;
                        }
                        setSubtitleText(`${localize("LAST_SEEN")} ` + dateString + " " + monthString + ` ${localize("AT")} ` + timeString + ":" + getMinute(date) + " " + postString);
                    }
                } else {
                    setSubtitleText(localize(user.getStatus().toUpperCase()));
                }
            }
        } catch (error) {
            onErrorCallback(error, 'updateLastActiveInfo');
        }
    }

    /* This function retuns the minutes from the given date string. */
    const getMinute = (date: Date) => {
        try {
            if (date.getMinutes() < 10) {
                return `0${date.getMinutes()}`;
            } else { return date.getMinutes() };
        } catch (error) {
            onErrorCallback(error, 'getMinute');
        }
    };

    /** Updates subtitle text based on user or group status */
    const updateUserStatus = useCallback((userObject: CometChat.User) => {
        try {
            const user = userRef.current;
            if (user && !hideUserStatus) {
                user.setStatus(userObject.getStatus());
                updateLastActiveInfo(userObject);
            }
        } catch (error) {
            onErrorCallback(error, 'updateUserStatus');
        }
    }, [userRef,hideUserStatus]);
    /** Updates user status and subtitle text */

    const setTypingIndicatorText = useCallback((typing: CometChat.TypingIndicator) => {
        try {
            const sender = typing?.getSender();
            const receiverId = typing?.getReceiverId();
            if (isTypingForCurrentChat(typing)) {
                classNameRef.current = "cometchat-message-header__subtitle-typing";

                if (loggedInUser?.getUid() == receiverId) {
                    let isBlocked = new MessageUtils().getUserStatusVisible(userRef?.current);
                    if (isBlocked) {
                        return;
                    }
                    isTypingRef.current = true;
                    setSubtitleText(localize("TYPING"));
                }
                if (groupRef?.current?.getGuid() === receiverId) {
                    isTypingRef.current = true;
                    setSubtitleText(`${sender?.getName()}: ${localize("TYPING")}`);
                }
            }

        } catch (error: any) {
            onErrorCallback(error, 'setTypingIndicatorText');
        }
    }, [userRef, groupRef, onErrorCallback, loggedInUser]);

    /** Sets the typing indicator text */

    const isTypingForCurrentChat = (typing: CometChat.TypingIndicator) => {
        try {
            const sender = typing?.getSender();
            const receiverId = typing?.getReceiverId();
            return sender?.getUid() === userRef?.current?.getUid() && loggedInUser?.getUid() === receiverId || (groupRef.current && groupRef.current.getGuid() == receiverId);
        } catch (error) {
            onErrorCallback(error, 'isTypingForCurrentChat');
        }
    }
    /** Checks if the typing indicator corresponds to the current chat */

    const attachListeners = useCallback(() => {
        try {
            const userListenerId = "userList_" + Date.now();
            const groupsListenerId = "groupsList_" + Date.now();
            const connectionListenerId = "connection_" + Date.now();
            const messagelistenerId = `CometChatHeaderMessage__${new Date().getTime()}`;

            if (!hideUserStatus) {
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

            CometChat.addMessageListener(messagelistenerId, new CometChat.MessageListener({
                onTypingStarted: (typingIndicator: CometChat.TypingIndicator) => {
                    setTypingIndicatorText(typingIndicator);
                },
                onTypingEnded: (typingIndicator: CometChat.TypingIndicator) => {
                    if (typingIndicator && isTypingForCurrentChat(typingIndicator)) {
                        isTypingRef.current = false;
                        classNameRef.current = "";
                        updateSubtitle();
                    }
                },
            }))

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
                        if (groupRef.current?.getGuid() === bannedFrom.getGuid()) {
                            if (bannedUser.getUid() === loggedInUser?.getUid()) {
                                groupRef.current?.setHasJoined(false);
                            }
                            groupRef.current?.setMembersCount(bannedFrom.getMembersCount());
                            updateSubtitle();
                        }
                    }
                })
            );
            CometChat.addConnectionListener(
                connectionListenerId,
                new CometChat.ConnectionListener({
                    onConnected: () => {
                        console.log("ConnectionListener => On Connected");
                    },

                })
            );
            return () => {
                CometChat.removeUserListener(userListenerId);
                CometChat.removeGroupListener(groupsListenerId);
                CometChat.removeConnectionListener(connectionListenerId);
            };
        } catch (error) {
            onErrorCallback(error, 'attachListeners');
        }
    }, [userRef, groupRef, updateUserStatus, hideUserStatus, updateSubtitle, setTypingIndicatorText, loggedInUser]);
    /** 
     * Retrieves the subtitle view for the message header. 
     * If a custom subtitle view is provided, it returns that. 
     * Otherwise, it checks if the user is blocked and returns a default subtitle if not blocked.
     */
    const getSubtitleView = useCallback(() => {
        try {
            if (subtitleView) {
                return subtitleView;
            }
            let userBlockedFlag = new MessageUtils().getUserStatusVisible(userRef.current);
            return !userBlockedFlag && subtitleText ? (
                <div className={`cometchat-message-header__subtitle ${classNameRef.current ?? ""}`}>
                    {subtitleText}
                </div>
            ) : null;
        } catch (error) {
            onErrorCallback(error, 'getSubtitleView');
        }
    }, [userRef, subtitleView, subtitleText]);
    /** 
     * Retrieves the list item view for the message header. 
     * If a custom list item view is provided, it returns that. 
     * Otherwise, it creates a default list item with the user's or group's information.
     */
    const getItemView = useCallback(() => {
        try {
            if (itemView) {
                return itemView;
            } else {
                return (
                    <CometChatListItem avatarName={userRef.current?.getName() || groupRef.current?.getName()}
                        avatarURL={userRef.current?.getAvatar() || groupRef.current?.getIcon() || ""}
                        title={userRef.current?.getName() || groupRef.current?.getName() || ""} subtitleView={getSubtitleView()} titleView={titleView} trailingView={trailingView} leadingView={leadingView} />
                )
            }
        } catch (error) {
            onErrorCallback(error, 'getItemView');
        }
    }, [userRef, groupRef, itemView, getSubtitleView]);
    /** 
     * Generates the back button for the message header. 
     * Currently, it returns an empty div but can be extended with back button functionality.
     */
    const getBackButton = () => {
        try {
            if (hideBackButton && !showBackButton) return null;
            
            return (
                <div onClick={() => {
                    if (onBack) {
                        onBack()
                    }
                }} className="cometchat-message-header__back-button">
                </div>
            );
        } catch (error) {
            onErrorCallback(error, 'getBackButton');
        }
    };
    const closeSummaryPanel = () => {
        CometChatUIEvents.ccHidePanel.next(PanelAlignment.messageListFooter);
      };
     const getConversationSummary = (): Promise<string> => {
        return new Promise(async (resolve, reject) => {
          try {
            let receiverId: string = userRef.current
              ? userRef.current?.getUid()
              : groupRef.current?.getGuid()!;
            let receiverType: string = userRef.current
              ? CometChatUIKitConstants.MessageReceiverType.user
              : CometChatUIKitConstants.MessageReceiverType.group;
            const response = await CometChat.getConversationSummary(
              receiverId,
              receiverType,
              {lastNMessages:summaryGenerationMessageCount}
            );
            return resolve(response);
          } catch (e) {
            console.log(e)
            reject(e);
          }
        });
      };
    
      function getComposerId(): ComposerId {
        try {
            const user = userRef.current;
            if (user) {
                return { user: user.getUid(), group: null, parentMessageId:null };
            }
            const group = groupRef.current;
            if (group) {
                return { user: null, group: group.getGuid(), parentMessageId:null };
            }
            return { user: null, group: null, parentMessageId:null };
        } catch (error) {
          onErrorCallback(error, "getComposerId");
            return { user: null, group: null, parentMessageId: null };
        }
    }
  
    const loadConversationSummary = (): void =>  {
      CometChatUIEvents.ccShowPanel.next({ child: <CometChatConversationSummary getConversationSummary={getConversationSummary} closeCallback={closeSummaryPanel} />, position: PanelAlignment.messageListFooter,composerId:getComposerId()});
    }
    /** 
     * Shows the conversation summary button. 
     */
    const getConversationSummaryButton = useCallback(() => {
        try {
            return (
            <div className="cometchat-message-header__conversation-summary-button">
            <CometChatButton
            hoverText={"Conversation Summary"}
            iconURL={ ConversationSummaryIcon}
            onClick={loadConversationSummary}
            />
                </div>
            );
        } catch (error) {
            onErrorCallback(error, 'getAuxiliaryView');
        }
    }, [showConversationSummaryButton]);
    /** 
     * Retrieves the auxiliary for the message header. 
     * Combines the auxiliary header auxiliary and the provided auxiliary into a single auxiliary component.
     */
    const getAuxiliaryView = useCallback(() => {
        try {
            return (
                <div className="cometchat-message-header__auxiliary-button-view">
                    {ChatConfigurator.getDataSource().getAuxiliaryHeaderMenu(userRef.current, groupRef.current, { hideVideoCallButton, hideVoiceCallButton }) as ReactNode}
                    {!showConversationSummaryButton ? null : getConversationSummaryButton()}
                    {auxiliaryButtonView}
                </div>
            );
        } catch (error) {
            onErrorCallback(error, 'getAuxiliaryView');
        }
    }, [auxiliaryButtonView]);

    useCometChatMessageHeader(
        loggedInUser,
        setLoggedInUser,
        attachListeners,
        userRef,
        groupRef,
        updateSubtitle,
        subscribeToEvents,
        onErrorCallback,
       user,
       group, 
       enableAutoSummaryGeneration,
       loadConversationSummary
    )

    return (
        <div className="cometchat" style={{
            height: "fit-content",
            width: "100%",
            display: "flex"
        }}>
            <div className="cometchat-message-header">
                <div>
                    {getBackButton()}
                    <div className="cometchat-message-header__listitem">
                        {getItemView()}
                    </div>
                </div>
                {getAuxiliaryView() as Element & Element[] & ReactNode}
            </div>
        </div>

    );
}
