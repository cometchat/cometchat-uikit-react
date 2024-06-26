import { CometChatTheme, CometChatMessageTemplate, CometChatActionsIcon, CometChatActionsView, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { ReactionConfiguration } from "./ReactionConfiguration";
export declare class ReactionExtensionDecorator extends DataSourceDecorator {
    loggedInUser: CometChat.User | null;
    theme?: CometChatTheme;
    configuration?: ReactionConfiguration;
    newDataSource: DataSource;
    constructor(dataSource: DataSource, configuration?: ReactionConfiguration, theme?: CometChatTheme);
    getLoggedInUser(): Promise<void>;
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, _theme: CometChatTheme, group?: CometChat.Group): (CometChatActionsIcon | CometChatActionsView)[];
    emojiSelected(data: any, message: CometChat.BaseMessage, loggedInUser: CometChat.User): void;
    getReactionsStyle(alignment: MessageBubbleAlignment, theme: CometChatTheme, message: CometChat.BaseMessage): {
        height: string;
        width: string;
        border: string;
        borderRadius: string;
        background: string;
        addReactionIconTint: string | undefined;
        addReactionIconBackground: string | undefined;
        reactionBorderRadius: string;
        reactionBorder: string;
        reactionBackground: string;
        activeReactionBorder: string;
        activeReactionBackground: string | undefined;
        reactionEmojiFontSize: string;
        reactionCountTextFont: string;
        reactionCountTextColor: string | undefined;
        activeReactionCountTextFont: string;
        activeReactionCountTextColor: string | undefined;
    };
    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean;
    getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignment): import("react/jsx-runtime").JSX.Element | undefined;
    checkIfOptionExist(template: (CometChatActionsIcon | CometChatActionsView)[], id: string): boolean;
    getId(): string;
}
