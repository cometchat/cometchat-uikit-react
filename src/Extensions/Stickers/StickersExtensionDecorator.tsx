
import { CometChatUIKitConstants, CometChatMessageTemplate, CometChatTheme, localize, MessageBubbleAlignment, Placement, fontHelper, CometChatMessageEvents, MessageStatus } from "uikit-resources-lerna";
import { CometChat } from '@cometchat-pro/chat';
import { StickersConstants, CometChatUIKitUtility, StickersKeyboard } from "uikit-utils-lerna";
import { PopoverStyle, CometChatImageBubble } from "my-cstom-package-lit";
import { createComponent } from "@lit-labs/react";
import React from "react";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { StickersConfiguration } from "./StickersConfiguration";
import StickerIcon from './assets/Stickers.svg';
import CloseIcon from './assets/close.svg';

const CometChatStickersKeyboard = createComponent({
    tagName: 'stickers-keyboard',
    elementClass: StickersKeyboard,
    react: React,
    events: {
        'ccStickerClicked': 'cc-sticker-clicked'
    }
});

const CometChatImageMessageBubble = createComponent({
    tagName: 'cometchat-image-bubble',
    elementClass: CometChatImageBubble,
    react: React
});

export class StickersExtensionDecorator extends DataSourceDecorator {
    public configuration?: StickersConfiguration;
    public newDataSource!: DataSource;
    public showStickerKeyboard: boolean = false; 
    public theme!: CometChatTheme;
    private id: any;
    private user: any;
    private group: any;

    constructor(dataSource: DataSource, {configuration}: {configuration: StickersConfiguration}) {
        super(dataSource)
        this.newDataSource = dataSource;
        this.configuration = configuration;
    }

    getDataSource() {
        return this.newDataSource;
    }

    override getAllMessageTemplates(theme?: CometChatTheme | undefined): CometChatMessageTemplate[] {
        this.theme = (theme as CometChatTheme);
        let template: CometChatMessageTemplate[] = super.getAllMessageTemplates(this.theme);
        if (!this.checkIfTemplateExist(template, StickersConstants.sticker)) {
            template.push(this.getStickerTemplate(this.theme));
            return template;
        }
        return template;
    }

    override getAuxiliaryOptions(id: Map<String, any>, user?: CometChat.User, group?: CometChat.Group, theme?: CometChatTheme) {
        this.id = id;
        this.user = user;
        this.group = group;
        let auxiliaryOptions = super.getAuxiliaryOptions(id, user, group, theme);
        auxiliaryOptions.push(this.getStickerAuxiliaryButton(id, user, group));
        return auxiliaryOptions;
    }
    
    getStickerAuxiliaryButton(id: Map<String, any>, user?: CometChat.User, group?: CometChat.Group){
        let configurationStickersStyle = this.configuration?.getStickersStyle();

        let emojiButtonStyle: any = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "grey",
            background: "transparent"
        }

        let style = new PopoverStyle({
            width: "272px",
            height: "400px",
            background: this.theme.palette.getBackground(),
            borderRadius: "12px",
            boxShadow: "0px 0px 0px 1px rgba(20, 20, 20, 0.04), 0px 16px 32px 0px rgba(20, 20, 20, 0.2)"
        });

        let stickerKeyboardStyle = {
            width: configurationStickersStyle?.width || "300px",
            height: configurationStickersStyle?.height || "400px",
            border: configurationStickersStyle?.border || "none",
            emptyStateTextFont: configurationStickersStyle?.emptyStateTextFont || fontHelper(this.theme.typography.title1),
            emptyStateTextColor: configurationStickersStyle?.emptyStateTextColor || this.theme.palette.getAccent600(),
            errorStateTextFont: configurationStickersStyle?.errorStateTextFont || fontHelper(this.theme.typography.title1),
            errorStateTextColor: configurationStickersStyle?.errorStateTextColor || this.theme.palette.getAccent600(),
            loadingIconTint: configurationStickersStyle?.loadingIconTint || this.theme.palette.getAccent600(),
            background: configurationStickersStyle?.background || this.theme.palette.getBackground(),
            borderRadius: configurationStickersStyle?.borderRadius || "12px"
        };

        let openIconURL = this.configuration?.getStickerIconURL() || StickerIcon;
        let closeIconURL = this.configuration?.getCloseIconURL() || CloseIcon;

        return (
            <cometchat-popover placement={Placement.top} popoverStyle={JSON.stringify(style)} key='stickers-extension-popover'>
                <div slot = "children"> 
                    <cometchat-button iconURL={!this.showStickerKeyboard ? openIconURL : closeIconURL} buttonStyle={JSON.stringify(emojiButtonStyle)}></cometchat-button>
                </div>
                <div slot = "content">
                    <CometChatStickersKeyboard 
                        stickerStyle={stickerKeyboardStyle} 
                        ccStickerClicked={(e)=>this.sendSticker(e)}
                    />
                </div>
            </cometchat-popover>
        )
    }

    sendSticker(event: any){
        try {
            let details = event?.detail;
            let sticker = {
                name: details?.stickerName,
                URL: details?.stickerURL
            }
            const receiverId: string = this.user?.getUid() || this.group?.getGuid();
            const receiverType: string = this.user ? CometChatUIKitConstants.MessageReceiverType.user : CometChatUIKitConstants.MessageReceiverType.group;
            const {parentMessageId} = this.id;

            const customData = {
                sticker_url: sticker.URL,
                sticker_name: sticker.name,
            };

            const customType = StickersConstants.sticker;

            const customMessage: CometChat.CustomMessage = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);

            if (parentMessageId) {
                customMessage.setParentMessageId(parentMessageId);
            }

            customMessage.setMetadata({ incrementUnreadCount: true });

            (customMessage as any).setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            
            customMessage.setMuid(CometChatUIKitUtility.ID());
            
            CometChatMessageEvents.ccMessageSent.next({message: customMessage, status: MessageStatus.inprogress})

            CometChat.sendCustomMessage(customMessage).then(
                (message) => {
                    CometChatMessageEvents.ccMessageSent.next({message: message, status: MessageStatus.success})
                }, (error) => {
                    customMessage.setMetadata({error: true})
                    CometChatMessageEvents.ccMessageSent.next({message: customMessage, status: MessageStatus.error});
                }
            )
        } catch (error: any) {
            console.log("error in sending sticker", error);
        }
    }

    getSticker(message: CometChat.CustomMessage) {
        let stickerData : any;
        if (CometChatUIKitUtility.checkHasOwnProperty(message, StickersConstants.data) && CometChatUIKitUtility.checkHasOwnProperty((message as CometChat.CustomMessage).getData(), StickersConstants.custom_data)) {
            stickerData = message.getCustomData();
            if (CometChatUIKitUtility.checkHasOwnProperty(stickerData, StickersConstants.sticker_url)) {
                return stickerData?.sticker_url;
            } else {
                return ""
            }
        } else {
            return ""
        }
    }

    getStickerMessageContentView(stickerMessage: CometChat.CustomMessage, _theme: CometChatTheme) {
        const imageBubbleStyle: any = {
            height: "128px",
            width: "128px",
            border: "none",
            borderRadius: "0",
            background: "transparent"
        };
        return(
            <CometChatImageMessageBubble 
                src={this.getSticker(stickerMessage)}
                imageStyle={imageBubbleStyle}
            />
        )
    }

    getStickerTemplate(_theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: StickersConstants.sticker,
            category: CometChatUIKitConstants.MessageCategory.custom,
            contentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignment) => {
                let stickerMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
                if (stickerMessage.getDeletedAt()) {
                    return super.getDeleteMessageBubble(stickerMessage, _theme);
                }
                return this.getStickerMessageContentView(stickerMessage, _theme);
            },
            options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group) => {
                return super.getCommonOptions(loggedInUser, messageObject, theme, group)
            }
        })
    }

    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean {
        return template.some(obj => obj.type === type)
    }

    override getAllMessageCategories(): string[] {
        let categories: string[] = super.getAllMessageCategories()
        if (!categories.some(category => category === CometChatUIKitConstants.MessageCategory.custom)) {
            categories.push(CometChatUIKitConstants.MessageCategory.custom)
        }
        return categories;
    }

    override getAllMessageTypes(): string[] {
        let types: string[] = super.getAllMessageTypes()
        if (!types.some(type => type === StickersConstants.sticker)) {
            types.push(StickersConstants.sticker)

        }
        return types;
    }

    override getId(): string {
        return "stickers";
    }

    override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
        const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
        if (message != null && message.getType() === StickersConstants.sticker && message.getCategory() === CometChatUIKitConstants.MessageCategory.custom) {
            return localize("CUSTOM_MESSAGE_STICKER");
        } else {
            return super.getLastConversationMessage(conversation, loggedInUser);
        }
    }
}
