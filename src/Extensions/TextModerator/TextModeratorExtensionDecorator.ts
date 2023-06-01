import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatUIKitConstants, MessageBubbleAlignment } from "uikit-resources-lerna";
import { CometChatUIKitUtility } from "uikit-utils-lerna";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";

export class TextModeratorExtensionDecorator extends DataSourceDecorator {
    override getId(): string {
        return "textmoderator";
    }

    getModeratedtext(message: CometChat.TextMessage): string {
        let text: string = CometChatUIKitUtility.getExtensionData(message)
        if (text?.trim()?.length > 0) {
            return text;
        } else {
            return message.getText();
        }
    }

    override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
        const message: CometChat.TextMessage = conversation.getLastMessage();
        if (message && !message.getDeletedAt() && message.getType() === CometChatUIKitConstants.MessageTypes.text && message.getCategory() === CometChatUIKitConstants.MessageCategory.message) {
            return this.getModeratedtext(message);
        } else {
            return super.getLastConversationMessage(conversation, loggedInUser);
        }
    }

    override getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        let moderatedText = this.getModeratedtext(message);
        if(this.getModeratedtext(message) !== message.getText()){
            message.setText(moderatedText);
        }
        return super.getTextMessageContentView(message, alignment, theme);
    }
}
