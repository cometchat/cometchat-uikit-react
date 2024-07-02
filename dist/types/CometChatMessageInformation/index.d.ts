/// <reference types="react" />
import { BackdropStyle, ListItemStyle } from "@cometchat/uikit-elements";
import { CometChatMessageTemplate } from "@cometchat/uikit-resources";
import { MessageInformationStyle } from "@cometchat/uikit-shared";
interface MessageInformationProps {
    title?: string;
    message: CometChat.BaseMessage;
    template?: CometChatMessageTemplate;
    closeIconURL?: string;
    bubbleView?: (messageObject: CometChat.BaseMessage) => void | JSX.Element;
    listItemView?: (messageObject: CometChat.BaseMessage, messageReceipt?: CometChat.MessageReceipt) => JSX.Element;
    subtitleView?: (messageObject: CometChat.BaseMessage, messageReceipt?: CometChat.MessageReceipt) => void | JSX.Element;
    receiptDatePattern?: (timestamp: number) => string;
    onClose?: () => void;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    messageInformationStyle?: MessageInformationStyle;
    readIcon?: string;
    deliveredIcon?: string;
    listItemStyle?: ListItemStyle;
    emptyStateText?: any;
    emptyStateView?: any;
    loadingIconURL?: string;
    loadingStateView?: any;
    errorStateText?: any;
    errorStateView?: any;
    backdropStyle?: BackdropStyle;
}
declare const CometChatMessageInformation: (props: MessageInformationProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatMessageInformation };
