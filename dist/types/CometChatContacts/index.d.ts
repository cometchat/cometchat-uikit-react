import { ContactsStyle, GroupsConfiguration, UsersConfiguration } from "@cometchat/uikit-shared";
import { SelectionMode, TabsVisibility } from "@cometchat/uikit-resources";
interface ContactsProps {
    title?: string;
    usersTabTitle?: string;
    groupsTabTitle?: string;
    usersConfiguration?: UsersConfiguration;
    groupsConfiguration?: GroupsConfiguration;
    onSubmitButtonClick?: (users?: CometChat.User[], groups?: CometChat.Group[]) => void;
    closeIconURL?: string;
    onClose?: () => void;
    onItemClick?: (user?: CometChat.User, group?: CometChat.Group) => void;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    submitButtonText?: string;
    hideSubmitButton?: boolean;
    selectionLimit?: number;
    tabVisibility?: TabsVisibility;
    contactsStyle?: ContactsStyle;
    selectionMode?: SelectionMode;
}
declare const CometChatContacts: (props: ContactsProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatContacts };
