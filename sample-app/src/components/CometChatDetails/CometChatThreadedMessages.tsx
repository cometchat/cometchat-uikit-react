import "../../styles/CometChatDetails/CometChatThreadedMessages.css";
import { CometChatMessageComposer, CometChatMessageList, CometChatTextHighlightFormatter, CometChatThreadHeader, CometChatUIKit, CometChatUserEvents, getLocalizedString } from "@cometchat/chat-uikit-react";
import {CometChat} from '@cometchat/chat-sdk-javascript'
interface ThreadProps {
    message: CometChat.BaseMessage;
    requestBuilderState?: CometChat.MessagesRequestBuilder;
    selectedItem: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call | undefined;
    onClose?: () => void;
    showComposer?: boolean;
    onSubtitleClicked?: () => void;
    goToMessageId?: string;
    searchKeyword?: string;

}

export const CometChatThreadedMessages = (props: ThreadProps) => {
    const {
        message,
        requestBuilderState,
        selectedItem,
        onClose = () => { },
        showComposer = false,
        onSubtitleClicked,
        goToMessageId,
        searchKeyword
    } = props;
    
    function getFormatters(){
        let formatters = CometChatUIKit.getDataSource().getAllTextFormatters({});
        if(searchKeyword){
            formatters.push(new CometChatTextHighlightFormatter(searchKeyword))
        }
        return formatters
  
    }
    return (
        <div className="cometchat-threaded-message">
            <div className="cometchat-threaded-message-header">
                <CometChatThreadHeader onSubtitleClicked={onSubtitleClicked} parentMessage={message} onClose={onClose} />
            </div>
            {requestBuilderState?.parentMessageId === message.getId() &&
                <>
                    <div className="cometchat-threaded-message-list">
                        <CometChatMessageList
                            textFormatters={searchKeyword && searchKeyword.trim() !== "" ? getFormatters() : undefined}
                            goToMessageId={goToMessageId}
                            parentMessageId={message.getId()}
                            user={(selectedItem as CometChat.Conversation)?.getConversationType?.() === "user" ? (selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User : (selectedItem as CometChat.User).getUid?.() ? selectedItem as CometChat.User : undefined}
                            group={(selectedItem as CometChat.Conversation)?.getConversationType?.() === "group" ? (selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.Group : (selectedItem as CometChat.Group).getGuid?.() ? selectedItem as CometChat.Group : undefined}
                            messagesRequestBuilder={requestBuilderState}
                        />
                    </div>
            {showComposer ?         <div className="cometchat-threaded-message-composer">
                        <CometChatMessageComposer
                            parentMessageId={message.getId()}
                            user={(selectedItem as CometChat.Conversation)?.getConversationType?.() === "user" ? (selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User : (selectedItem as CometChat.User).getUid?.() ? selectedItem as CometChat.User : undefined}
                            group={(selectedItem as CometChat.Conversation)?.getConversationType?.() === "group" ? (selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.Group : (selectedItem as CometChat.Group).getGuid?.() ? selectedItem as CometChat.Group : undefined}
                        />
                    </div> : 
                    (
                    <div className="message-composer-blocked">
                        <div className="message-composer-blocked__text">
                            {getLocalizedString("cannot_send_to_blocked_user")}{" "}
                            <a
                                onClick={() => {
                                let user: CometChat.User | null = null;

                                if (selectedItem instanceof CometChat.User) {
                                    user = selectedItem;
                                } else if (
                                    selectedItem instanceof CometChat.Conversation &&
                                    selectedItem.getConversationType() ===
                                    CometChat.RECEIVER_TYPE.USER &&
                                    selectedItem.getConversationWith() instanceof
                                    CometChat.User
                                ) {
                                    user =
                                    selectedItem.getConversationWith() as CometChat.User;
                                }
                                if (user) {
                                    CometChat.unblockUsers([user.getUid()]).then(() => {
                                    user?.setBlockedByMe(false);
                                    CometChatUserEvents.ccUserUnblocked.next(
                                        user as CometChat.User
                                    );
                                    });
                                }
                                }}
                            >
                                {getLocalizedString("click_to_unblock")}
                            </a>
                        </div>
                    </div>
                    )}
                </>}
        </div>
    );
}