import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatMessageTemplate, CometChatMessageComposerAction, fontHelper, CometChatUIKitConstants, localize, DocumentIconAlignment, MessageBubbleAlignment  } from "uikit-resources-lerna";
import { CollaborativeDocumentConstants, CometChatUIKitUtility } from "uikit-utils-lerna";
import { CometChatDocumentBubble } from "my-cstom-package-lit";
import { createComponent } from "@lit-labs/react";
import React from "react";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CollaborativeDocumentConfiguration } from "./CollaborativeDocumentConfiguration";
import DocumentIcon from './assets/collaborativedocument.svg';

const CometChatDocumentExtensionBubble = createComponent({
    tagName: 'cometchat-document-bubble',
    elementClass: CometChatDocumentBubble,
    react: React
});

export class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {
    public configuration?: CollaborativeDocumentConfiguration;
    public newDataSource!: DataSource;
    public theme!: CometChatTheme;

    constructor(dataSource: DataSource, {configuration}: {configuration: CollaborativeDocumentConfiguration}) {
        super(dataSource);
        this.newDataSource = dataSource;
        this.configuration = configuration!;
    }

    override getAllMessageTypes(): string[] {
        const types = super.getAllMessageTypes();
        if (!types.includes(CollaborativeDocumentConstants.extension_document)) {
            types.push(CollaborativeDocumentConstants.extension_document);
        }
        return types;
    }

    override getId(): string {
        return "collaborativedocument";
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

    override getAllMessageTemplates(_theme?: CometChatTheme | undefined): CometChatMessageTemplate[] {
        this.theme = (_theme as CometChatTheme);
        const templates = super.getAllMessageTemplates(this.theme);
        if (!this.checkIfTemplateExist(templates, CollaborativeDocumentConstants.extension_document)) {
            templates.push(this.getDocumentTemplate(this.theme))
        }
        return templates;
    }

    getDocumentTemplate(_theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CollaborativeDocumentConstants.extension_document,
            category: CometChatUIKitConstants.MessageCategory.custom,
            contentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignment) => {
                let documentMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
                if (documentMessage.getDeletedAt()) {
                    return super.getDeleteMessageBubble(documentMessage, _theme);
                }
                return this.getDocumentContentView(documentMessage, _theme);
            },
            options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group) => {
                return super.getCommonOptions(loggedInUser, messageObject, theme, group)
            }
        })
    }

    getDocumentContentView(documentMessage: CometChat.CustomMessage, _theme: CometChatTheme) {
        let documentBubbleAlignment: DocumentIconAlignment = DocumentIconAlignment.right;
        let configurationDocumentBubbleStyle = this.configuration?.getDocumentBubbleStyle();
        let documentBubbleStyle = {
            titleFont: configurationDocumentBubbleStyle?.titleFont || fontHelper(this.theme.typography.text2),
            titleColor: configurationDocumentBubbleStyle?.titleColor || this.theme.palette.getAccent(),
            subtitleFont: configurationDocumentBubbleStyle?.subtitleFont || fontHelper(this.theme.typography.subtitle2),
            subtitleColor: configurationDocumentBubbleStyle?.subtitleColor || this.theme.palette.getAccent600(),
            iconTint: configurationDocumentBubbleStyle?.iconTint || this.theme.palette.getAccent700(),
            buttonTextFont: configurationDocumentBubbleStyle?.buttonTextFont || fontHelper(this.theme.typography.text2),
            buttonTextColor: configurationDocumentBubbleStyle?.buttonTextColor || this.theme.palette.getPrimary(),
            buttonBackground: configurationDocumentBubbleStyle?.buttonBackground || "transparent",
            separatorColor: configurationDocumentBubbleStyle?.separatorColor || this.theme.palette.getAccent200()
        }
        const documentURL = this.getDocumentURL(documentMessage);
        const documentTitle = localize("COLLABORATIVE_DOCUMENT");
        const documentButtonText = localize("OPEN_DOCUMENT");
        const documentSubitle = localize("DRAW_DOCUMENT_TOGETHER");
        
        return(
            <CometChatDocumentExtensionBubble 
                iconURL={this.configuration?.getIconURL() ? this.configuration?.getIconURL() : DocumentIcon}
                title={documentTitle} 
                URL={documentURL} 
                subtitle={documentSubitle}
                buttonText={documentButtonText}
                documentStyle={documentBubbleStyle}
                hideSeparator={false}
                iconAlignment={documentBubbleAlignment}
                ccClicked={this.launchCollaborativeDocument}
            ></CometChatDocumentExtensionBubble>
        )
    }

    launchCollaborativeDocument(documentURL: string) {
        window.open(documentURL, "", "fullscreen=yes, scrollbars=auto");
    }

    getDocumentURL(message: CometChat.CustomMessage) {
        try {
            if (message?.getData()) {
                const data: any = message.getData();
                if (data?.metadata) {
                    const metadata = data?.metadata;
                    if (CometChatUIKitUtility.checkHasOwnProperty(metadata, "@injected")) {
                        const injectedObject = metadata["@injected"];
                        if (injectedObject?.extensions) {
                            const extensionObject = injectedObject.extensions;
                            return extensionObject[CollaborativeDocumentConstants.document] ? extensionObject[CollaborativeDocumentConstants.document].document_url : extensionObject[CollaborativeDocumentConstants.document].board_url;
                        }
                    }
                }
            }
        } catch (error: any) {
            console.log('error in fetching document url', error);
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
                id: CollaborativeDocumentConstants.document,
                title: localize("COLLABORATIVE_DOCUMENT"),
                iconURL: this.configuration?.getOptionIconURL() ? this.configuration?.getOptionIconURL() : DocumentIcon,
                iconTint: configurationOptionStyle?.iconTint || theme.palette.getAccent700(),
                titleColor: configurationOptionStyle?.titleColor || theme.palette.getAccent600(),
                titleFont: configurationOptionStyle?.titleFont || fontHelper(theme.typography.subtitle1),
                background: configurationOptionStyle?.background || theme.palette.getAccent100(),
                onClick: () => {
                    CometChat.callExtension(CollaborativeDocumentConstants.document, CollaborativeDocumentConstants.post, CollaborativeDocumentConstants.v1_create, {receiver: receiverId, receiverType: receiverType}).then(
                        (res: any) => {
                        }, (error: any) =>{
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
        if (message != null && message.getType() === CollaborativeDocumentConstants.extension_document && message.getCategory() === CometChatUIKitConstants.MessageCategory.custom) {
            return localize("CUSTOM_MESSAGE_DOCUMENT");
        } else {
            return super.getLastConversationMessage(conversation, loggedInUser);
        }
    }
}
