import { AIConversationSummaryConfiguration } from '@cometchat/uikit-shared';
import { CometChatTheme } from '@cometchat/uikit-resources';
interface IAIConversationSummaryProps {
    getConversationSummaryCallback?: (theme?: CometChatTheme) => Promise<string>;
    editReplyCallback?: (reply: string) => void;
    closeCallback?: () => void;
    configuration?: AIConversationSummaryConfiguration;
}
declare const AIConversationSummaryView: {
    (props: IAIConversationSummaryProps): import("react/jsx-runtime").JSX.Element;
    defaultProps: IAIConversationSummaryProps;
};
export default AIConversationSummaryView;
