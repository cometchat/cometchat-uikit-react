import { AvatarStyle, BadgeStyle, BaseStyle, ConfirmDialogStyle, DateStyle, ListItemStyle, ReceiptStyle } from "@cometchat/uikit-elements";
import { CSSProperties, JSX } from "react";
import { CometChatTextFormatter, ConversationsStyle } from "@cometchat/uikit-shared";
import { CometChatOption, DatePatterns, SelectionMode, States, TitleAlignment } from "@cometchat/uikit-resources";
interface IConversationsProps {
    /**
     * Custom view to render on the top-right of the component
     */
    menus?: JSX.Element;
    /**
     * Title of the component
     *
     * @defaultValue `localize("CHATS")`
     */
    title?: string;
    /**
     * Alignment of the `title` text
     *
     * @defaultValue `TitleAlignment.left`
     */
    titleAlignment?: TitleAlignment;
    /**
     * Request builder to fetch conversations
     * @defaultValue Default request builder having the limit set to 30
     */
    conversationsRequestBuilder?: CometChat.ConversationsRequestBuilder;
    /**
     * Function to call whenever the component encounters an error
     */
    onError?: (error: CometChat.CometChatException) => void;
    /**
     * Custom list item view to be rendered for each conversation in the fetched list
     */
    listItemView?: (conversation: CometChat.Conversation) => JSX.Element;
    /**
     * Custom subtitle view to be rendered for each conversation in the fetched list
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    subtitleView?: (conversation: CometChat.Conversation) => JSX.Element;
    /**
     * Hide user presence
     *
     * @remarks
     * If set to true, the status indicator of the default list item view is not displayed for conversation objects related to users
     *
     * @defaultValue `false`
     */
    disableUsersPresence?: boolean;
    /**
     * Hide the separator at the bottom of the default list item view
     *
     * @defaultValue `false`
     */
    hideSeparator?: boolean;
    /**
     * Conversation to highlight
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided
     */
    activeConversation?: CometChat.Conversation;
    /**
     * Selection mode to use for the default tail view
     *
     * @remarks
     * This prop is used if `listItemView` prop is not provided.
     *
     * @defaultValue `SelectionMode.none`
     */
    selectionMode?: SelectionMode;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.19 due to newer property 'hideReceipt'. It will be removed in subsequent versions.
     */
    /**
     * Disable receipt status
     *
     * @remarks
     * If set to true, the receipt status of the sent message won't be displayed, and received messages won't be marked as delivered
     *
     * @defaultValue `false`
     */
    disableReceipt?: boolean;
    /**
   * hide receipt status
   *
   * @remarks
   * If set to true, the receipt status of the message won't be displayed
   *
   * @defaultValue `false`
   */
    hideReceipt?: boolean;
    /**
     * List of actions available on mouse over on the default list item component
     */
    options?: ((conversation: CometChat.Conversation) => CometChatOption[]) | null;
    /**
     * Date format for the date component
     *
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    datePattern?: DatePatterns;
    /**
     * @deprecated
     *
     * This property is deprecated as of version 4.3.8 due to newer property 'passwordGroupIcon'. It will be removed in subsequent versions.
     */
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a password-protected group
     *
     * @defaultValue `./assets/locked.svg`
     */
    protectedGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a password-protected group
     *
     * @defaultValue {undefined}
     */
    passwordGroupIcon?: string;
    /**
     * Image URL for the status indicator icon in the default list item view of a conversation related to a private group
     *
     * @defaultValue `./assets/private.svg`
     */
    privateGroupIcon?: string;
    /**
     * Image URL for the read status of the sent message
     *
     * @defaultValue `./assets/message-read.svg`
     */
    readIcon?: string;
    /**
     * Image URL for the delivered status of the sent message
     *
     * @defaultValue `./assets/message-delivered.svg`
     */
    deliveredIcon?: string;
    /**
     * Image URL for the wait status of the sent message
     *
     * @defaultValue `./assets/wait.svg`
     */
    waitIcon?: string;
    /**
     * Image URL for the error status of the sent message
     *
     * @defaultValue `./assets/warning-small.svg`
     */
    errorIcon?: string;
    /**
     * Image URL for the sent status of the sent message
     *
     * @defaultValue `./assets/message-sent.svg`
     */
    sentIcon?: string;
    /**
     * Image URL for the default loading view
     *
     * @defaultValue `./assets/spinner.svg`
     */
    loadingIconURL?: string;
    /**
     * Custom view for the loading state of the component
     */
    loadingStateView?: JSX.Element;
    /**
     * Text to display in the default empty view
     *
     * @defaultValue `localize("NO_CHATS_FOUND")`
     */
    emptyStateText?: string;
    /**
     * Custom view for the empty state of the component
     */
    emptyStateView?: JSX.Element;
    /**
     * Text to display in the default error view
     *
     * @defaultValue `localize("SOMETHING_WRONG")`
     */
    errorStateText?: string;
    /**
     * Custom view for the error state of the component
     */
    errorStateView?: JSX.Element;
    /**
     * Hide error view
     *
     * @remarks
     * If set to true, hides the default and the custom error view
     *
     * @defaultValue `false`
     */
    hideError?: boolean;
    /**
     * Function to call on click of the default list item view of a conversation
     */
    onItemClick?: (conversation: CometChat.Conversation) => void;
    /**
     * Function to call when a conversation from the fetched list is selected
     *
     * @remarks
     * This prop is used if `selectionMode` prop is not `SelectionMode.none`
     */
    onSelect?: (conversation: CometChat.Conversation, selected: boolean) => void;
    /**
     * Disable sound for incoming messages
     *
     * @defaulValue `false`
     */
    disableSoundForMessages?: boolean;
    /**
     * Disable typing indicator display
     *
     * @defaultValue `false`
     */
    disableTyping?: boolean;
    /**
     * Custom audio sound for incoming messages
     */
    customSoundForMessages?: string;
    /**
     * Styles to apply to this component
     */
    conversationsStyle?: ConversationsStyle;
    /**
     * Styles to apply to the delete conversation dialog component
     */
    deleteConversationDialogStyle?: ConfirmDialogStyle;
    /**
     * Styles to apply to the avatar component of the default list item view
     */
    avatarStyle?: AvatarStyle;
    /**
     * Styles to apply to the status indicator component of the default list item view
     */
    statusIndicatorStyle?: CSSProperties;
    /**
     * Styles to apply to the default list item view
     */
    listItemStyle?: ListItemStyle;
    /**
     * Styles to apply to the badge component
     *
     * @remarks
     * The badge component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    badgeStyle?: BadgeStyle;
    /**
     * Styles to apply to the receipt component
     *
     * @remarks
     * The receipt component is rendered conditionally inside the subtitle view of the default list item view
     */
    receiptStyle?: ReceiptStyle;
    /**
     * Styles to apply to the date component
     *
     * @remarks
     * The date component is inside the tail view of the default list item view when `selectionMode` prop is set to `SelectionMode.none`
     */
    dateStyle?: DateStyle;
    /**
     * Styles to apply to the backdrop component
     */
    backdropStyle?: BaseStyle;
    confirmDialogTitle?: string;
    confirmDialogMessage?: string;
    cancelButtonText?: string;
    confirmButtonText?: string;
    disableMentions?: boolean;
    textFormatters?: CometChatTextFormatter[];
}
export type Action = {
    type: "appendConversations";
    conversations: CometChat.Conversation[];
    removeOldConversation?: boolean;
} | {
    type: "setConversationList";
    conversationList: CometChat.Conversation[];
} | {
    type: "setFetchState";
    fetchState: States;
} | {
    type: "setConversationToBeDeleted";
    conversation: CometChat.Conversation | null;
} | {
    type: "removeConversation";
    conversation: CometChat.Conversation;
} | {
    type: "updateConversationWithUser";
    user: CometChat.User;
} | {
    type: "fromUpdateConversationListFn";
    conversation: CometChat.Conversation;
} | {
    type: "addTypingIndicator";
    typingIndicator: CometChat.TypingIndicator;
} | {
    type: "removeTypingIndicator";
    typingIndicator: CometChat.TypingIndicator;
} | {
    type: "updateConversationLastMessage";
    message: CometChat.BaseMessage;
} | {
    type: "updateConversationLastMessageAndPlaceAtTheTop";
    message: CometChat.BaseMessage;
} | {
    type: "updateConversationLastMessageAndGroupAndPlaceAtTheTop";
    group: CometChat.Group;
    message: CometChat.Action;
} | {
    type: "removeConversationOfTheGroup";
    group: CometChat.Group;
} | {
    type: "removeConversationOfTheUser";
    user: CometChat.User;
} | {
    type: "updateConversationLastMessageResetUnreadCountAndPlaceAtTheTop";
    message: CometChat.BaseMessage;
    conversation: CometChat.Conversation;
} | {
    type: "resetUnreadCountAndSetReadAtIfLastMessage";
    message: CometChat.BaseMessage;
} | {
    type: "setLastMessageReadOrDeliveredAt";
    updateReadAt: boolean;
    messageReceipt: CometChat.MessageReceipt;
} | {
    type: "setLoggedInUser";
    loggedInUser: CometChat.User | null;
} | {
    type: "setIsFirstReload";
    isFirstReload: boolean;
};
/**
 * Renders a scrollable list of conversations that has been created in a CometChat app
 */
export declare function CometChatConversations(props: IConversationsProps): import("react/jsx-runtime").JSX.Element;
export {};
