import { CardMessage, CometChatLocalize, CustomInteractiveMessage, FormMessage, SchedulerMessage } from "@cometchat/uikit-resources";
import { CometChatSoundManager, UIKitSettings } from '@cometchat/uikit-shared';
import { AIExtensionDataSource } from "../Framework/AIExtensionDataSource";
import { ExtensionsDataSource } from "../Framework/ExtensionsDataSource";
declare class CometChatUIKit {
    static uiKitSettings: UIKitSettings | null;
    static SoundManager: typeof CometChatSoundManager;
    static Localize: typeof CometChatLocalize;
    static conversationUpdateSettings: CometChat.ConversationUpdateSettings;
    static init(uiKitSettings: UIKitSettings | null): Promise<Object> | undefined;
    static defaultExtensions: ExtensionsDataSource[];
    static defaultAIFeatures: AIExtensionDataSource[];
    static enableCalling(): void;
    private static initiateAfterLogin;
    static login(uid: string): Promise<CometChat.User>;
    static loginWithAuthToken(authToken: string): Promise<CometChat.User>;
    static getLoggedinUser(): Promise<CometChat.User | null>;
    static createUser(user: CometChat.User): Promise<CometChat.User>;
    static updateUser(user: CometChat.User): Promise<CometChat.User>;
    static logout(): Promise<Object>;
    static checkAuthSettings(): boolean;
    /**
     * Sends a form message and emits events based on the message status.
     * @param message - The form message to be sent.
     * @param disableLocalEvents - A boolean indicating whether to disable local events or not. Default value is false.
     */
    static sendFormMessage(message: FormMessage, disableLocalEvents?: boolean): void;
    static sendCardMessage(message: CardMessage, disableLocalEvents?: boolean): void;
    static sendCustomInteractiveMessage(message: CustomInteractiveMessage, disableLocalEvents?: boolean): void;
    static sendCustomMessage(message: CometChat.CustomMessage): Promise<unknown>;
    static sendTextMessage(message: CometChat.TextMessage): Promise<unknown>;
    static sendMediaMessage(message: CometChat.MediaMessage): Promise<unknown>;
    static sendSchedulerMessage(message: SchedulerMessage, disableLocalEvents?: boolean): Promise<unknown>;
    static getDataSource(): import("../..").DataSource;
}
export { CometChatUIKit };
