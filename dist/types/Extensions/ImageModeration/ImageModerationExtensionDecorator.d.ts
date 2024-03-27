import { CometChatTheme, MessageBubbleAlignment } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { ImageModerationConfiguration } from "./ImageModerationConfiguration";
export declare class ImageModerationExtensionDecorator extends DataSourceDecorator {
    configuration?: ImageModerationConfiguration;
    newDataSource: DataSource;
    private theme;
    constructor(dataSource: DataSource, configuration?: ImageModerationConfiguration);
    getId(): string;
    getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme): import("react/jsx-runtime").JSX.Element;
    showDialog(_event: any): void;
    getConfirmationModal(_event: any): import("react/jsx-runtime").JSX.Element;
    onConfirmClicked(_event: any): void;
    onCancelClicked(): void;
    getImageModerationStyle(_theme: CometChatTheme): {
        filterColor: string | undefined;
        height: string;
        width: string;
        border: string;
        warningTextColor: string | undefined;
        warningTextFont: string;
    };
}
