import { AISmartRepliesConfiguration } from '@cometchat/uikit-shared';
import { CometChatTheme } from '@cometchat/uikit-resources';
interface IAISmartRepliesProps {
    title: string;
    getSmartRepliesCallback?: (theme?: CometChatTheme) => Promise<Object>;
    editReplyCallback?: (reply: string) => void;
    closeCallback?: () => void;
    backCallback?: () => void;
    configuration?: AISmartRepliesConfiguration;
}
declare const AISmartRepliesView: (props: IAISmartRepliesProps) => import("react/jsx-runtime").JSX.Element;
export default AISmartRepliesView;
