import { CometChat } from "@cometchat-pro/chat";
import { useCallback, useRef, useState, useContext } from "react";
import { CometChatUserEvents, fontHelper, localize } from "uikit-resources-lerna";
import { CometChatUIKitUtility, MessagesConfiguration, UsersConfiguration, WithMessagesStyle } from "uikit-utils-lerna";
import { CometChatMessages } from "../CometChatMessages";
import { CometChatUsers } from "../CometChatUsers";
import { Hooks } from "./hooks";
import { EmptyMessagesDivStyle, MobileLayoutStyle, WithMessagesMainStyle, WithMessagesSidebarStyle, WithMessagesWrapperStyle } from "./style";
import { CometChatContext } from "../CometChatContext";

interface IUsersWithMessagesProps {
    user?: CometChat.User,
    isMobileView?: boolean,
    messageText?: string,
    usersWithMessagesStyle?: WithMessagesStyle,
    messagesConfiguration?: MessagesConfiguration,
    usersConfiguration?: UsersConfiguration,
    onError?: Function,
}

const defaultProps: IUsersWithMessagesProps = {
    user: undefined,
    isMobileView: false,
    messageText: localize("NO_CHATS_SELECTED"),
    usersWithMessagesStyle: {
        width: "100%",
        height: "100%",
        borderRadius: "none",
        border: "none",
    },
    messagesConfiguration: new MessagesConfiguration({}),
    usersConfiguration: new UsersConfiguration({}),
    onError: (error: CometChat.CometChatException) => { console.log(error) },
};

const CometChatUsersWithMessages = (props: IUsersWithMessagesProps) => {
    const { theme } = useContext(CometChatContext);
    const {
        user,
        isMobileView,
        messageText,
        usersWithMessagesStyle,
        messagesConfiguration,
        usersConfiguration,
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

    const withMessagesStyleRef = useRef({ ...defaultWithMessagesStyle, ...usersWithMessagesStyle });

    labelStyle.textFont = withMessagesStyleRef.current.messageTextFont;
    labelStyle.textColor = withMessagesStyleRef.current.messageTextColor;

    const [activeUser, setActiveUser] = useState<CometChat.User | null>(user ?? null);

    const onBack = () => {
        setActiveUser(null);
    }

    const onErrorCallback = useCallback(
        (error: any) => {
            if (!(error instanceof CometChat.CometChatException)) {
                let errorModel = {
                    code: error?.code,
                    name: error?.name,
                    message: error?.message,
                    details: error?.details
                }
                let errorObj = new CometChat.CometChatException(errorModel);
                onError!(errorObj);
            } else {
                onError!(error);
            }
        }, [onError]
    );

    const onItemClick = (user: CometChat.User) => {
        // console.log(user.getName());
        setActiveUser(user);
    };

    const subscribeToEvents = useCallback(
        () => {
            try {
                const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe(
                    (user: CometChat.User) => {
                        if (activeUser && activeUser.getUid() === user.getUid()) {
                            setActiveUser(user);
                        }
                    }
                );
                const ccUserUnBlocked = CometChatUserEvents.ccUserUnblocked.subscribe(
                    (user: CometChat.User) => {
                        if (activeUser && activeUser.getUid() === user.getUid()) {
                            setActiveUser(user);
                        }
                    }
                );

                return () => {
                    try {
                        ccUserBlocked?.unsubscribe();
                        ccUserUnBlocked?.unsubscribe();
                    } catch (error: any) {
                        onErrorCallback(error);
                    }
                }
            } catch (error: any) {
                onErrorCallback(error);
            }
        }, [activeUser, setActiveUser, onErrorCallback]
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
            if (isMobileView) {
                return MobileLayoutStyle;
            } else {
                return WithMessagesSidebarStyle;
            }
        }, [isMobileView]
    );

    const getWithMessagesMainStyle = useCallback(
        () => {
            if (isMobileView) {
                return MobileLayoutStyle;
            } else {
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
        subscribeToEvents,
        user,
        setActiveUser
    );

    return (
        <div className="cc__withmessages__wrapper" style={{ ...WithMessagesWrapperStyle, ...chatsWrapperStyles() }}>
            <div className="cc__withmessages__sidebar" style={getWithMessagesSidebarStyle()}>
                <CometChatUsers
                    activeUser={activeUser ?? undefined}
                    hideSearch={usersConfiguration?.hideSearch}
                    searchIconURL={usersConfiguration?.searchIconURL}
                    searchRequestBuilder={usersConfiguration?.searchRequestBuilder}
                    onItemClick={usersConfiguration?.onItemClick || onItemClick}
                    usersStyle={usersConfiguration?.usersStyle}
                    subtitleView={usersConfiguration?.subtitleView}
                    options={usersConfiguration?.options ?? undefined}
                    usersRequestBuilder={usersConfiguration?.usersRequestBuilder}
                    emptyStateView={usersConfiguration?.emptyStateView}
                    onSelect={usersConfiguration?.onSelect}
                    loadingIconURL={usersConfiguration?.loadingIconURL}
                    errorStateView={usersConfiguration?.errorStateView}
                    loadingStateView={usersConfiguration?.loadingStateView}
                    tileAlignment={usersConfiguration?.titleAlignment}
                    showSectionHeader={usersConfiguration?.showSectionHeader}
                    listItemView={usersConfiguration?.listItemView}
                    menus={usersConfiguration?.menu}
                    hideSeparator={usersConfiguration?.hideSeparator}
                    hideError={usersConfiguration?.hideError}
                    selectionMode={usersConfiguration?.selectionMode}
                    listItemStyle={usersConfiguration?.listItemStyle}
                    disableUsersPresence={usersConfiguration?.disableUsersPresence}
                    statusIndicatorStyle={usersConfiguration?.statusIndicatorStyle}
                    avatarStyle={usersConfiguration?.avatarStyle}
                />
            </div>

            {
                activeUser ?
                    <div className="cc__withmessages__main" style={getWithMessagesMainStyle()}>
                        <CometChatMessages
                            user={activeUser}
                            messageHeaderConfiguration={makeMessageHeaderConfiguration(messagesConfiguration)}
                            messageListConfiguration={messagesConfiguration?.messageListConfiguration}
                            messageComposerConfiguration={messagesConfiguration?.messageComposerConfiguration}
                            messagesStyle={messagesConfiguration?.messagesStyle}
                            customSoundForIncomingMessages={messagesConfiguration?.customSoundForIncomingMessages}
                            customSoundForOutgoingMessages={messagesConfiguration?.customSoundForOutgoingMessages}
                            detailsConfiguration={messagesConfiguration?.detailsConfiguration}
                            disableSoundForMessages={messagesConfiguration?.disableSoundForMessages}
                            disableTyping={messagesConfiguration?.disableTyping}
                            hideMessageComposer={messagesConfiguration?.hideMessageComposer}
                            hideMessageHeader={messagesConfiguration?.hideMessageHeader}
                            messageComposerView={messagesConfiguration?.messageComposerView}
                            messageHeaderView={messagesConfiguration?.messageHeaderView}
                            messageListView={messagesConfiguration?.messageListView}
                        />
                    </div>
                    : null
            }

            {
                !activeUser ?
                    <div className="cc__decorator__message--empty" style={{ ...EmptyMessagesDivStyle, ...emptyMessageStyle() }}>
                        <cometchat-label text={messageText} labelStyle={JSON.stringify(labelStyle)}></cometchat-label>
                    </div> :
                    null
            }

        </div>
    );
}

CometChatUsersWithMessages.defaultProps = defaultProps;
export { CometChatUsersWithMessages };
