import "@cometchat/uikit-elements";
import { DetailsConfiguration, MessageComposerConfiguration, MessageHeaderConfiguration, MessageListConfiguration, MessagesStyle, ThreadedMessagesConfiguration } from "@cometchat/uikit-shared";
interface IMessagesProps {
    user?: CometChat.User;
    group?: CometChat.Group;
    hideMessageComposer?: boolean;
    disableTyping?: boolean;
    messageHeaderConfiguration?: MessageHeaderConfiguration;
    messageListConfiguration?: MessageListConfiguration;
    messageComposerConfiguration?: MessageComposerConfiguration;
    threadedMessagesConfiguration?: ThreadedMessagesConfiguration;
    detailsConfiguration?: DetailsConfiguration;
    customSoundForIncomingMessages?: string;
    customSoundForOutgoingMessages?: string;
    disableSoundForMessages?: boolean;
    messagesStyle?: MessagesStyle;
    messageHeaderView?: any;
    messageComposerView?: any;
    messageListView?: any;
    hideMessageHeader?: boolean;
    hideDetails?: boolean;
    auxiliaryMenu?: any;
}
declare const CometChatMessages: (props: IMessagesProps) => import("react/jsx-runtime").JSX.Element | null;
export { CometChatMessages };
