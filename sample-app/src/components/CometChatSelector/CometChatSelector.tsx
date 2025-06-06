import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import chatIcon from '../../assets/start_chat.svg';
import createGroupIcon from '../../assets/create-group.svg';
import logoutIcon from '../../assets/logout.svg';
import userIcon from '../../assets/user.svg';
import { CometChat } from "@cometchat/chat-sdk-javascript";
import "../../styles/CometChatSelector/CometChatSelector.css";
import { CometChatJoinGroup } from "../CometChatJoinGroup/CometChatJoinGroup";
import CometChatCreateGroup from "../CometChatCreateGroup/CometChatCreateGroup";
import { CometChatButton, CometChatCallLogs, CometChatConversations, CometChatGroups, CometChatOption, CometChatUIKit, CometChatUIKitLoginListener, CometChatUsers, localize } from "@cometchat/chat-uikit-react";
import { CometChatContextMenu, Placement } from "@cometchat/chat-uikit-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";

interface SelectorProps {
    group?: CometChat.Group;
    showJoinGroup?: boolean;
    activeTab?: string;
    activeItem?: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call;
    onSelectorItemClicked?: (input: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call, type: string) => void;
    onProtectedGroupJoin?: (group: CometChat.Group) => void;
    showCreateGroup?: boolean;
    setShowCreateGroup?: Dispatch<SetStateAction<boolean>>;
    onHide?: () => void;
    onNewChatClicked?: () => void;
    onGroupCreated?: (group: CometChat.Group) => void;
}

export const CometChatSelector = (props: SelectorProps) => {
    const {
        group,
        showJoinGroup,
        activeItem,
        activeTab,
        onSelectorItemClicked = () => { },
        onProtectedGroupJoin = () => { },
        showCreateGroup,
        setShowCreateGroup = () => { },
        onHide = () => { },
        onNewChatClicked = () => { },
        onGroupCreated = () => { },
    } = props;

    const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>();
    const navigate = useNavigate();
    const { setAppState } = useContext(AppContext);


    useEffect(() => {
        let loggedInUsers = CometChatUIKitLoginListener.getLoggedInUser();
        setLoggedInUser(loggedInUsers)
    }, [CometChatUIKitLoginListener?.getLoggedInUser()])

    const getOptions = (): CometChatOption[] => {
        return [
            new CometChatOption({
                id: "logged-in-user",
                title: loggedInUser && loggedInUser.getName() || "",
                iconURL: userIcon,
            }),
            new CometChatOption({
                id: "create-conversation",
                title: localize("CREATE_CONVERSATION"),
                iconURL: chatIcon,
                onClick: () => {
                    onNewChatClicked()
                },
            }),
            new CometChatOption({
                id: "log-out",
                title: localize("LOG_OUT"),
                iconURL: logoutIcon,
                onClick: () => {
                    logOut();
                },
            })
        ]
    };

    const logOut = () => {
        CometChatUIKit.logout().then(() => {
            setLoggedInUser(null)
            navigate('/login', { replace: true });
            setAppState({ type: "resetAppState" });
        }).catch((error) => {
            console.log("error", error)
        })
    }

    const conversationsHeaderView = () => {
        return (
            <div className="cometchat-conversations-header">
                <div className="cometchat-conversations-header__title">
                    {localize("CHATS")}
                </div>
                <div className="chat-menu">
                    <CometChatContextMenu
                        key="delete-button"
                        closeOnOutsideClick={true}
                        placement={Placement.left}
                        data={getOptions() as CometChatOption[]}
                        topMenuSize={1}
                        onOptionClicked={(e: CometChatOption) => {
                            const { id, onClick } = e;
                            if (onClick) {
                                onClick();
                            }
                        }}
                    />
                </div>
            </div>
        )
    }

    const groupsHeaderView = () => {
        return (
            <div className="cometchat-groups-header" >
                <div className="cometchat-groups-header__title" >
                    {localize("GROUPS")}
                </div>
                < CometChatButton onClick={() => {
                    setShowCreateGroup(true)
                }}
                    iconURL={createGroupIcon} />
            </div>
        )
    }

    return (
        <>
            {loggedInUser && <>
                {showJoinGroup && group && (
                    <CometChatJoinGroup
                        group={group}
                        onHide={onHide}
                        onProtectedGroupJoin={(group) => onProtectedGroupJoin(group)}
                    />
                )}
                {activeTab == "chats" ? (
                    <CometChatConversations
                        activeConversation={activeItem as CometChat.Conversation}
                        headerView={conversationsHeaderView()}
                        onItemClick={(e) => {
                            onSelectorItemClicked(e, "updateSelectedItem");
                        }}
                    />
                ) : activeTab == "calls" ? (
                    <CometChatCallLogs
                        activeCall={activeItem as CometChat.Call}
                        onItemClick={(e: CometChat.Call) => {
                            onSelectorItemClicked(e, "updateSelectedItemCall");
                        }}
                    />
                ) : activeTab == "users" ? (
                    <CometChatUsers
                        activeUser={activeItem as CometChat.User}
                        onItemClick={(e) => {
                            onSelectorItemClicked(e, "updateSelectedItemUser");
                        }}
                    />
                ) : activeTab == "groups" ? (
                    <CometChatGroups
                        activeGroup={activeItem as CometChat.Group}
                        headerView={groupsHeaderView()}
                        onItemClick={(e) => {
                            onSelectorItemClicked(e, "updateSelectedItemGroup");
                        }}
                    />
                ) : null}
                {showCreateGroup && (
                    <>
                        <CometChatCreateGroup
                            setShowCreateGroup={setShowCreateGroup}
                            onGroupCreated={(group) => onGroupCreated(group)}
                        />
                    </>
                )}
            </>}
        </>
    );
}