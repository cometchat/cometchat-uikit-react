import { CometChatMessageTemplate, CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { DataSource } from "../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../Shared/Framework/DataSourceDecorator";
export declare class CallingExtensionDecorator extends DataSourceDecorator {
    theme: CometChatTheme;
    loggedInUser: CometChat.User | null;
    constructor(dataSource: DataSource);
    addLoginListener(): void;
    getLoggedInUser(): Promise<void>;
    getAllMessageTypes(): string[];
    getId(): string;
    getAllMessageCategories(): string[];
    checkIfTemplateTypeExist(template: CometChatMessageTemplate[], type: string): boolean;
    checkIfTemplateCategoryExist(template: CometChatMessageTemplate[], category: string): boolean;
    getAllMessageTemplates(_theme?: CometChatTheme | undefined, additionalConfigurations?: any): CometChatMessageTemplate[];
    getDirectCallTemplate(_theme: CometChatTheme): CometChatMessageTemplate;
    getDefaultCallTemplate(_theme: CometChatTheme): CometChatMessageTemplate[];
    getCallBubbleStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme): {
        titleFont: string;
        titleColor: string | undefined;
        iconTint: string | undefined;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        buttonBackground: string | undefined;
        width: string;
        background: string | undefined;
        borderRadius: string;
    } | {
        titleFont: string;
        titleColor: string | undefined;
        iconTint: string | undefined;
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        buttonBackground: string | undefined;
        width: string;
        borderRadius: string;
        background?: undefined;
    };
    getSessionId(_message: CometChat.CustomMessage): any;
    getCallBubbleTitle(_message: CometChat.CustomMessage): any;
    getDirectCallMessageBubble(_message: CometChat.CustomMessage, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    startDirectCall(sessionId: string, theme: CometChatTheme): void;
    callStatusStyle(_message: CometChat.Call, theme: CometChatTheme): {
        buttonTextFont: string;
        buttonTextColor: string | undefined;
        borderRadius: string;
        border: string;
        buttonIconTint: string | undefined;
        background: string;
        iconBackground: string;
        padding: string;
        gap: string;
        height: string;
        justifyContent: string;
    } | {
        buttonTextFont?: undefined;
        buttonTextColor?: undefined;
        borderRadius?: undefined;
        border?: undefined;
        buttonIconTint?: undefined;
        background?: undefined;
        iconBackground?: undefined;
        padding?: undefined;
        gap?: undefined;
        height?: undefined;
        justifyContent?: undefined;
    };
    getCallActionMessage(_message: CometChat.Call): string;
    getDefaultAudioCallMessageBubble(_message: CometChat.Call, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    getDefaultVideoCallMessageBubble(_message: CometChat.Call, _alignment: MessageBubbleAlignment, _theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User, additionalConfigurations?: any): string;
    getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any[];
}
