import { CometChatCompactMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatTextHighlightFormatter, CometChatUIKit, getLocalizedString, CometChatUserEvents } from "@cometchat/chat-uikit-react";
import "../../styles/CometChatMessages/CometChatMessages.css";
import { useEffect, useState } from "react";
import { CometChat } from "@cometchat/chat-sdk-javascript";
interface MessagesViewProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    onHeaderClicked: () => void;
    onThreadRepliesClick: (message: CometChat.BaseMessage) => void;
    onSearchClicked?: () => void;
    showComposer?: boolean;
    onBack?: () => void;
    goToMessageId?: string;
    searchKeyword?: string;
}

export const CometChatMessages = (props: MessagesViewProps) => {
    const {
        user,
        group,
        onHeaderClicked,
        onThreadRepliesClick,
        showComposer,
        onBack = () => {},
        onSearchClicked = () => {},
        goToMessageId,
        searchKeyword
    } = props;
    const [showComposerState, setShowComposerState] = useState<boolean | undefined>(showComposer);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        setShowComposerState(showComposer);
        if (user?.getBlockedByMe?.()) {
            setShowComposerState(false);
        }
    }, [user, showComposer]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    function getFormatters() {
        let formatters = CometChatUIKit.getDataSource().getAllTextFormatters({});

        if(searchKeyword) {
            formatters.push(new CometChatTextHighlightFormatter(searchKeyword))
        }
        return formatters;
  
    }

    return (
        <div className="cometchat-messages-wrapper">
            <div className="cometchat-header-wrapper" >
                <CometChatMessageHeader
                    user={user}
                    group={group}
                    onBack={onBack}
                    showBackButton={isMobile}
                    showSearchOption={true}
                    onSearchOptionClicked={onSearchClicked}
                    onItemClick={onHeaderClicked}
                    // hideVoiceCallButton={true}
                    // hideVideoCallButton={true}   
                />
            </div>
            <div className="cometchat-message-list-wrapper">
                <CometChatMessageList
                    user={user}
                    group={group}
                    onThreadRepliesClick={(message: CometChat.BaseMessage) => onThreadRepliesClick(message)}
                    goToMessageId={goToMessageId}
                    textFormatters={getFormatters()}
                    startFromUnreadMessages={true}
                    showMarkAsUnreadOption={true}
                />
            </div>
            {showComposerState ? <div className="cometchat-composer-wrapper">
                <CometChatCompactMessageComposer
                    user={user}
                    group={group}
                />
                
            </div> : <div className="message-composer-blocked">
                <div className="message-composer-blocked__text">
                    {getLocalizedString("cannot_send_to_blocked_user")}{" "}
                    <a onClick={() => {
                        if (user) {
                            CometChat.unblockUsers([user?.getUid()]).then(() => {
                                user.setBlockedByMe(false);
                                CometChatUserEvents.ccUserUnblocked.next(user);
                            })
                        }
                    }}>
                        {getLocalizedString("click_to_unblock")}
                    </a>
                </div>
            </div>}
        </div>
    )
}