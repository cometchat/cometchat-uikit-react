import { AIAssistBotConfiguration } from "@cometchat/uikit-shared";
import { CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
export declare const getBubbleAlignment: (message: CometChat.TextMessage, sender: CometChat.User) => MessageBubbleAlignment;
export declare const getContentView: (message: CometChat.TextMessage, theme: CometChatTheme, alignment: MessageBubbleAlignment, configuration: AIAssistBotConfiguration) => JSX.Element;
export declare const getBubbleFooterView: (item: CometChat.TextMessage, configuration: AIAssistBotConfiguration, theme: CometChatTheme) => JSX.Element;
