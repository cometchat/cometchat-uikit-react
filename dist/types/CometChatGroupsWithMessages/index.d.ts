import { CreateGroupConfiguration, GroupsConfiguration, JoinGroupConfiguration, MessagesConfiguration, WithMessagesStyle } from "@cometchat/uikit-shared";
interface IGroupsWithMessagesProps {
    group?: CometChat.Group;
    isMobileView?: boolean;
    messageText?: string;
    groupsWithMessagesStyle?: WithMessagesStyle;
    messagesConfiguration?: MessagesConfiguration;
    groupsConfiguration?: GroupsConfiguration;
    createGroupConfiguration?: CreateGroupConfiguration;
    joinGroupConfiguration?: JoinGroupConfiguration;
    onError?: ((error: CometChat.CometChatException) => void) | null;
}
declare const CometChatGroupsWithMessages: (props: IGroupsWithMessagesProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatGroupsWithMessages };
