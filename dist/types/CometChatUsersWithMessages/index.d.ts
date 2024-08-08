import { MessagesConfiguration, UsersConfiguration, WithMessagesStyle } from "@cometchat/uikit-shared";
interface IUsersWithMessagesProps {
    user?: CometChat.User;
    isMobileView?: boolean;
    messageText?: string;
    usersWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    usersConfiguration?: UsersConfiguration;
    onError?: Function;
}
declare const CometChatUsersWithMessages: (props: IUsersWithMessagesProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatUsersWithMessages };
