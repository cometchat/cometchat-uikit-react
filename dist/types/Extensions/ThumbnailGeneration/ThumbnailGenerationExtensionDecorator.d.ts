import { BaseStyle, ImageBubbleStyle } from "@cometchat/uikit-elements";
import { CometChatTheme } from "@cometchat/uikit-resources";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
    getId(): string;
    getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle): any;
    getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle): any;
}
