import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import blockIcon from "../../assets/block.svg";
import deleteIcon from "../../assets/delete.svg";
import { COMETCHAT_CONSTANTS } from "../../AppConstants";
import { useNavigate } from "react-router-dom";
import { Call, CometChat, Conversation, Group, GroupType, MessagesRequestBuilder, User } from "@cometchat/chat-sdk-javascript";
import { CometChatJoinGroup } from "../CometChatJoinGroup/CometChatJoinGroup";
import backbutton from "../../assets/arrow_back.svg";
import addMembersIcon from "../../assets/addMembers.svg";
import leaveGroupIcon from "../../assets/leaveGroup.svg";
import "../../styles/CometChatSelector/CometChatTabs.css";
import "../../styles/CometChatSelector/CometChatSelector.css";
import '../../styles/CometChatNewChat/CometChatNewChatView.css';
import "../../styles/CometChatMessages/CometChatMessages.css";
import "../../styles/CometChatDetails/CometChatDetails.css";
import { CometChatEmptyStateView } from "../CometChatMessages/CometChatEmptyStateView";
import { AppContext } from "../../context/AppContext";
import { CometChatBannedMembers } from "../CometChatBannedMembers/CometChatBannedMembers";
import { CometChatAddMembers } from "../CometChatAddMembers/CometChatAddMembers";
import { CometChatTransferOwnership } from "../CometChatTransferOwnership/CometChatTransferOwnership";
import { CometChatMessages } from "../CometChatMessages/CometChatMessages";
import { CometChatTabs } from "../CometChatSelector/CometChatTabs";
import { CometChatSelector } from "../CometChatSelector/CometChatSelector";
import { CometChatUserDetails } from "../CometChatDetails/CometChatUserDetails";
import { CometChatThreadedMessages } from "../CometChatDetails/CometChatThreadedMessages";
import { CometChatCallDetails } from "../CometChatCallLog/CometChatCallLogDetails";
import { CometChatAlertPopup } from "../CometChatAlertPopup/CometChatAlertPopup";
import { CometChatAvatar, CometChatButton, CometChatConfirmDialog, CometChatConversationEvents, CometChatGroupEvents, CometChatGroupMembers, CometChatGroups, CometChatIncomingCall, CometChatMessageEvents, CometChatToast, CometChatUIKit, CometChatUIKitConstants, CometChatUIKitLoginListener, CometChatUIKitUtility, CometChatUserEvents, CometChatUsers, IMessages, localize, CometChatUIEvents, IMouseEvent } from "@cometchat/chat-uikit-react";
import { CallLog } from "@cometchat/calls-sdk-javascript";

interface TabContentProps {
    selectedTab: string;
}

interface ThreadProps {
    message: CometChat.BaseMessage;
}

function CometChatHome(props: { theme?: string }) {
    const navigate = useNavigate();
    const [theme, setTheme] = useState<string>(props.theme!);
    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
    const appID: string = localStorage.getItem('appId') || COMETCHAT_CONSTANTS.APP_ID; // Use the latest appId if available
    const region: string = localStorage.getItem('region') || COMETCHAT_CONSTANTS.REGION; // Default to 'us' if region is not found
    const authKey: string = localStorage.getItem('authKey') || COMETCHAT_CONSTANTS.AUTH_KEY; // Default authKey if not found
    const [group, setGroup] = useState<Group>();
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("chats");
    const [selectedItem, setSelectedItem] = useState<Conversation | User | Group | Call>();
    const [showNewChat, setShowNewChat] = useState<boolean>(false);
    const showJoinGroupRef = useRef(false);
    const [newChat, setNewChat] = useState<{
        user?: CometChat.User,
        group?: CometChat.Group
    } | undefined>();
    const [showAlertPopup, setShowAlertPopup] = useState({ visible: false, description: "" });
    const [showToast, setShowToast] = useState(false);
    const toastTextRef = useRef<string>("");

    const { appState, setAppState } = useContext(AppContext);

    function hasCredentials() {
        if (appID === '' || region === '' || authKey === '') return false;
        return true;
    }
    useEffect((() => {
        let ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe(() => {
            toastTextRef.current = localize("GROUP_OWNERSHIP_TRANSFERRED_SUCCESSFULLY");
            setShowToast(true)
        })
        let ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(() => {
            toastTextRef.current = localize("PERMISSIONS_UPDATED_SUCCESSFULLY");
            setShowToast(true)
        })
        let ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(() => {
            toastTextRef.current = localize("MEMBER_ADDED_TO_GROUP");
            setShowToast(true)
        })
        let ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(() => {
            toastTextRef.current = localize("MEMBER_BANNED_FROM_GROUP");
            setShowToast(true)
        })
        let ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(() => {
            toastTextRef.current = localize("MEMBER_REMOVED_FROM_GROUP");
            setShowToast(true)
        })
        return () => {
            ccOwnershipChanged?.unsubscribe();
            ccGroupMemberScopeChanged?.unsubscribe();
            ccGroupMemberAdded?.unsubscribe();
            ccGroupMemberBanned?.unsubscribe();
            ccGroupMemberKicked?.unsubscribe();
        }

    }), [])
    useEffect(() => {
        const handleThemeChange = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleThemeChange);
        return () => {
            mediaQuery.removeEventListener('change', handleThemeChange);
        };
    }, []);

    useEffect(() => {
        const user = CometChatUIKitLoginListener.getLoggedInUser();
        setLoggedInUser(user);
        if (!hasCredentials() && !user) {
            navigate('/credentials', { replace: true });
        }
        if (hasCredentials() && !user) {
            navigate('/login', { replace: true });
        }
    }, []);

    useEffect(() => {
        const isMessageListOpen =
            selectedItem &&
            (selectedItem instanceof CometChat.User ||
                selectedItem instanceof CometChat.Group ||
                selectedItem instanceof CometChat.Conversation);

        if (activeTab === "chats" || isMessageListOpen) return;
        const messageListenerId = `misc-message_${Date.now()}`;
        attachMessageReceivedListener(messageListenerId);

        return () => {
            CometChat.removeMessageListener(messageListenerId);
        };
    }, [activeTab, selectedItem]);

    /**
   * Handles new received messages
   */
    const onMessageReceived = useCallback(
        async (message: CometChat.BaseMessage): Promise<void> => {
            if (
                message.getSender().getUid() !== CometChatUIKitLoginListener.getLoggedInUser()?.getUid() &&
                !message.getDeliveredAt()
            ) {
                try {
                    CometChat.markAsDelivered(message);
                } catch (error) {
                    console.error(error)
                }
            }
        },
        []
    );

    const attachMessageReceivedListener = useCallback((messageListenerId: string) => {
        CometChat.addMessageListener(messageListenerId, new CometChat.MessageListener({
            onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
                onMessageReceived(textMessage)
            },
            onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
                onMessageReceived(mediaMessage);
            },
            onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
                onMessageReceived(customMessage);
            }
        }))
    }, [onMessageReceived])
    const updateUserAfterBlockUnblock = (user: User) => {
        if (appState.selectedItemUser?.getUid() === user.getUid()) {
            setAppState({ type: "updateSelectedItemUser", payload: user });
        }
        if ((appState.selectedItem?.getConversationWith() as User)?.getUid?.() === user.getUid()) {
            appState.selectedItem?.setConversationWith(user);
            setAppState({ type: "updateSelectedItem", payload: appState.selectedItem });
        }
    }


    const TabComponent = () => {
        const onTabClicked = (tabItem: { name: string; icon: string }) => {
            setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
            setNewChat(undefined);
            setActiveTab(tabItem.name.toLowerCase());
        }

        return (
            <CometChatTabs onTabClicked={onTabClicked} activeTab={activeTab} />
        )
    }

    useEffect(() => {
        if (activeTab === "chats" && appState.selectedItem) {
            setSelectedItem(appState.selectedItem);
        } else if (activeTab === "users" && appState.selectedItemUser) {
            setSelectedItem(appState.selectedItemUser);
        } else if (activeTab === "groups" && appState.selectedItemGroup) {
            setSelectedItem(appState.selectedItemGroup);
        } else if (activeTab === "calls" && appState.selectedItemCall) {
            setSelectedItem(appState.selectedItemCall);
        } else {
            setSelectedItem(undefined);
        }
    }, [activeTab]);


    const InformationComponent = useCallback(() => {
        return (
            <>
                {showNewChat ? <CometChatNewChatView />
                    :
                    (selectedItem || newChat?.user || newChat?.group) ? (<CometChatMessagesViewComponent />)
                        :
                        (<CometChatEmptyStateView activeTab={activeTab} />)
                }
            </>
        )
    }, [activeTab, showNewChat, selectedItem, newChat]);

    const CometChatMessagesViewComponent = () => {
        const [showComposer, setShowComposer] = useState(true);
        const [messageUser, setMessageUser] = useState<User>();
        const [messageGroup, setMessageGroup] = useState<Group>();
        const [threadedMessage, setThreadedMsg] = useState<CometChat.BaseMessage | undefined>();

        useEffect(() => {
            if (newChat?.user) {
                setMessageUser(newChat.user);
                setMessageGroup(undefined);
            } else if (newChat?.group) {
                setMessageUser(undefined);
                setMessageGroup(newChat.group);
            } else {
                if (activeTab === "chats") {
                    if ((selectedItem as Conversation)?.getConversationType?.() === CometChatUIKitConstants.MessageReceiverType.user) {
                        setMessageUser((selectedItem as Conversation)?.getConversationWith() as User);
                        setMessageGroup(undefined);
                    } else if ((selectedItem as Conversation)?.getConversationType?.() === CometChatUIKitConstants.MessageReceiverType.group) {
                        setMessageUser(undefined);
                        setMessageGroup((selectedItem as Conversation)?.getConversationWith() as Group);
                    }
                } else if (activeTab === "users") {
                    setMessageUser(selectedItem as User);
                    setMessageGroup(undefined);
                } else if (activeTab === "groups") {
                    setMessageUser(undefined);
                    setMessageGroup(selectedItem as Group);
                } else {
                    setMessageUser(undefined);
                    setMessageGroup(undefined);
                }
            }
        }, [activeTab, selectedItem]);

        const subscribeToEvents = () => {
            const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(user => {
                if (user.getBlockedByMe()) {
                    setShowComposer(false);
                }
                updateUserAfterBlockUnblock(user);
            });
            const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(user => {
                if (!user.getBlockedByMe()) {
                    setShowComposer(true);
                }
                updateUserAfterBlockUnblock(user);
            });
            const ccMessageDeleted = CometChatMessageEvents.ccMessageDeleted.subscribe(message => {
                if (message.getId() === threadedMessage?.getId()) {
                    setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } })
                }
            })

            return () => {
                ccUserBlocked?.unsubscribe();
                ccUserUnblocked?.unsubscribe();
                ccMessageDeleted?.unsubscribe();
            };
        };

        useEffect(() => {
            if (messageUser?.getBlockedByMe()) {
                setShowComposer(false);
            }
            const unsubscribeFromEvents = subscribeToEvents();
            return () => {
                unsubscribeFromEvents();
            };
        }, [subscribeToEvents, selectedItem]);

        const showSideComponent = () => {
            let type = "";
            if (activeTab === "chats") {
                if ((selectedItem as Conversation)?.getConversationType() === "group") {
                    type = "group";
                } else {
                    type = "user";
                }
            } else if (activeTab === "users") {
                type = "user";
            } else if (activeTab === "groups") {
                type = "group";
            }

            if (newChat?.user) {
                type = "user";
            } else if (newChat?.group) {
                type = "group";
            }
            setAppState({ type: "updateSideComponent", payload: { visible: true, type } })
        }

        const headerMenu = () => {
            return (
                <div
                    className="cometchat-header__info"
                    onClick={showSideComponent}
                />
            )
        }

        const updateThreadedMessage = (message: CometChat.BaseMessage) => {
            setThreadedMsg(message);
            setAppState({ type: "updateSideComponent", payload: { visible: true, type: "threadedMessage" } });
            setAppState({ type: "updateThreadedMessage", payload: message });
        }

        const onBack = () => {
            setSelectedItem(undefined);
            setNewChat(undefined);
            setAppState({ type: "updateSelectedItem", payload: undefined });
            setAppState({ type: "updateSelectedItemUser", payload: undefined });
            setAppState({ type: "updateSelectedItemGroup", payload: undefined });
            setAppState({ type: "newChat", payload: undefined });
        }

        return (
            <>
                {(selectedItem as any)?.mode === "call" ?
                    <CometChatCallDetails selectedItem={selectedItem as Call} onBack={() => {
                        setSelectedItem(undefined);
                        setAppState({ type: "updateSelectedItemCall", payload: undefined });
                    }} />
                    :
                    <CometChatMessages
                        user={messageUser}
                        group={messageGroup}
                        onBack={onBack}
                        headerMenu={headerMenu}
                        onThreadRepliesClick={(message) => updateThreadedMessage(message)}
                        showComposer={showComposer}
                    />
                }
            </>
        )
    }

    const CometChatNewChatView: React.FC = () => {
        const [selectedTab, setSelectedTab] = useState<string>('user');
        const [group, setGroup] = useState<Group>();
        const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();

        const handleTabClick = (tab: string) => {
            setSelectedTab(tab);

        };

        const joinGroup = (e: Group) => {
            if (!e.getHasJoined()) {
                if (e.getType() === CometChatUIKitConstants.GroupTypes.public) {
                    CometChat.joinGroup(e.getGuid(), e.getType() as GroupType)
                        .then((response: any) => {
                            setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                            response.setHasJoined?.(true);
                            response.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
                            setNewChat({ group: response, user: undefined });
                            setShowNewChat(false);
                            setTimeout(() => {
                                CometChatGroupEvents.ccGroupMemberJoined.next({
                                    joinedGroup: response,
                                    joinedUser: loggedInUser!
                                })
                            }, 100)
                        })
                        .catch((error: unknown) => {
                            console.log(error);
                        });
                } else {
                    setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                    setGroup(e);
                    showJoinGroupRef.current = true
                }
            } else {
                setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                setNewChat({ group: e, user: undefined });
                setShowNewChat(false);
            }
        }

        const TabContent: React.FC<TabContentProps> = ({ selectedTab }) => {
            return selectedTab === 'user' ? <CometChatUsers
                onItemClick={(user: CometChat.User) => {
                    setNewChat({ user, group: undefined });
                    setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                    setShowNewChat(false);
                }}
            />
                : <CometChatGroups
                    groupsRequestBuilder={new CometChat.GroupsRequestBuilder().joinedOnly(true).setLimit(30)}
                    onItemClick={(e: CometChat.Group) => joinGroup(e)} />;
        };

        return (
            <div className='cometchat-new-chat-view'>
                {showJoinGroupRef.current && group && <CometChatJoinGroup
                    group={group}
                    onHide={() => showJoinGroupRef.current = false}
                    onProtectedGroupJoin={(group) => {
                        if (activeTab === "chats") {
                            setShowNewChat(false);
                            const convId = group?.getGuid();
                            const convType = CometChatUIKitConstants.MessageReceiverType.group;
                            CometChat.getConversation(convId!, convType).then(
                                (conversation) => {
                                    setSelectedItem(conversation);
                                },
                                (error) => {
                                    setSelectedItem(undefined);
                                }
                            );
                        } else {
                            setSelectedItem(group);
                        }
                    }}
                />}
                {/* Header with back icon and title */}
                <div className='cometchat-new-chat-view__header'>
                    <CometChatButton iconURL={backbutton} onClick={() => {
                        setShowNewChat(false);

                    }} />
                    <div className='cometchat-new-chat-view__header-title'>New Chat</div>
                </div>

                {/* Tabs for User and Group */}
                <div className='cometchat-new-chat-view__tabs'>
                    <div className={`cometchat-new-chat-view__tabs-tab ${selectedTab == 'user' ? "cometchat-new-chat-view__tabs-tab-active" : ""}`} onClick={() => handleTabClick('user')}> {localize("USERS")}</div>
                    <div className={`cometchat-new-chat-view__tabs-tab ${selectedTab == 'group' ? "cometchat-new-chat-view__tabs-tab-active" : ""}`} onClick={() => handleTabClick('group')}> {localize("GROUPS")}</div>
                </div>

                {/* Dynamic content based on selected tab */}
                <div style={{ overflow: "hidden" }}>
                    <TabContent selectedTab={selectedTab} />
                </div>
            </div>
        );
    };

    const SideComponent = () => {
        const [group, setGroup] = useState<CometChat.Group>();
        const [user, setUser] = useState<CometChat.User>();

        useEffect(() => {
            if (activeTab == "chats") {
                if ((selectedItem as Conversation)?.getConversationType?.() === "user") {
                    setUser((selectedItem as Conversation)?.getConversationWith() as CometChat.User);
                } else if ((selectedItem as Conversation)?.getConversationType?.() === "group") {
                    setGroup((selectedItem as Conversation).getConversationWith() as CometChat.Group);
                }
            } else if (activeTab === "users") {
                setUser(selectedItem as CometChat.User);
            } else if (activeTab === "groups") {
                setGroup(selectedItem as CometChat.Group);
            }
        }, [selectedItem, activeTab]);

        useEffect(() => {
            if (newChat?.user) {
                setUser(newChat.user);
            } else if (newChat?.group) {
                setGroup(newChat.group);
            }
        }, [newChat]);

        const updateGroupDetails = (eventGroup: CometChat.Group) => {
            if (eventGroup.getGuid() === group?.getGuid()) {
                setGroup(eventGroup);
            }
        }

        const attachSDKGroupListenerForDetails = () => {
            const listenerId = "GroupDetailsListener_" + String(Date.now());
            CometChat.addGroupListener(
                listenerId,
                new CometChat.GroupListener({
                    onGroupMemberBanned: (
                        message: CometChat.Action,
                        bannedUser: CometChat.User,
                        bannedBy: CometChat.User,
                        bannedFrom: CometChat.Group
                    ) => {
                        updateGroupDetails(bannedFrom);
                    },
                    onGroupMemberKicked: (
                        message: CometChat.Action,
                        kickedUser: CometChat.User,
                        kickedBy: CometChat.User,
                        kickedFrom: CometChat.Group
                    ) => {
                        updateGroupDetails(kickedFrom);
                    },
                    onMemberAddedToGroup: (
                        message: CometChat.Action,
                        userAdded: CometChat.User,
                        userAddedBy: CometChat.User,
                        userAddedIn: CometChat.Group
                    ) => {
                        updateGroupDetails(userAddedIn);
                    },
                    onGroupMemberJoined: (
                        message: CometChat.Action,
                        joinedUser: CometChat.User,
                        joinedGroup: CometChat.Group
                    ) => {
                        updateGroupDetails(joinedGroup);
                    },
                    onGroupMemberLeft: (
                        message: CometChat.Action,
                        leavingUser: CometChat.User,
                        group: CometChat.Group
                    ) => {
                        updateGroupDetails(group);
                    },
                })
            );
            return () => CometChat.removeGroupListener(listenerId);
        }

        useEffect(() => {
            if (loggedInUser) {
                const unsubscribeFromGroupEvents = attachSDKGroupListenerForDetails();
                return () => {
                    unsubscribeFromGroupEvents();
                };
            }
        }, [loggedInUser, attachSDKGroupListenerForDetails]);

        return (
            <>
                {appState.sideComponent.visible && (
                    <div className="side-component-wrapper">
                        {appState.sideComponent.type == "user" && user && <SideComponentUser user={user} />}
                        {appState.sideComponent.type == "group" && group && <SideComponentGroup group={group} />}
                        {appState.sideComponent.type == "threadedMessage" && appState.threadedMessage && <SideComponentThread message={appState.threadedMessage} />}
                    </div>
                )}
            </>
        )
    }

    const SideComponentUser = (props: { user: CometChat.User }) => {
        const { user } = props;

        const actionItemsArray = [{
            "name": user.getBlockedByMe() ? localize("UNBLOCK_USER") : localize("BLOCK_USER"),
            "icon": blockIcon
        }, {
            "name": localize("DELETE_CHAT"),
            "icon": deleteIcon
        }]
        const [actionItems, setActionItems] = useState(actionItemsArray);
        const [showStatus, setShowStatus] = useState(true);
        const [showBlockUserDialog, setShowBlockUserDialog] = useState(false);
        const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);

        const onBlockUserClicked: () => Promise<void> = () => {
            let UID = user.getUid();
            return new Promise(async (resolve, reject) => {
                CometChat.blockUsers([UID]).then(
                    list => {
                        user.setBlockedByMe(true);
                        CometChatUserEvents.ccUserBlocked.next(user);
                        toastTextRef.current = localize("USER_BLOCKED");
                        setShowToast(true);
                        return resolve();
                    }, error => {
                        console.log("Blocking user fails with error", error);
                        return reject();
                    }
                )
            })
        }

        const onUnblockUserClicked = () => {
            let UID = user.getUid();
            CometChat.unblockUsers([UID]).then(
                list => {
                    setActionItems([{
                        "name": localize("BLOCK_USER"),
                        "icon": blockIcon
                    }, {
                        "name": localize("DELETE_CHAT"),
                        "icon": deleteIcon
                    }]);
                    user.setBlockedByMe(false);
                    CometChatUserEvents.ccUserUnblocked.next(user);
                }, error => {
                    console.log("Blocking user fails with error", error);
                }
            );
        }

        const onDeleteConversationClicked: () => Promise<void> = () => {
            let UID = user.getUid();
            return new Promise(async (resolve, reject) => {
                CometChat.deleteConversation(UID, "user").then(
                    deletedConversation => {
                        setSelectedItem(undefined);
                        setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                        CometChatConversationEvents.ccConversationDeleted.next((selectedItem as Conversation)!);
                        toastTextRef.current = localize("CHAT_DELETED_SUCCESSFULLY");
                        setShowToast(true);
                        return resolve();
                    }, error => {
                        console.log('error while deleting a conversation', error);
                        return reject();
                    }
                );
            })
        }

        const onUserActionClick = (item: {
            name: string;
            icon: string;
        }) => {
            if (item.name == localize("BLOCK_USER")) {
                setShowBlockUserDialog(true);
            } else if (item.name == localize("UNBLOCK_USER")) {
                onUnblockUserClicked();
            } else if (item.name == localize("DELETE_CHAT")) {
                setShowDeleteConversationDialog(true);
            }
        }

        const subscribeToEvents = () => {
            const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(user => {
                if (user.getBlockedByMe()) {
                    setShowStatus(false);
                    setActionItems([{
                        "name": localize("UNBLOCK_USER"),
                        "icon": blockIcon
                    }, {
                        "name": localize("DELETE_CHAT"),
                        "icon": deleteIcon
                    }]);
                }
                updateUserAfterBlockUnblock(user);
            });
            const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(user => {
                if (!user.getBlockedByMe()) {
                    setShowStatus(true);
                    setActionItems([{
                        "name": localize("BLOCK_USER"),
                        "icon": blockIcon
                    }, {
                        "name": localize("DELETE_CHAT"),
                        "icon": deleteIcon
                    }]);
                }
                updateUserAfterBlockUnblock(user);
            });

            return () => {
                ccUserBlocked?.unsubscribe();
                ccUserUnblocked?.unsubscribe();
            };
        };

        useEffect(() => {
            if (user.getBlockedByMe()) {
                setShowStatus(false);
            }
            const unsubscribeFromEvents = subscribeToEvents();
            return () => {
                unsubscribeFromEvents();
            };
        }, [subscribeToEvents, selectedItem]);

        const onHide = () => setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });

        const getDeleteConversationConfirmationView = () => {
            return <>
                <div className="cometchat-delete-chat-dialog__backdrop">
                    <CometChatConfirmDialog
                        title={localize("DELETE_CHAT")}
                        messageText={localize("CONFIRM_DELETE_CHAT")}
                        confirmButtonText={localize("DELETE")}
                        onCancelClick={() => {
                            setShowDeleteConversationDialog(!showDeleteConversationDialog)
                        }}
                        onSubmitClick={onDeleteConversationClicked} />
                </div>
            </>
        }

        const getBlockUserConfirmationDialogView = () => {
            return <>
                <div className="cometchat-block-user-dialog__backdrop">
                    <CometChatConfirmDialog
                        title={localize("BLOCK_THIS_CONTACT")}
                        messageText={localize("CONFIRM_BLOCK_CONTACT")}
                        confirmButtonText={localize("BLOCK_USER")}
                        onCancelClick={() => {
                            setShowBlockUserDialog(!showBlockUserDialog);
                        }}
                        onSubmitClick={onBlockUserClicked} />
                </div>
            </>
        }

        return (
            <>
                {showDeleteConversationDialog && getDeleteConversationConfirmationView()}
                {showBlockUserDialog && getBlockUserConfirmationDialogView()}
                <CometChatUserDetails
                    user={user}
                    actionItems={actionItems}
                    onHide={onHide}
                    showStatus={showStatus}
                    onUserActionClick={onUserActionClick}
                />
            </>
        )
    }
    interface ActionItem {
        name: string;
        icon: string;  // assuming the icon is a string, you can adjust based on the actual type (e.g., JSX.Element)
        type: 'scope' | 'alert'; // You can list the valid types here
        onClick: () => void;  // Function that triggers the action
        isAllowed: () => boolean; // Function that checks if the action is allowed
    }

    const SideComponentGroup = (props: { group: CometChat.Group }) => {
        const [groupTab, setGroupTab] = useState("view");
        const [showAddMembers, setShowAddMembers] = useState(false);
        const [showLeaveGroup, setShowLeaveGroup] = useState(false);
        const [showTransferownershipDialog, setShowTransferownershipDialog] = useState(false);
        const [showDeleteGroup, setShowDeleteGroup] = useState(false);
        const [showTransferOwnership, setShowTransferOwnership] = useState(false);
        const [showDeleteGroupChatDialog, setShowDeleteGroupChatDialog] = useState(false);
        const [actionItems, setActionItems] = useState<ActionItem[]>([]);
        const [scopeChanged, setScopeChanged] = useState(false);
        const { group } = props;
        const groupListener = "groupinfo_GroupListener_" + String(Date.now())
        useEffect(() => {
            CometChat.addGroupListener(groupListener, new CometChat.GroupListener({
                onGroupMemberScopeChanged: (
                    message: CometChat.Action,
                    changedUser: CometChat.GroupMember,
                    newScope: CometChat.GroupMemberScope,
                    oldScope: CometChat.GroupMemberScope,
                    changedGroup: CometChat.Group
                ) => {
                    if (changedGroup.getGuid() !== group?.getGuid()) {
                        return;
                    }
                    if (changedUser.getUid() == loggedInUser?.getUid()) {
                        setGroup(changedGroup)
                        setScopeChanged(true);
                    }
                },
            }))
        }, [group])
        useEffect(() => {
            setActionItems([
                {
                    "name": "Add Members",
                    "icon": addMembersIcon,
                    "type": "scope",
                    onClick: () => {
                        setShowAddMembers(!showAddMembers)
                    },
                    isAllowed: () => {
                        return isAdminOrOwner();
                    }
                }, {
                    "name": "Delete Chat",
                    "icon": deleteIcon,
                    "type": "alert",
                    onClick: () => {
                        setShowDeleteGroupChatDialog(true);
                    },
                    isAllowed: () => {
                        return true;
                    }
                }, {
                    "name": "Leave",
                    "icon": leaveGroupIcon,
                    "type": "alert",
                    onClick: () => {
                        if (group.getOwner() == CometChatUIKitLoginListener.getLoggedInUser()?.getUid()) {
                            setShowTransferownershipDialog(!showTransferownershipDialog)
                        }
                        else {
                            setShowLeaveGroup(!showLeaveGroup)
                        }
                    },
                    isAllowed: () => {
                        return group.getMembersCount() > 1 || (group.getMembersCount() == 1 && loggedInUser?.getUid() !== group.getOwner())
                    }
                }, {
                    "name": "Delete and Exit",
                    "icon": deleteIcon,
                    "type": "alert",
                    onClick: () => {
                        setShowDeleteGroup(!showDeleteGroup)
                    },
                    isAllowed: () => {
                        return isAdminOrOwner();
                    }
                }
            ])
        }, [scopeChanged, group])


        const isAdminOrOwner = () => {
            return group.getScope() == CometChatUIKitConstants.groupMemberScope.admin || group.getScope() == CometChatUIKitConstants.groupMemberScope.owner;
        }

        function transferOwnershipDialogView() {
            return <>
                <div className="cometchat-transfer-ownership-dialog__backdrop">
                    <CometChatConfirmDialog title={localize("OWNERSHIP_TRANSFER")} messageText={localize("CONFIRM_OWNERSHIP_TRANSFER")} confirmButtonText={localize("CONTINUE")} onCancelClick={() => {
                        setShowTransferownershipDialog(!showTransferownershipDialog)
                    }} onSubmitClick={
                        () => {
                            return new Promise((resolve, reject) => {
                                setShowTransferownershipDialog(!showTransferownershipDialog)
                                setShowTransferOwnership(!showTransferOwnership)
                                return resolve()
                            })
                        }
                    } />
                </div>
            </>
        }
        function transferOwnershipView() {
            return <>
                <div className="cometchat-transfer-ownership__backdrop">
                    <CometChatTransferOwnership group={group} onClose={() => {
                        setShowTransferOwnership(!showTransferOwnership)
                    }} />
                </div>
            </>
        }
        function addMembersView() {
            return <>
                <div style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    top: 0,
                    left: 0
                }}>
                    <CometChatAddMembers showBackButton={true} onBack={() => {
                        setShowAddMembers(!showAddMembers)
                    }} group={group} />

                </div>
            </>
        }
        function deleteGroupView() {
            return <>
                <div className="cometchat-delete-group__backdrop">
                    <CometChatConfirmDialog title={localize("DELETE_AND_EXIT")} messageText={localize("CONFIRM_DELETE_AND_EXIT")} confirmButtonText={localize("DELETE_AND_EXIT_LABEL")} onCancelClick={() => {
                        setShowDeleteGroup(!showDeleteGroup)
                    }} onSubmitClick={
                        () => {
                            return new Promise((resolve, reject) => {
                                CometChat.deleteGroup(group.getGuid()).then(() => {
                                    setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } })
                                    setSelectedItem(undefined);
                                    CometChatGroupEvents.ccGroupDeleted.next(CometChatUIKitUtility.clone(group));
                                    setShowDeleteGroup(!showDeleteGroup)
                                    CometChatConversationEvents.ccConversationDeleted.next((selectedItem as Conversation)!)
                                    toastTextRef.current = localize("GROUP_LEFT_AND_CHAT_DELETED");
                                    setShowToast(true);
                                    return resolve()
                                }).catch(() => {
                                    return reject()
                                })
                            }
                            )
                        }
                    } />
                </div>
            </>
        }
        const createGroupMemberLeftActionMessage = useCallback((group: CometChat.Group, loggedInUser: CometChat.User): CometChat.Action => {
            const action = CometChatUIKitConstants.groupMemberAction.LEFT;
            const actionMessage = new CometChat.Action(
                group.getGuid(),
                CometChatUIKitConstants.MessageTypes.groupMember,
                CometChatUIKitConstants.MessageReceiverType.group,
                CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
            );
            actionMessage.setAction(action);
            actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
            actionMessage.setActionOn(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
            actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
            actionMessage.setConversationId("group_" + group.getGuid());
            actionMessage.setMuid(CometChatUIKitUtility.ID());
            actionMessage.setMessage(`${loggedInUser.getName()} ${action} ${loggedInUser.getUid()}`);
            actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            return actionMessage;
        }, []);
        function leaveGroupView() {
            return <>
                <div className="cometchat-leave-group__backdrop">
                    <CometChatConfirmDialog title={localize("LEAVE_GROUP")} messageText={localize("CONFIRM_LEAVE_GROUP")} confirmButtonText={localize("LEAVE")} onCancelClick={() => {
                        setShowLeaveGroup(!showLeaveGroup)
                    }} onSubmitClick={
                        () => {
                            return new Promise((resolve, reject) => {
                                CometChat.leaveGroup(group.getGuid()).then(() => {
                                    let loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
                                    if (loggedInUser) {
                                        const groupClone = CometChatUIKitUtility.clone(group);
                                        groupClone.setHasJoined(false);
                                        CometChatGroupEvents.ccGroupLeft.next({
                                            userLeft: CometChatUIKitUtility.clone(loggedInUser),
                                            leftGroup: groupClone,
                                            message: createGroupMemberLeftActionMessage(groupClone, loggedInUser)
                                        });
                                    }
                                    setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } })
                                    setSelectedItem(undefined);
                                    setShowLeaveGroup(!showLeaveGroup);
                                    toastTextRef.current = localize("GROUP_LEFT");
                                    setShowToast(true);
                                    return resolve()
                                }).catch(() => {
                                    return reject();
                                })
                            })

                        }
                    } />
                </div>
            </>
        }

        const onDeleteGroupConversationClicked: () => Promise<void> = () => {
            const GUID = group.getGuid();
            return new Promise(async (resolve, reject) => {
                CometChat.deleteConversation(GUID, CometChatUIKitConstants.MessageReceiverType.group).then(
                    deletedConversation => {
                        setSelectedItem(undefined);
                        setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                        CometChatConversationEvents.ccConversationDeleted.next((selectedItem as Conversation)!);
                        return resolve();
                    }, error => {
                        console.log('error while deleting a conversation', error);
                        return reject();
                    }
                );
            });
        }

        const getDeleteConversationConfirmationView = () => {
            return <>
                <div className="cometchat-delete-chat-dialog__backdrop">
                    <CometChatConfirmDialog
                        title={localize("DELETE_CHAT")}
                        messageText={localize("CONFIRM_DELETE_CHAT")}
                        confirmButtonText={localize("DELETE")}
                        onCancelClick={() => {
                            setShowDeleteGroupChatDialog(!showDeleteGroupChatDialog)
                        }}
                        onSubmitClick={onDeleteGroupConversationClicked} />
                </div>
            </>
        }

        return (
            <>
                <div className="side-component-header">
                    <div className="side-component-header__text">{localize("GROUP_INFO")}</div>
                    <div className="side-component-header__icon" onClick={() => setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } })} />
                </div>
                <div className="side-component-content">
                    <div className="side-component-content__group">
                        <div className="side-component-content__avatar">
                            <CometChatAvatar
                                image={group?.getIcon()}
                                name={group?.getName()}
                            />
                        </div>
                        <div>
                            <div className="side-component-content__title">
                                {group?.getName()}
                            </div>
                            <div className="side-component-content__description">
                                {group?.getMembersCount?.() + " " + localize('MEMBERS')}
                            </div>
                        </div>
                    </div>

                    <div className="side-component-content__action">
                        {actionItems.map((actionItem, index) => (
                            actionItem.isAllowed() ? <div key={actionItem.name + index} className="side-component-content__action-item" onClick={() => {
                                if (actionItem.onClick) {
                                    actionItem.onClick()
                                }
                            }}>
                                <div
                                    className={actionItem.type === "alert" ? "side-component-content__action-item-icon" : "side-component-content__action-item-icon-default"}
                                    style={actionItem.icon ? { WebkitMask: `url(${actionItem.icon}), center, center, no-repeat` } : undefined}
                                />
                                <div className={actionItem.type === "alert" ? "side-component-content__action-item-text" : "side-component-content__action-item-text-default"} >
                                    {actionItem.name}
                                </div>
                            </div> : null
                        ))}
                    </div>
                    {group.getScope() != CometChatUIKitConstants.groupMemberScope.participant ? <div className="side-component-group-tabs-wrapper">
                        <div className="side-component-group-tabs">
                            <div
                                className={`side-component-group-tabs__tab ${groupTab === "view" ? "side-component-group-tabs__tab-active" : ""}`}
                                onClick={() => setGroupTab("view")}
                            >
                                <div className={`side-component-group-tabs__tab-text ${groupTab === "view" ? "side-component-group-tabs__tab-text-active" : ""}`}>
                                    {localize("VIEW_MEMBERS")}
                                </div>
                            </div>
                            <div
                                className={`side-component-group-tabs__tab ${groupTab === "banned" ? "side-component-group-tabs__tab-active" : ""}`}
                                onClick={() => { setGroupTab("banned") }}
                            >
                                <div className={`side-component-group-tabs__tab-text ${groupTab === "banned" ? "side-component-group-tabs__tab-text-active" : ""}`}>
                                    {localize("BANNED_MEMBERS")}
                                </div>
                            </div>
                        </div>
                    </div> : null}

                    <div className={isAdminOrOwner() ? "side-component-group-members-with-tabs" : "side-component-group-members"}>
                        {groupTab === "view" ?
                            <CometChatGroupMembers group={group} />
                            : groupTab === "banned" ?
                                <CometChatBannedMembers group={group} />
                                : null
                        }
                    </div>
                </div>
                {showDeleteGroupChatDialog && getDeleteConversationConfirmationView()}
                {showAddMembers && group ? addMembersView() : null}
                {
                    showLeaveGroup ? leaveGroupView() : null}
                {
                    showDeleteGroup ? deleteGroupView() : null}
                {
                    showTransferOwnership ? transferOwnershipView() : null}
                {
                    showTransferownershipDialog ? transferOwnershipDialogView() : null}
            </>
        )
    }

    const SideComponentThread = (props: ThreadProps) => {
        const {
            message
        } = props;

        const [requestBuilderState, setRequestBuilderState] = useState<MessagesRequestBuilder>();
        const [showComposer, setShowComposer] = useState(true);

        const requestBuilder = useCallback(() => {
            const threadMessagesBuilder = new CometChat.MessagesRequestBuilder()
                .setCategories(CometChatUIKit.getDataSource().getAllMessageCategories())
                .setTypes(CometChatUIKit.getDataSource().getAllMessageTypes())
                .hideReplies(true)
                .setLimit(20)
                .setParentMessageId(message.getId());
            setRequestBuilderState(threadMessagesBuilder);
        }, [message]);

        useEffect(() => {
            requestBuilder();
            let isUser = selectedItem instanceof CometChat.User;
            if (isUser && (selectedItem as CometChat.User)?.getBlockedByMe()) {
                setShowComposer(false);
            }
            const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(user => {
                if (user.getBlockedByMe()) {
                    setShowComposer(false);
                }
                updateUserAfterBlockUnblock(user);
            });
            const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe(user => {
                if (!user.getBlockedByMe()) {
                    setShowComposer(true);
                }
                updateUserAfterBlockUnblock(user);
            });

            return () => {
                ccUserBlocked?.unsubscribe();
                ccUserUnblocked?.unsubscribe();
            }
        }, [message]);

        const onClose = () => setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } })

        return (
            <CometChatThreadedMessages
                message={message}
                requestBuilderState={requestBuilderState}
                selectedItem={selectedItem}
                onClose={onClose}
                showComposer={showComposer}

            />
        );
    }

    useEffect(() => {
        if (newChat) {
            const convId = newChat.user?.getUid() || newChat.group?.getGuid();
            const convType = newChat.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
            CometChat.getConversation(convId!, convType).then(
                (conversation) => {
                    setSelectedItem(conversation);
                },
                (error) => {
                    setSelectedItem(undefined);
                }
            );
        }
    }, [newChat, newChat?.user, newChat?.group]);

    const onSelectorItemClicked = (e: Conversation | User | Group | Call, type: string) => {
        setShowNewChat(false);
        if (type === "updateSelectedItemGroup" && !(e as Group).getHasJoined()) {
            if ((e as Group).getType() === CometChatUIKitConstants.GroupTypes.public) {
                CometChat.joinGroup((e as Group).getGuid(), (e as Group).getType() as GroupType)
                    .then((response: any) => {
                        setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                        setNewChat(undefined);
                        response.setHasJoined?.(true);
                        response.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
                        setSelectedItem(response as Group);
                        setAppState({ type, payload: response });
                        setTimeout(() => {
                            CometChatGroupEvents.ccGroupMemberJoined.next({
                                joinedGroup: response,
                                joinedUser: loggedInUser!
                            })
                        }, 100)
                    })
                    .catch((error: unknown) => {
                        console.log(error);
                    });
            } else {
                setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                setNewChat(undefined);
                setGroup(e as Group);
                setAppState({ type, payload: e });
                showJoinGroupRef.current = true;
            }
        } else {
            setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
            setNewChat(undefined);
            setAppState({ type, payload: e });
            setSelectedItem(activeTab === "chats" ? e as Conversation : activeTab === "users" ? e as User : activeTab === "groups" ? e as Group : activeTab === "calls" ? e as Call : undefined);
        }
    }

    const subscribeToEvents = useCallback(() => {
        const ccConversationDeleted = CometChatConversationEvents.ccConversationDeleted.subscribe((conversation: Conversation) => {
            if (newChat?.user && conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.user) {
                if ((conversation.getConversationWith() as User).getUid() === newChat.user.getUid()) {
                    setNewChat(undefined);
                    setAppState({ type: "newChat", payload: undefined });
                    setSelectedItem(undefined);
                    setAppState({ type: "updateSelectedItem", payload: undefined });
                }
            } else if (newChat?.group && conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group) {
                if ((conversation.getConversationWith() as Group).getGuid() === newChat.group.getGuid()) {
                    setNewChat(undefined);
                    setAppState({ type: "newChat", payload: undefined });
                    setSelectedItem(undefined);
                    setAppState({ type: "updateSelectedItem", payload: undefined });
                }
            } else {
                if ((selectedItem as CometChat.Conversation)?.getConversationId?.() === conversation?.getConversationId?.()) {
                    setSelectedItem(undefined);
                    setAppState({ type: "updateSelectedItem", payload: undefined });
                }
            }
        })

        const ccOpenChat = CometChatUIEvents.ccOpenChat.subscribe((item) => {
            openChatForUser(item.user);
        })

        const ccClickEvent = CometChatUIEvents.ccMouseEvent.subscribe((mouseevent: IMouseEvent) => {
            if (mouseevent.event.type === "click" && (mouseevent.body as { CometChatUserGroupMembersObject: User })?.CometChatUserGroupMembersObject) {
                openChatForUser((mouseevent.body as { CometChatUserGroupMembersObject: User })?.CometChatUserGroupMembersObject);
            }
        })

        const openChatForUser = (user?: User) => {
            const uid = user?.getUid();
            if (uid) {
                setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
                if (activeTab === "chats") {
                    CometChat.getConversation(uid!, CometChatUIKitConstants.MessageReceiverType.user).then(
                        (conversation) => {
                            setNewChat(undefined);
                            setSelectedItem(conversation);
                            setAppState({ type: "updateSelectedItem", payload: conversation });
                        },
                        (error) => {
                            setNewChat({ user, group: undefined });
                            setSelectedItem(undefined);
                        }
                    );
                } else if (activeTab === "users") {
                    setNewChat(undefined);
                    setSelectedItem(user);
                    setAppState({ type: "updateSelectedItemUser", payload: user });
                } else if (activeTab === "groups") {
                    setNewChat({ user, group: undefined });
                    setSelectedItem(undefined);
                }
            }
        }

        return () => {
            ccConversationDeleted?.unsubscribe();
            ccOpenChat?.unsubscribe();
            ccClickEvent?.unsubscribe();
        };
    }, [newChat, selectedItem]);

    const attachSDKGroupListener = () => {
        const listenerId = "BannedOrKickedMembers_GroupListener_" + String(Date.now());
        CometChat.addGroupListener(
            listenerId,
            new CometChat.GroupListener({
                onGroupMemberBanned: (
                    message: CometChat.Action,
                    kickedUser: CometChat.User,
                    kickedBy: CometChat.User,
                    kickedFrom: CometChat.Group
                ) => {
                    if (((selectedItem as Group).getGuid?.() === kickedFrom.getGuid() || ((selectedItem as Conversation).getConversationWith?.() as Group)?.getGuid?.() === kickedFrom.getGuid()) && kickedUser.getUid() === loggedInUser?.getUid()) {
                        setShowAlertPopup({ visible: true, description: localize("BANNED") });
                    }
                },
                onGroupMemberKicked: (
                    message: CometChat.Action,
                    kickedUser: CometChat.User,
                    kickedBy: CometChat.User,
                    kickedFrom: CometChat.Group
                ) => {
                    if (((selectedItem as Group).getGuid?.() === kickedFrom.getGuid() || ((selectedItem as Conversation).getConversationWith?.() as Group)?.getGuid?.() === kickedFrom.getGuid()) && kickedUser.getUid() === loggedInUser?.getUid()) {
                        setShowAlertPopup({ visible: true, description: localize("KICKED") });
                    }
                },

            })
        );
        return () => CometChat.removeGroupListener(listenerId);
    }

    useEffect(() => {
        if (loggedInUser) {
            const unsubscribeFromEvents = subscribeToEvents();
            const unsubscribeFromGroupEvents = attachSDKGroupListener();
            return () => {
                unsubscribeFromEvents();
                unsubscribeFromGroupEvents();
            };
        }
    }, [loggedInUser, subscribeToEvents, attachSDKGroupListener]);

    const removedFromGroup = () => {
        setShowAlertPopup({ visible: false, description: "" });
        setSelectedItem(undefined);
        setAppState({ type: "updateSelectedItem", payload: undefined });
        setAppState({ type: "updateSideComponent", payload: { visible: false, type: "" } });
    }
    function closeToast() {
        setShowToast(false);
    }

    const getActiveItem = () => {
        if ((activeTab === "chats" && selectedItem instanceof CometChat.Conversation) ||
            (activeTab === "users" && selectedItem instanceof CometChat.User) ||
            (activeTab === "groups" && selectedItem instanceof CometChat.Group) ||
            (activeTab === 'calls' && selectedItem instanceof CallLog)
        ) {
            return selectedItem;
        } else {
            return undefined;
        }
    }

    const SideComponentWrapper = useMemo(() => {
        return (
            <SideComponent />
        )
    }, [appState.sideComponent]);

    return (
        loggedInUser && <div className='cometchat-root' data-theme={theme}>
            {showAlertPopup.visible &&
                <CometChatAlertPopup
                    onConfirmClick={removedFromGroup}
                    title={localize("NO_LONGER_PART_OF_GROUP")}
                    description={`${localize("YOU_HAVE_BEEN")} ${showAlertPopup.description} ${localize('REMOVED_BY_ADMIN')}`}
                />}
            <div className='conversations-wrapper'>
                <div className='selector-wrapper'>
                    {<CometChatSelector
                        activeItem={getActiveItem()}
                        activeTab={activeTab}
                        group={group}
                        onProtectedGroupJoin={(group) => setSelectedItem(group)}
                        onSelectorItemClicked={onSelectorItemClicked}
                        setShowCreateGroup={setShowCreateGroup}
                        showCreateGroup={showCreateGroup}
                        showJoinGroup={showJoinGroupRef.current}
                        onHide={() => showJoinGroupRef.current = false}
                        onNewChatClicked={() => {
                            setShowNewChat(true);
                            setAppState({ type: "updateSideComponent", payload: { type: "", visible: false } });
                        }}
                        onGroupCreated={(group) => setSelectedItem(group)}

                    />}
                </div>
                <TabComponent />
            </div>
            <div className='messages-wrapper'>
                <InformationComponent />
            </div>
            {SideComponentWrapper}
            <CometChatIncomingCall />
            {showToast ? <CometChatToast text={toastTextRef.current} onClose={closeToast} /> : null}
        </div>
    )
}

export { CometChatHome };