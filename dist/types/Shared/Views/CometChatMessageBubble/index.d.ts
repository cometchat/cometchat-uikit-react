import "@cometchat/uikit-elements";
import { CometChatActionsIcon, CometChatActionsView, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { BaseStyle } from '@cometchat/uikit-shared';
interface IMessageBubbleProps {
    id: any;
    setRef?: (ref: any) => void;
    leadingView: any;
    headerView: any;
    replyView: any;
    contentView: any;
    bottomView: any;
    threadView: any;
    footerView: any;
    statusInfoView?: any;
    options: (CometChatActionsIcon | CometChatActionsView)[];
    alignment: MessageBubbleAlignment;
    messageBubbleStyle: BaseStyle;
    moreIconURL?: string;
    topMenuSize?: number;
}
declare const CometChatMessageBubble: (props: IMessageBubbleProps) => import("react/jsx-runtime").JSX.Element;
export { CometChatMessageBubble };
