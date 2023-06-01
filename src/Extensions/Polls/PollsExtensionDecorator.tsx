
import { CometChat } from "@cometchat-pro/chat";
import { CometChatUIKitConstants, CometChatMessageTemplate, CometChatTheme, CometChatMessageComposerAction, localize, fontHelper, MessageBubbleAlignment, CometChatUIEvents } from "uikit-resources-lerna";
import { PollsConstants, PollsBubble, CreatePoll, CreatePollStyle } from "uikit-utils-lerna";
import { createComponent } from "@lit-labs/react";
import React from 'react';
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { PollsConfiguration } from "./PollsConfiguration";
import PollsIcon from './assets/polls.svg';

const CometChatPollsBubble = createComponent({
    tagName: 'polls-bubble',
    elementClass: PollsBubble,
    react: React
});

const CometChatCreatePollView = createComponent({
    tagName: 'create-poll',
    elementClass: CreatePoll,
    react: React,
    events: {
        ccCloseClicked: 'cc-close-clicked'
    }
});

export class PollsExtensionDecorator extends DataSourceDecorator {
    public theme!: CometChatTheme;
    private loggedInUser: CometChat.User | null = null;
    public configuration?: PollsConfiguration;
    public newDataSource!: DataSource;

    constructor(dataSource: DataSource, {configuration}: {configuration: PollsConfiguration}) {
        super(dataSource);
        this.getLoggedInUser();
        this.newDataSource = dataSource;
        this.configuration = configuration;
    }

    async getLoggedInUser() {
        this.loggedInUser =  await CometChat.getLoggedinUser()
    }

    override getId(): string {
        return "polls";
    }

    override getAllMessageTypes(): string[] {
        const types = super.getAllMessageTypes();
        if (!types.includes(PollsConstants.extension_poll)) {
            types.push(PollsConstants.extension_poll);
        }
        return types;
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
        if (!this.checkIfTemplateExist(templates, PollsConstants.extension_poll)) {
            templates.push(this.getPollsTemplate(this.theme))
        }
        return templates;
    }

    getPollsTemplate(_theme: CometChatTheme): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: PollsConstants.extension_poll,
            category: CometChatUIKitConstants.MessageCategory.custom,
            contentView: (message: CometChat.BaseMessage, _alignment: MessageBubbleAlignment) => {
                let pollsMessage: CometChat.CustomMessage = message as CometChat.CustomMessage;
                if (pollsMessage.getDeletedAt()) {
                    return super.getDeleteMessageBubble(pollsMessage, _theme);
                }
                return this.getPollsContentView(pollsMessage, _theme);
            },
            options: (loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group) => {
                return super.getCommonOptions(loggedInUser, messageObject, theme, group)
            }

        })
    }
    
    getPollsContentView(message: CometChat.CustomMessage, _theme: CometChatTheme){
        let configurationPollsBubbleStyle = this.configuration?.getPollsBubbleStyle();
        let pollBubbleStyle = {
            borderRadius: configurationPollsBubbleStyle?.borderRadius || "8px",
            background: configurationPollsBubbleStyle?.background || "transparent",
            votePercentTextFont: configurationPollsBubbleStyle?.votePercentTextFont || fontHelper(_theme.typography.subtitle2),
            votePercentTextColor: configurationPollsBubbleStyle?.votePercentTextColor || _theme.palette.getAccent600(),
            pollQuestionTextFont: configurationPollsBubbleStyle?.pollQuestionTextFont || fontHelper(_theme.typography.subtitle1),
            pollQuestionTextColor: configurationPollsBubbleStyle?.pollQuestionTextColor || _theme.palette.getAccent(),
            pollOptionTextFont: configurationPollsBubbleStyle?.pollOptionTextFont || fontHelper(_theme.typography.text2),
            pollOptionTextColor: configurationPollsBubbleStyle?.pollOptionTextColor || _theme.palette.getAccent(),
            pollOptionBackground: configurationPollsBubbleStyle?.pollOptionBackground || _theme.palette.getAccent900(),
            optionsIconTint: configurationPollsBubbleStyle?.optionsIconTint || _theme.palette.getAccent600(),
            totalVoteCountTextFont: configurationPollsBubbleStyle?.totalVoteCountTextFont || fontHelper(_theme.typography.subtitle2),
            totalVoteCountTextColor: configurationPollsBubbleStyle?.totalVoteCountTextColor || _theme.palette.getAccent600(),
            selectedPollOptionBackground: configurationPollsBubbleStyle?.selectedPollOptionBackground || _theme.palette.getAccent200(),
            userSelectedOptionBackground: configurationPollsBubbleStyle?.userSelectedOptionBackground || _theme.palette.getPrimary(),
            pollOptionBorder: configurationPollsBubbleStyle?.pollOptionBorder || `1px solid ${_theme.palette.getAccent100()}`,
            pollOptionBorderRadius: configurationPollsBubbleStyle?.pollOptionBorderRadius || "8px"
        };

        return (
            <CometChatPollsBubble 
                pollStyle = {pollBubbleStyle}
                pollQuestion = {this.getPollBubbleData(message, 'question')}
                pollId = {this.getPollBubbleData(message, 'id')}
                senderUid = {this.getPollBubbleData(message)}
                loggedInUser = {this.loggedInUser ?? undefined}
                metadata = {message?.getMetadata()}
            />
        );
    }

    getPollBubbleData(message: CometChat.CustomMessage, key?: string){
        let data:any =  message.getCustomData()
        if(key){
            if(key === 'options'){
                return Object.values(data[key])
            }else{
                return data[key];
            }
        }else{
            return message.getSender().getUid();
        }
    }


    override getAttachmentOptions(theme: CometChatTheme, id?: any) {
        this.theme = theme;
        if (!id?.parentMessageId) {
            let configurationOptionStyle = this.configuration?.getOptionStyle();
            const messageComposerActions: CometChatMessageComposerAction[] = super.getAttachmentOptions(theme, id);
            let newAction: CometChatMessageComposerAction = new CometChatMessageComposerAction({
                id: PollsConstants.extension_poll,
                title: localize("POLLS"),
                iconURL: this.configuration?.getOptionIconURL() ? this.configuration?.getOptionIconURL() : PollsIcon,
                iconTint: configurationOptionStyle?.iconTint || theme.palette.getAccent700(),
                titleColor: configurationOptionStyle?.titleColor || theme.palette.getAccent600(),
                titleFont: configurationOptionStyle?.titleFont || fontHelper(theme.typography.subtitle1),
                background: configurationOptionStyle?.background || theme.palette.getAccent100(),
                onClick: (...args) => {this.onPollsButtonClicked(theme, ...args)} 
            })
            messageComposerActions.push(newAction);
            return messageComposerActions;
        } else {
            return super.getAttachmentOptions(theme, id);
        }
    }

    onPollsButtonClicked(theme : CometChatTheme, ...args : any[]){
        const [data] = args;
        let user = data[0];
        let group = data[1];
        let configurationCreatePollStyle = this.configuration?.getCreatePollStyle();
        let createPollStyle = {
            placeholderTextFont: configurationCreatePollStyle?.placeholderTextFont || fontHelper(theme.typography.subtitle1),
            placeholderTextColor: configurationCreatePollStyle?.placeholderTextColor || theme.palette.getAccent600(),
            deleteIconTint: configurationCreatePollStyle?.deleteIconTint || theme.palette.getAccent600(),
            titleFont: configurationCreatePollStyle?.titleFont || fontHelper(theme.typography.title1),
            titleColor: configurationCreatePollStyle?.titleColor || theme.palette.getAccent(),
            closeIconTint: configurationCreatePollStyle?.closeIconTint || theme.palette.getPrimary(),
            questionInputBackground: configurationCreatePollStyle?.questionInputBackground || theme.palette.getAccent100(),
            optionInputBackground: configurationCreatePollStyle?.optionInputBackground || theme.palette.getAccent100(),
            answerHelpTextFont: configurationCreatePollStyle?.answerHelpTextFont || fontHelper(theme.typography.caption1),
            answerHelpTextColor: configurationCreatePollStyle?.answerHelpTextColor || theme.palette.getAccent400(),
            addAnswerIconTint: configurationCreatePollStyle?.addAnswerIconTint || theme.palette.getPrimary(),
            createPollButtonTextFont: configurationCreatePollStyle?.createPollButtonTextFont || fontHelper(theme.typography.text2),
            createPollButtonTextColor: configurationCreatePollStyle?.createPollButtonTextColor || theme.palette.getAccent("dark"),
            createPollButtonBackground: configurationCreatePollStyle?.createPollButtonBackground || theme.palette.getPrimary(),
            addAnswerTextFont: configurationCreatePollStyle?.addAnswerTextFont || fontHelper(theme.typography.text2),
            addAnswerTextColor: configurationCreatePollStyle?.addAnswerTextColor || theme.palette.getPrimary(),
            errorTextFont: configurationCreatePollStyle?.errorTextFont || fontHelper(theme.typography.subtitle1),
            errorTextColor: configurationCreatePollStyle?.errorTextColor || theme.palette.getError(),
            optionPlaceholderTextFont: configurationCreatePollStyle?.optionPlaceholderTextFont || fontHelper(theme.typography.subtitle1),
            optionPlaceholderTextColor: configurationCreatePollStyle?.optionPlaceholderTextColor || theme.palette.getAccent600(),
            questionInputTextFont: configurationCreatePollStyle?.questionInputTextFont || fontHelper(theme.typography.subtitle2),
            questionInputTextColor: configurationCreatePollStyle?.questionInputTextColor || theme.palette.getAccent600(),
            optionInputTextFont: configurationCreatePollStyle?.optionInputTextFont || fontHelper(theme.typography.subtitle2),
            optionInputTextColor: configurationCreatePollStyle?.optionInputTextColor || theme.palette.getAccent600(),
            width: configurationCreatePollStyle?.width || "360px",
            height: configurationCreatePollStyle?.height || "440px",
            border: configurationCreatePollStyle?.border || "",
            borderRadius: configurationCreatePollStyle?.borderRadius || "8px",
            background: configurationCreatePollStyle?.background || theme.palette.getAccent900(),
            position: 'absolute',
            zIndex: 1
        }
        CometChatUIEvents.ccShowModal.next({child: this.getPollView(user, group, createPollStyle)});
        
    }

    getPollView(user: CometChat.User, group: CometChat.Group, createPollStyle : CreatePollStyle){
        return(
            <cometchat-backdrop>
                <CometChatCreatePollView 
                    user={user} 
                    group={group}
                    ccCloseClicked={this.triggerCloseEvent}
                    createPollStyle={createPollStyle}
                    deleteIconURL={this.configuration?.getDeleteIconURL() || ''}
                    closeIconURL={this.configuration?.getCloseIconURL() || ''}
                    addAnswerIconURL={this.configuration?.getAddAnswerIconURL() || ''}
                />
            </cometchat-backdrop>
        )
    }

    triggerCloseEvent(){
        CometChatUIEvents.ccHideModal.next();
    }
    
    override getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
        const message: CometChat.BaseMessage | undefined = conversation.getLastMessage();
        if (message != null && message.getType() === PollsConstants.extension_poll && message.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
            return localize("CUSTOM_MESSAGE_POLL");
        } else {
            return super.getLastConversationMessage(conversation, loggedInUser);
        }
    }

}
