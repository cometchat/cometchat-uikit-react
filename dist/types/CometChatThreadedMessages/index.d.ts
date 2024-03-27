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
}
declare const CometChatThreadedMessages: (props: IThreadedMessagesProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatThreadedMessages };
