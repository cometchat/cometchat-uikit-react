import { CometChat } from "@cometchat-pro/chat";
import { CometChatTheme, CometChatUIKitConstants, fontHelper, CometChatMessageTemplate, CometChatActionsIcon, CometChatActionsView, CometChatMessageEvents, MessageStatus, localize } from "uikit-resources-lerna";
import { MessageBubbleAlignment, ReactionsView, CometChatUIKitUtility, ReactionsConstants } from "uikit-utils-lerna";
import { createComponent } from "@lit-labs/react";
import React from "react";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { ReactionConfiguration } from "./ReactionConfiguration";
import { CometChatEmojiKeyboard } from "my-cstom-package-lit";
import ReactionIcon from './assets/addreaction.svg';

const CometChatReactionBubble = createComponent({
    tagName: 'reactions-view',
    elementClass: ReactionsView,
    react: React
});

const CometChatEmojiKeyboardView = createComponent({
    tagName: 'cometchat-emoji-keyboard',
    elementClass: CometChatEmojiKeyboard,
    react: React,
    events: {
        ccEmojiClicked: 'cc-emoji-clicked'
    }
});

export class ReactionExtensionDecorator extends DataSourceDecorator {
    public loggedInUser: CometChat.User | null = null;
    public theme?: CometChatTheme;
    public configuration?: ReactionConfiguration;
    public newDataSource!: DataSource;

    constructor(dataSource: DataSource, {configuration, theme}: {configuration: ReactionConfiguration, theme: CometChatTheme}) {
        super(dataSource);
        this.newDataSource = dataSource;
        this.configuration = configuration;
        this.theme = theme;
        this.getLoggedInUser();
    }

    async getLoggedInUser() {
        this.loggedInUser = await CometChat.getLoggedinUser();
    }

    override getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, _theme: CometChatTheme, group?: CometChat.Group): (CometChatActionsIcon | CometChatActionsView)[] {
        let configurationOptionStyle = this.configuration?.getOptionStyle();
        this.loggedInUser = loggedInUser;
        let options: (CometChatActionsIcon | CometChatActionsView)[] = super.getCommonOptions(loggedInUser, messageObject, _theme, group);
        if (!this.checkIfOptionExist(options, CometChatUIKitConstants.MessageOption.reactToMessage)) {
            const keyboardStyle = {
                width: "320px",
                height: "300px",
                border: "1px solid #e0e0e0",
                borderRadius: "8px"
            }
            let newOption: CometChatActionsView = new CometChatActionsView({
                id: CometChatUIKitConstants.MessageOption.reactToMessage,
                title: localize("REACT_TO_MESSAGE"),
                iconURL: this.configuration?.getOptionIconURL() ? this.configuration?.getOptionIconURL() :  ReactionIcon,
                customView: (closePopover : (args : Event) => void) => { return <CometChatEmojiKeyboardView emojiKeyboardStyle={keyboardStyle} ccEmojiClicked={(args) => { closePopover(args); this.emojiSelected(args, messageObject, loggedInUser) }} /> },
                iconTint: configurationOptionStyle?.iconTint || _theme.palette.getAccent600(),
                titleFont: configurationOptionStyle?.titleFont || fontHelper(_theme.typography.subtitle1),
                titleColor: configurationOptionStyle?.titleColor || _theme.palette.getAccent600(),
                backgroundColor: configurationOptionStyle?.background || "transparent"
            })
            options.push(newOption);
        }
        return options;
    }

    emojiSelected(data: any, message: CometChat.BaseMessage, loggedInUser: CometChat.User){
        try{
            let emoji = data?.detail?.id;
            let removeEmoji: boolean = false;
            let reactionObject: any = {};
            let newMessageObject!: CometChat.TextMessage | null;
            const userObject: any = {};
            if (loggedInUser?.getAvatar()) {
                userObject["avatar"] = loggedInUser?.getAvatar();
            }
            if (loggedInUser?.getName()) {
                userObject["name"] = loggedInUser?.getName();
            }
            let uid: any = loggedInUser?.getUid();
            const emojiObject = {
                [emoji]: {
                    [uid]: userObject,
                },
            };
            const reactionExtensionsData = CometChatUIKitUtility.checkMessageForExtensionsData((message), "reactions");
            if (reactionExtensionsData) {
                if (reactionExtensionsData['emoji']) {
                    if (reactionExtensionsData['emoji'][uid]) {
                        delete reactionExtensionsData['emoji'];
                        removeEmoji = true;
                    } else {
                        let data: any = (message["metadata"] as any)["@injected"]["extensions"]["reactions"];
                        data[emoji][uid] = userObject
                        reactionObject = {
                            ...data,
                        };
                    }
                } else {
                    const tmpMessage = message as any;
                    if (!tmpMessage.hasOwnProperty("metadata")) {
                        tmpMessage["metadata"] = {};
                    }
                    if (!tmpMessage["metadata"].hasOwnProperty("@injected")) {
                        tmpMessage["metadata"]["@injected"] = {};
                    }
                    if (!tmpMessage["metadata"]["@injected"].hasOwnProperty("extensions")) {
                        tmpMessage["metadata"]["@injected"]["extensions"] = {};
                    }
                    if (!tmpMessage["metadata"]["@injected"]["extensions"].hasOwnProperty("reactions")) {
                        tmpMessage["metadata"]["@injected"]["extensions"]["reactions"] = {};
                    }
                    let data: any = tmpMessage["metadata"]["@injected"]["extensions"]["reactions"];
                    reactionObject = { ...data, ...emojiObject };
                }
            } else {
                const tmpMessage = message as any;
                if (!tmpMessage.hasOwnProperty("metadata")) {
                    tmpMessage["metadata"] = {};
                }
                if (!tmpMessage["metadata"].hasOwnProperty("@injected")) {
                    tmpMessage["metadata"]["@injected"] = {};
                }
                if (!tmpMessage["metadata"]["@injected"].hasOwnProperty("extensions")) {
                    tmpMessage["metadata"]["@injected"]["extensions"] = {};
                }
                if (!tmpMessage["metadata"]["@injected"]["extensions"].hasOwnProperty("reactions")) {
                    tmpMessage["metadata"]["@injected"]["extensions"]["reactions"] = {};
                }
                reactionObject = {
                    ...emojiObject,
                };
            }
            var metadataObject: any;
            if (removeEmoji) {
                metadataObject = {
                    ...message["metadata"],
                };
            } else {
                const tmpMessage = message as any;
                metadataObject = {
                    ...message["metadata"],
                    "@injected": {
                        ...tmpMessage["metadata"]["@injected"],
                        extensions: {
                            ...tmpMessage["metadata"]["@injected"]["extensions"],
                            reactions: {
                                ...reactionObject,
                            },
                        },
                    },
                };
            }
            newMessageObject = (message as CometChat.TextMessage);
            newMessageObject.setMetadata(metadataObject);
            CometChatMessageEvents.ccMessageEdited.next({message, status: MessageStatus.success});
            CometChat.callExtension(ReactionsConstants.reactions, ReactionsConstants.post, ReactionsConstants.v1, {msgId: message.getId(), emoji: emoji}).then(
                (response: any) => {
                    console.log("reaction added successfully", response);
                }, (error: CometChat.CometChatException) => {
                    console.log("error in adding reaction", error)
                }
            );
        }catch(error: any){
            console.log("error in adding reaction", error)
        }
    }

    getReactionsStyle(alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        let configurationReactionStyle = this.configuration?.getReactionsStyle();
        if (alignment === MessageBubbleAlignment.left) {
            return {
                height: configurationReactionStyle?.height || "100%",
                width: configurationReactionStyle?.width || "100%",
                border: configurationReactionStyle?.border || "none",
                borderRadius: configurationReactionStyle?.borderRadius || "0",
                background: configurationReactionStyle?.background || "transparent",
                textFont: configurationReactionStyle?.textFont || fontHelper(theme.typography.subtitle1),
                textColor: configurationReactionStyle?.textColor || theme.palette.getAccent600(),
                activeTextColor: configurationReactionStyle?.activeTextColor || theme.palette.getAccent("dark"),
                activeTextFont: configurationReactionStyle?.activeTextFont || fontHelper(theme.typography.subtitle1),
                addReactionIconTint: configurationReactionStyle?.addReactionIconTint || theme.palette.getAccent600(),
                activeReactionBackground: configurationReactionStyle?.activeReactionBackground || theme.palette.getPrimary(),
                reactionBackground: configurationReactionStyle?.reactionBackground || "transparent",
                reactionBorder: configurationReactionStyle?.reactionBorder || `1px solid ${theme.palette.getAccent100()}`,
                reactionBorderRadius: configurationReactionStyle?.reactionBorderRadius || "12px",
                addReactionIconBackground: configurationReactionStyle?.addReactionIconBackground || theme.palette.getAccent100()
            }
        } else {
            return {
                height: configurationReactionStyle?.height || "100%",
                width: configurationReactionStyle?.width || "100%",
                border: configurationReactionStyle?.border || "none",
                borderRadius: configurationReactionStyle?.borderRadius || "0",
                background: configurationReactionStyle?.background || "transparent",
                textFont: configurationReactionStyle?.textFont || fontHelper(theme.typography.caption1),
                textColor: configurationReactionStyle?.textColor || theme.palette.getAccent("dark"),
                activeTextColor: configurationReactionStyle?.activeTextColor || theme.palette.getPrimary(),
                activeTextFont: configurationReactionStyle?.activeTextFont || fontHelper(theme.typography.caption1),
                addReactionIconTint: configurationReactionStyle?.addReactionIconTint || theme.palette.getAccent("dark"),
                activeReactionBackground: configurationReactionStyle?.activeReactionBackground || theme.palette.getAccent("dark"),
                reactionBackground: configurationReactionStyle?.reactionBackground || "transparent",
                reactionBorder: configurationReactionStyle?.reactionBorder || `1px solid ${theme.palette.getAccent100()}`,
                reactionBorderRadius: configurationReactionStyle?.reactionBorderRadius || "12px",
                addReactionIconBackground: configurationReactionStyle?.addReactionIconBackground || theme.palette.getAccent100("light")
            }
        }
    }

    checkIfTemplateExist(template: CometChatMessageTemplate[], type: string): boolean {
        return template.some(obj => obj.type === type)
    }

    override getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) {
        try{
            if(message instanceof CometChat.TextMessage || message instanceof CometChat.MediaMessage || message instanceof CometChat.CustomMessage){
                let metadata : any = message.getMetadata();
                if (metadata && metadata.hasOwnProperty("@injected") && metadata["@injected"].hasOwnProperty("extensions")  && metadata["@injected"]["extensions"].hasOwnProperty("reactions") && !message.getDeletedAt() && message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember) {
                    const style = this.getReactionsStyle(alignment, (this.theme as CometChatTheme));
                    return (
                        <CometChatReactionBubble
                            messageObject={message} 
                            alignment={alignment}
                            loggedInUser={this.loggedInUser ?? undefined}
                            reactionsStyle={style}
                            addReactionIconURL={this.configuration?.getAddReactionIconURL() ? this.configuration?.getAddReactionIconURL() : ReactionIcon}
                        />
                    );
                }else{
                    super.getBottomView(message, alignment);
                }
            }else{
                super.getBottomView(message, alignment);
            }
        }catch(e){
            super.getBottomView(message, alignment);
        }
    }

    checkIfOptionExist(template: (CometChatActionsIcon | CometChatActionsView)[], id: string): boolean {
        return template.some(obj => obj.id === id)
    }

    override getId(): string {
        return "reactions";
    }

}
