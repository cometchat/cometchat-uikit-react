import { AIAssistBotConfiguration } from '@cometchat/uikit-shared';
interface IAIAssistBotProps {
    configuration?: AIAssistBotConfiguration;
    bot: CometChat.User | undefined;
    sender: CometChat.User | undefined;
    messageSendCallBack?: (message: string, bot: CometChat.User) => Promise<string>;
    closeCallback?: () => void;
}
declare const AIAssistBotChatView: (props: IAIAssistBotProps) => import("react/jsx-runtime").JSX.Element;
export default AIAssistBotChatView;
