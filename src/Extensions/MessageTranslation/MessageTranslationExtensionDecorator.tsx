import { CometChat } from "@cometchat-pro/chat";
import React from "react";
import { createComponent } from "@lit-labs/react";
import { CometChatTheme, CometChatUIKitConstants, fontHelper, localize, CometChatMessageEvents, CometChatActionsIcon, CometChatActionsView } from "uikit-resources-lerna";
import { MessageBubbleAlignment, MessageTranslationBubble, MessageTranslationStyle, MessageStatus } from "uikit-utils-lerna";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { MessageTranslationConfiguration } from "./MessageTranslationConfiguration";
import TranslateIcon from './assets/translation.svg';
import { CometChatTextBubble } from "my-cstom-package-lit";

const CometChatMessageTranslationBubble = createComponent({
    tagName: 'message-translation-bubble',
    elementClass: MessageTranslationBubble,
    react: React
});

const TextMessageBubble = createComponent({
    tagName: 'cometchat-text-bubble',
    elementClass: CometChatTextBubble,
    react: React
});

export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
    public configuration?: MessageTranslationConfiguration;
    public newDataSource!: DataSource;

    constructor(dataSource: DataSource, {configuration}: {configuration: MessageTranslationConfiguration}) {
        super(dataSource);
        this.newDataSource = dataSource;
        this.configuration = configuration;
    }

    override getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): (CometChatActionsIcon | CometChatActionsView)[] {
        let configurationOptionStyle = this.configuration?.getOptionStyle();
        let options: (CometChatActionsIcon | CometChatActionsView)[] = super.getTextMessageOptions(loggedInUser, messageObject, theme, group);
        if (!this.checkIfOptionExist(options, CometChatUIKitConstants.MessageOption.translateMessage)) {
            let newOption: CometChatActionsIcon = new CometChatActionsIcon({
                id: CometChatUIKitConstants.MessageOption.translateMessage,
                title: localize("TRANSLATE_MESSAGE"),
                iconURL: this.configuration?.getOptionIconURL() ? this.configuration?.getOptionIconURL() : TranslateIcon,
                onClick: function(){
                    CometChat.callExtension('message-translation', 'POST', 'v2/translate', {
                        "msgId": messageObject.getId(),
                        "text": (messageObject as CometChat.TextMessage).getText(),
                        "languages": navigator.languages
                    })
                    .then((message_translations : any) => {
                        if (message_translations && message_translations.hasOwnProperty("translations")) {
                            let translatedMessage = message_translations["translations"][0]["message_translated"];
                            if (translatedMessage && translatedMessage.trim()) {
                                let metadata : any = (messageObject as CometChat.TextMessage).getMetadata();
                                metadata["translated_message"] = translatedMessage;
                                (messageObject as CometChat.TextMessage).setMetadata(metadata);
                                CometChatMessageEvents.ccMessageEdited.next({ message: messageObject as CometChat.TextMessage, status: MessageStatus.success });
                            }
                        }
                    })
                    .catch((error: any) => {
                        console.log("error", error);
                    });
                },
                iconTint: configurationOptionStyle?.iconTint || theme.palette.getAccent600(),
                titleColor: configurationOptionStyle?.titleColor || theme.palette.getAccent600(),
                titleFont: configurationOptionStyle?.titleFont || fontHelper(theme.typography.subtitle1),
                backgroundColor: configurationOptionStyle?.background || "transparent"
            })
            options.push(newOption);
        }
        return options;
    }

    getTranslationStyle = (_alignment: MessageBubbleAlignment, _theme: CometChatTheme) => {
        let configurationMessageTranslationStyle = this.configuration?.getMessageTranslationStyle();
        const isLeftAligned = _alignment !== MessageBubbleAlignment.left;
        if (isLeftAligned) {
            return new MessageTranslationStyle({
                translatedTextFont: configurationMessageTranslationStyle?.translatedTextFont || fontHelper(_theme.typography.text3),
                translatedTextColor: configurationMessageTranslationStyle?.translatedTextColor || _theme.palette.getAccent("dark"),
                helpTextColor: configurationMessageTranslationStyle?.helpTextColor || _theme.palette.getAccent700("dark"),
                helpTextFont: configurationMessageTranslationStyle?.helpTextFont || fontHelper(_theme.typography.caption2),
                background: configurationMessageTranslationStyle?.background || "transparent"
            });
        } else {
            return new MessageTranslationStyle({
                translatedTextFont: configurationMessageTranslationStyle?.translatedTextFont || fontHelper(_theme.typography.text3),
                translatedTextColor: configurationMessageTranslationStyle?.translatedTextColor || _theme.palette.getAccent("light"),
                helpTextColor: configurationMessageTranslationStyle?.helpTextColor || _theme.palette.getAccent700(),
                helpTextFont: configurationMessageTranslationStyle?.helpTextFont || fontHelper(_theme.typography.caption2),
                background: configurationMessageTranslationStyle?.background || "transparent"
            });
        }
    }

    getTextMessageStyle(_alignment: MessageBubbleAlignment, _theme: CometChatTheme) {
        const isLeftAligned = _alignment !== MessageBubbleAlignment.left;

        if (isLeftAligned) {
            return {
                textFont: fontHelper(_theme.typography.text3),
                textColor: _theme.palette.getAccent900() || ""
            }
        } else {
            return {
                textFont: fontHelper(_theme.typography.text3),
                textColor: _theme.palette.getAccent() || ""
            };
        }
    }

    override getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        let metadata : any = message.getMetadata();
        if (metadata && metadata.hasOwnProperty("translated_message") && !message.getDeletedAt() && message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember) {
            const translatedText = metadata["translated_message"];
            return (
                <CometChatMessageTranslationBubble
                    translatedText={translatedText}
                    alignment={alignment}
                    messageTranslationStyle={this.getTranslationStyle(alignment, theme)}
                >
                    <TextMessageBubble 
                        textStyle={this.getTextMessageStyle(alignment, theme)} 
                        text={message.getText()}
                    />
                </CometChatMessageTranslationBubble>
            );

        } else {
            return super.getTextMessageContentView(message, alignment, theme);
        }
    }

    checkIfOptionExist(template: (CometChatActionsIcon | CometChatActionsView)[], id: string): boolean {
        return template.some(obj => obj.id === id)
    }

    override getId(): string {
        return "messagetranslation";
    }
}