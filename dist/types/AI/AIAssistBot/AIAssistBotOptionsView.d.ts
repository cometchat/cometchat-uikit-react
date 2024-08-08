import { AIAssistBotConfiguration } from '@cometchat/uikit-shared';
import { CometChatMessageComposerAction } from '@cometchat/uikit-resources';
interface IAIAssistBotProps {
    title?: string;
    bots?: CometChatMessageComposerAction[];
    closeCallback?: () => void;
    backCallback?: () => void;
    configuration?: AIAssistBotConfiguration;
}
declare const AIAssistBotOptoinsView: (props: IAIAssistBotProps) => import("react/jsx-runtime").JSX.Element;
export default AIAssistBotOptoinsView;
