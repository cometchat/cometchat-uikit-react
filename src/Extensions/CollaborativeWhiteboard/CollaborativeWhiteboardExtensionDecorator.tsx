import { CometChat } from "@cometchat-pro/chat";
import React from "react";
import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction, fontHelper, CometChatUIKitConstants, localize, MessageBubbleAlignment, DocumentIconAlignment } from "uikit-resources-lerna";
import { CollaborativeWhiteboardConstants, CometChatUIKitUtility } from "uikit-utils-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CometChatDocumentBubble } from "my-cstom-package-lit";
import { createComponent } from "@lit-labs/react";
import { CollaborativeWhiteboardConfiguration } from "./CollaborativeWhiteboardConfiguration";
import WhiteboardIcon from './assets/collaborativewhiteboard.svg';

const CometChatWhiteboardExtensionBubble = createComponent({
    tagName: 'cometchat-document-bubble',
    elementClass: CometChatDocumentBubble,
    react: React
});

export class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
    public configuration?: CollaborativeWhiteboardConfiguration;
    public newDataSource!: DataSource;
    public theme!: CometChatTheme;

    constructor(dataSource: DataSource, {configuration}: {configuration: CollaborativeWhiteboardConfiguration}) {
        super(dataSource);
        this.newDataSource = dataSource;
        this.configuration = configuration;
    }

    override getAllMessageTypes(): string[] {
        let types: string[] = super.getAllMessageTypes()
        if (!types.some(type => type === CollaborativeWhiteboardConstants.extension_whiteboard)) {
            types.push(CollaborativeWhiteboardConstants.extension_whiteboard)

        }
        return types;
    }

    override getId(): string {
        return "collaborativewhiteboard";
    }

    override getAllMessageCategories(): string[] {
        const categories = super.getAllMessageCategories();
        if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
            categories.push(CometChatUIKitConstants.MessageCategory.custom);
        }
        return categories;
    }

    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean {
        return template.some(obj => obj.type === type)
    }

    override getAllMessageTemplates(theme?: CometChatTheme | undefined): CometChatMessageTemplate[] {
        this.theme = (theme as CometChatTheme);
        const templates = super.getAllMessageTemplates(this.theme);
        if (!this.checkIfTemplateExist(templates, CollaborativeWhiteboardConstants.extension_whiteboard)) {
            templates.push(this.getWhiteBoardTemplate(this.theme))
        }
        return templates
    }

    getWhiteBoardTemplate(_theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CollaborativeWhiteboardConstants.extension_whiteboard,
            category: CometChatUIKitConstants.MessageCategory.custom,
            contentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignment) => {
                let whiteboardMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
                if (whiteboardMessage.getDeletedAt()) {
                    return super.getDeleteMessageBubble(whiteboardMessage, _theme);
                }
                return this.getWhiteboardContentView(whiteboardMessage, _theme);
            },
            options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group) => {
                return super.getCommonOptions(loggedInUser, messageObject, theme, group)
            }

        });
    }

    getWhiteboardContentView(whiteboardMessage: CometChat.CustomMessage, _theme: CometChatTheme) {
        let documentBubbleAlignment: DocumentIconAlignment = DocumentIconAlignment.right;
        let configurationWhiteboardBubbleStyle = this.configuration?.getWhiteboardBubbleStyle();
        let documentBubbleStyle = {
            titleFont: configurationWhiteboardBubbleStyle?.titleFont || fontHelper(this.theme.typography.text2),
            titleColor: configurationWhiteboardBubbleStyle?.titleColor || this.theme.palette.getAccent(),
            subtitleFont: configurationWhiteboardBubbleStyle?.subtitleFont || fontHelper(this.theme.typography.subtitle2),
            subtitleColor: configurationWhiteboardBubbleStyle?.subtitleColor || this.theme.palette.getAccent600(),
            iconTint: configurationWhiteboardBubbleStyle?.iconTint || this.theme.palette.getAccent700(),
            buttonTextFont: configurationWhiteboardBubbleStyle?.buttonTextFont || fontHelper(this.theme.typography.text2),
            buttonTextColor: configurationWhiteboardBubbleStyle?.buttonTextColor || this.theme.palette.getPrimary(),
            buttonBackground: configurationWhiteboardBubbleStyle?.buttonBackground || "transparent",
            separatorColor: configurationWhiteboardBubbleStyle?.separatorColor || this.theme.palette.getAccent200()
        }
        const whiteboardURL = this.getWhiteboardDocument(whiteboardMessage);
        const whiteboardTitle = localize("COLLABORATIVE_WHITEBOARD");
        const whiteboardButtonText = localize("OPEN_WHITEBOARD");
        const whiteboardSubitle = localize("DRAW_WHITEBOARD_TOGETHER");
        
        return(
            <CometChatWhiteboardExtensionBubble
                hideSeparator={false}
                iconAlignment={documentBubbleAlignment}
                iconURL={this.configuration?.getIconURL() ? this.configuration?.getIconURL() : WhiteboardIcon} 
                title={whiteboardTitle} 
                URL={whiteboardURL} 
                subtitle={whiteboardSubitle}
                buttonText={whiteboardButtonText}
                documentStyle={documentBubbleStyle}
                ccClicked={this.launchCollaborativeWhiteboardDocument}
            ></CometChatWhiteboardExtensionBubble>
        )
    }

    launchCollaborativeWhiteboardDocument(whiteboardURL: string) {
        window.open(whiteboardURL, "", "fullscreen=yes, scrollbars=auto");
    }

    getWhiteboardDocument(message: CometChat.CustomMessage) {
        try {
            if (message?.getData()) {
                const data: any = message.getData();
                if (data?.metadata) {
                    const metadata = data?.metadata;
                    if (CometChatUIKitUtility.checkHasOwnProperty(metadata, "@injected")) {
                        const injectedObject = metadata["@injected"];
                        if (injectedObject?.extensions) {
                            const extensionObject = injectedObject.extensions;
                            return extensionObject[CollaborativeWhiteboardConstants.whiteboard] ? extensionObject[CollaborativeWhiteboardConstants.whiteboard].board_url : extensionObject[CollaborativeWhiteboardConstants.whiteboard].document_url;
                        }
                    }
                }
            }
        } catch (error: any) {
            console.log("error in getting whiteboard details", error);
        }
    }

    override getAttachmentOptions(theme: CometChatTheme, id?: any) {
        if (!id?.parentMessageId) {
            let configurationOptionStyle = this.configuration?.getOptionStyle();
            let isUser = id?.user ? true : false;
            let receiverType: string = isUser ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
            let receiverId: string | undefined = isUser ? id.user : id.group;
            const messageComposerActions: CometChatMessageComposerAction[] = super.getAttachmentOptions(theme, id);
            let newAction: CometChatMessageComposerAction = new CometChatMessageComposerAction({
                id: CollaborativeWhiteboardConstants.whiteboard,
                title: localize("COLLABORATIVE_WHITEBOARD"),
                iconURL: this.configuration?.getOptionIconURL() ? this.configuration?.getOptionIconURL() : WhiteboardIcon,
                iconTint: configurationOptionStyle?.iconTint || theme.palette.getAccent700(),
                titleColor: configurationOptionStyle?.titleColor || theme.palette.getAccent600(),
                titleFont: configurationOptionStyle?.titleFont || fontHelper(theme.typography.subtitle1),
                background: configurationOptionStyle?.background || theme.palette.getAccent100(),
                onClick: () => {
                    CometChat.callExtension(CollaborativeWhiteboardConstants.whiteboard, CollaborativeWhiteboardConstants.post, CollaborativeWhiteboardConstants.v1_create, { receiver: receiverId, receiverType: receiverType}).then(
                        (res: any) => {

                        }, (error: any) => {
                            console.log("error in sending whiteboard", error);
                        }
                    )
                }

            })
            messageComposerActions.push(newAction);
            return messageComposerActions;
        } else {
            return super.getAttachmentOptions(theme, id);
        }
    }

    override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
        const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
        if (message != null && message.getType() == CollaborativeWhiteboardConstants.extension_whiteboard && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
            return localize("CUSTOM_MESSAGE_WHITEBOARD");
        } else {
            return super.getLastConversationMessage(conversation, loggedInUser);
        }
    }


}

