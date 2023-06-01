import { CometChat } from "@cometchat-pro/chat";
import { BaseStyle, ImageBubbleStyle } from "my-cstom-package-lit";
import { CometChatTheme } from "uikit-resources-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import PlaceholderImage from './assets/placeholder.png';

export class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
    override getId(): string {
        return "thumbnailgeneration";
    }

    override getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle) {
        if(ChatConfigurator.names.includes("imagemoderation")){
            return super.getImageMessageBubble(imageUrl, placeholderImage, message, theme);
        }else{
            let imageUrl = message.getAttachments()[0].getUrl();
            let metadata : any = message.getMetadata();
            if(metadata && metadata.hasOwnProperty("@injected") && metadata["@injected"].hasOwnProperty("extensions") && metadata["@injected"]["extensions"].hasOwnProperty("thumbnail-generation") && metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"]){
                imageUrl = metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"];
            }
            return super.getImageMessageBubble(imageUrl, PlaceholderImage, message, theme);
        }
    }

    override getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle) {
        let metadata : any = message.getMetadata();
        let thumbnailImage = thumbnailUrl;
        if(metadata && metadata.hasOwnProperty("@injected") && metadata["@injected"].hasOwnProperty("extensions") && metadata["@injected"]["extensions"].hasOwnProperty("thumbnail-generation") && metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"]){
            thumbnailImage = metadata["@injected"]["extensions"]["thumbnail-generation"]["url_small"];
        }
        return super.getVideoMessageBubble(videoUrl, message, theme, thumbnailImage);
    }
}
