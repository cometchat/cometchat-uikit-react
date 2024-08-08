import { AIConversationStarterConfiguration } from '@cometchat/uikit-shared';
import { CometChatTheme } from '@cometchat/uikit-resources';
interface IAIConversationStarterProps {
    getConversationStarterCallback?: (theme?: CometChatTheme) => Promise<string[]>;
    editReplyCallback?: (reply: string) => void;
    configuration?: AIConversationStarterConfiguration;
}
declare const AIConversationStarterView: (props: IAIConversationStarterProps) => import("react/jsx-runtime").JSX.Element;
export default AIConversationStarterView;
