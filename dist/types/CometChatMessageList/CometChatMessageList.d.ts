import "@cometchat/uikit-elements";
import { AvatarStyle, BackdropStyle, DateStyle, EmojiKeyboardStyle } from "@cometchat/uikit-elements";
import { CometChatMessageTemplate, DatePatterns, MessageListAlignment, TimestampAlignment } from "@cometchat/uikit-resources";
import { CometChatTextFormatter, MessageInformationConfiguration, MessageListStyle, ReactionsConfiguration } from "@cometchat/uikit-shared";
interface IMessageListProps {
    parentMessageId?: number;
    user?: CometChat.User;
    group?: CometChat.Group;
    emptyStateText?: string;
    errorStateText?: string;
    emptyStateView?: any;
    errorStateView?: any;
    loadingStateView?: any;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.19 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
     */
    disableReceipt?: boolean;
    hideReceipt?: boolean;
    disableSoundForMessages?: boolean;
    customSoundForMessages?: string;
    readIcon?: string;
    deliveredIcon?: string;
    sentIcon?: string;
    waitIcon?: string;
    errorIcon?: string;
    loadingIconURL?: string;
    alignment?: MessageListAlignment;
    showAvatar?: boolean;
    datePattern?: DatePatterns;
    timestampAlignment?: TimestampAlignment;
    DateSeparatorPattern?: DatePatterns;
    hideDateSeparator?: boolean;
    templates?: CometChatMessageTemplate[];
    messagesRequestBuilder?: CometChat.MessagesRequestBuilder;
    newMessageIndicatorText?: string;
    scrollToBottomOnNewMessages?: boolean;
    thresholdValue?: number;
    onThreadRepliesClick?: Function;
    headerView?: any;
    footerView?: any;
    avatarStyle?: AvatarStyle;
    dateSeparatorStyle?: DateStyle;
    messageListStyle?: MessageListStyle;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    hideError?: boolean;
    messageInformationConfiguration?: MessageInformationConfiguration;
    reactionsConfiguration?: ReactionsConfiguration;
    disableReactions?: boolean;
    emojiKeyboardStyle?: EmojiKeyboardStyle;
    threadIndicatorIcon?: string;
    disableMentions?: boolean;
    textFormatters?: CometChatTextFormatter[];
    backdropStyle?: BackdropStyle;
}
declare const CometChatMessageList: (props: IMessageListProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatMessageList };
