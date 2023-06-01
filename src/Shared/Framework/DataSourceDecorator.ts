import { MessageBubbleAlignment } from "uikit-utils-lerna";
import { CometChatActionsIcon, CometChatActionsView, CometChatDetailsTemplate, CometChatMessageTemplate, CometChatTheme } from "uikit-resources-lerna";
import { DataSource } from "./DataSource";
import { CometChat } from "@cometchat-pro/chat";
import { MessagesDataSource } from "../Utils/MessagesDataSource";
import { BaseStyle, FileBubbleStyle, ImageBubbleStyle, TextBubbleStyle } from "my-cstom-package-lit";

export abstract class DataSourceDecorator implements DataSource {
    dataSource: DataSource;
    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getTextMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getImageMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getVideoMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getAudioMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getFileMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getBottomView(message: CometChat.BaseMessage, alignment: MessageBubbleAlignment) {
        return (this.dataSource ?? new MessagesDataSource()).getBottomView(message, alignment);
    }
    getTextMessageContentView(message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        return (this.dataSource ?? new MessagesDataSource()).getTextMessageContentView(message, alignment, theme);
    }
    getImageMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        return (this.dataSource ?? new MessagesDataSource()).getImageMessageContentView(message, alignment, theme);
    }
    getVideoMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        return (this.dataSource ?? new MessagesDataSource()).getVideoMessageContentView(message, alignment, theme);
    }
    getAudioMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        return (this.dataSource ?? new MessagesDataSource()).getAudioMessageContentView(message, alignment, theme);
    }
    getFileMessageContentView(message: CometChat.MediaMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme) {
        return (this.dataSource ?? new MessagesDataSource()).getFileMessageContentView(message, alignment, theme);
    }
    getTextMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getTextMessageTemplate(theme);
    }
    getImageMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getImageMessageTemplate(theme);
    }
    getVideoMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getVideoMessageTemplate(theme);
    }
    getAudioMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getAudioMessageTemplate(theme);
    }
    getFileMessageTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getFileMessageTemplate(theme);
    }
    getGroupActionTemplate(theme: CometChatTheme): CometChatMessageTemplate {
        return (this.dataSource ?? new MessagesDataSource()).getGroupActionTemplate(theme);
    }
    getAllMessageTemplates(theme?: CometChatTheme | undefined): CometChatMessageTemplate[] {
        return (this.dataSource ?? new MessagesDataSource()).getAllMessageTemplates(theme);
    }
    getMessageTemplate(messageType: string, messageCategory: string, theme?: CometChatTheme | undefined): CometChatMessageTemplate | null {
        return (this.dataSource ?? new MessagesDataSource()).getMessageTemplate(messageType, messageCategory, theme);
    }
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getMessageOptions(loggedInUser, messageObject, theme, group);
    }
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatActionsIcon | CometChatActionsView> {
        return (this.dataSource ?? new MessagesDataSource()).getCommonOptions(loggedInUser, messageObject, theme, group);
    }
    getAttachmentOptions(theme: CometChatTheme, id?: Map<String, any> | undefined) {
        return (this.dataSource ?? new MessagesDataSource()).getAttachmentOptions(theme, id);
    }
    getAllMessageTypes(): string[] {
        return (this.dataSource ?? new MessagesDataSource()).getAllMessageTypes();
    }
    getAllMessageCategories(): string[] {
        return (this.dataSource ?? new MessagesDataSource()).getAllMessageCategories();
    }
    getAuxiliaryOptions(id: Map<String, any>, user?: CometChat.User, group?: CometChat.Group, theme?: CometChatTheme): any {
        return (this.dataSource ?? new MessagesDataSource()).getAuxiliaryOptions(id, user, group, theme);
    }
    getId(): string {
        return (this.dataSource ?? new MessagesDataSource()).getId();
    }
    getDeleteMessageBubble(messageObject: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getDeleteMessageBubble(messageObject, theme, style);
    }
    getGroupActionBubble(message: CometChat.BaseMessage, theme: CometChatTheme, style?: TextBubbleStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getGroupActionBubble(message, theme, style);
    }
    getTextMessageBubble(messageText: string, message: CometChat.TextMessage, alignment: MessageBubbleAlignment, theme: CometChatTheme, style?: TextBubbleStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getTextMessageBubble(messageText, message, alignment, theme, style);
    }
    getVideoMessageBubble(videoUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, thumbnailUrl?: string, onClick?: Function, style?: BaseStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getVideoMessageBubble(videoUrl, message, theme, thumbnailUrl, onClick, style);
    }
    getImageMessageBubble(imageUrl: string, placeholderImage: string, message: CometChat.MediaMessage, theme: CometChatTheme, onClick?: Function, style?: ImageBubbleStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getImageMessageBubble(imageUrl, placeholderImage, message, theme, onClick, style);
    }
    getAudioMessageBubble(audioUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: BaseStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getAudioMessageBubble(audioUrl, message, theme, title, style);
    }
    getFileMessageBubble(fileUrl: string, message: CometChat.MediaMessage, theme: CometChatTheme, title?: string, style?: FileBubbleStyle) {
        return (this.dataSource ?? new MessagesDataSource()).getFileMessageBubble(fileUrl, message, theme, title, style);
    }
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string{
        return (this.dataSource ?? new MessagesDataSource()).getLastConversationMessage(conversation, loggedInUser);
    }
    getDefaultDetailsTemplate(loggedInUser: CometChat.User, user: CometChat.User | null, group: CometChat.Group | null, theme: CometChatTheme): CometChatDetailsTemplate[]{
        return (this.dataSource ?? new MessagesDataSource()).getDefaultDetailsTemplate(loggedInUser, user, group, theme);
    }
    getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group): any{
        return (this.dataSource ?? new MessagesDataSource()).getAuxiliaryHeaderMenu(user, group);
    }
}