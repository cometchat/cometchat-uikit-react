import { ContactsConfiguration, ConversationsConfiguration, MessagesConfiguration, WithMessagesStyle } from "@cometchat/uikit-shared";
interface IConversationsWithMessagesProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    isMobileView?: boolean;
    messageText?: string;
    conversationsWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    conversationsConfiguration?: ConversationsConfiguration;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    startConversationConfiguration?: ContactsConfiguration;
    startConversationIconURL?: string;
}
declare const CometChatConversationsWithMessages: {
    (props: IConversationsWithMessagesProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: IConversationsWithMessagesProps;
};
export { CometChatConversationsWithMessages };
