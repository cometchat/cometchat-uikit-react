/// <reference types="react" />
import "@cometchat/uikit-elements";
interface IThreadedMessagesProps {
    parentMessage: CometChat.BaseMessage;
    title?: string;
    closeIconURL?: string;
    bubbleView: any;
    messageActionView?: any;
    onClose?: any;
    onError?: ((error: CometChat.CometChatException) => void) | null;
    threadedMessagesStyle?: any;
    messageListConfiguration?: any;
    messageComposerConfiguration?: any;
    hideMessageComposer?: boolean;
    messageComposerView?: (user?: CometChat.User, group?: CometChat.Group, parentMessage?: CometChat.BaseMessage) => JSX.Element;
    messageListView?: (user?: CometChat.User, group?: CometChat.Group, parentMessage?: CometChat.BaseMessage) => JSX.Element;
}
declare const CometChatThreadedMessages: (props: IThreadedMessagesProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatThreadedMessages };
