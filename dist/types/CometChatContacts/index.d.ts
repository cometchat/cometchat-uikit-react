import { ContactsStyle, GroupsConfiguration, UsersConfiguration } from "@cometchat/uikit-shared";
import { TabsVisibility } from "@cometchat/uikit-resources";
interface ContactsProps {
    title?: string;
    usersTabTitle?: string;
    groupsTabTitle?: string;
    usersConfiguration?: UsersConfiguration;
    groupsConfiguration?: GroupsConfiguration;
    closeIconURL?: string;
    onClose?: () => void;
    onItemClick?: (user?: CometChat.User, group?: CometChat.Group) => void;
    onError: ((error: CometChat.CometChatException) => void) | null;
    tabVisibility?: TabsVisibility;
    contactsStyle: ContactsStyle;
}
declare const CometChatContacts: {
    (props: ContactsProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: ContactsProps;
};
export { CometChatContacts };
