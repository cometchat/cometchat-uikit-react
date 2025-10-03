
import { DataSource } from "./DataSource";
import { ComposerId, MessagesDataSource } from "./MessagesDataSource";
import { CometChatUrlsFormatter } from "../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatMentionsFormatter } from "../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatTextFormatter } from "../formatters/CometChatFormatters/CometChatTextFormatter";
import { additionalParams } from "./ConversationUtils";
import { CometChatActionsIcon, CometChatActionsView, CometChatMessageComposerAction, CometChatMessageTemplate } from "../modals";
import { MessageBubbleAlignment } from "../Enums/Enums";
import { CalendarObject } from "./CalendarObject";
import { JSX } from 'react';

/**
 * This class is used in AI, calling and Extension modules.
 */
export abstract class DataSourceDecorator implements DataSource {
  dataSource: DataSource;
  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getTextMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getImageMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getVideoMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getAudioMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getFileMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }

  getStatusInfoView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignment,
    hideReceipts?: boolean,
    messageSentAtDateTimeFormat?: CalendarObject,
    showError?:boolean
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getStatusInfoView(
      message,
      alignment,
      hideReceipts,
      messageSentAtDateTimeFormat,
      showError
    );
  }
  getBottomView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getBottomView(
      message,
      alignment
    );
  }
  getReplyView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignment,
    onReplyPreviewClick?: (messageToReply: CometChat.BaseMessage) => void,
    textFormatters?: CometChatTextFormatter[]
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getReplyView(
      message,
      alignment,
      onReplyPreviewClick,
      textFormatters
    );
  }
  
  getFooterView(message: CometChat.BaseMessage) {
    return (this.dataSource ?? new MessagesDataSource()).getFooterView(message);
  }

  getMessagePreviewSubtitle(
    message: CometChat.BaseMessage,
    textFormatters?: CometChatTextFormatter[],
    _alignment?: MessageBubbleAlignment
  ): JSX.Element | null{
    return (this.dataSource ?? new MessagesDataSource()).getMessagePreviewSubtitle(
      message,
      textFormatters,
      _alignment
    );
  }

  getMessagePreviewTitle(
    message: CometChat.BaseMessage,
    _alignment?: MessageBubbleAlignment
  ): JSX.Element | null{
    return (this.dataSource ?? new MessagesDataSource()).getMessagePreviewTitle(message, _alignment);
  }

  getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getTextMessageContentView(
      message,
      alignment,
      additionalConfigurations
    );
  }
  getImageMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getImageMessageContentView(message, alignment);
  }
  getVideoMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getVideoMessageContentView(message, alignment);
  }
  getAudioMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getAudioMessageContentView(message, alignment);
  }
  getFileMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getFileMessageContentView(message, alignment);
  }

  getTextMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getTextMessageTemplate(
      additionalConfigurations
    );
  }
  getAgentAssistantMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getAgentAssistantMessageTemplate(
      additionalConfigurations
    );
  }
    getToolArgumentsMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getToolArgumentsMessageTemplate(
      additionalConfigurations
    );
  }
    getToolResultsMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getToolResultsMessageTemplate(
      additionalConfigurations
    );
  }
  getStreamMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getStreamMessageTemplate(
      additionalConfigurations
    );
  }
  getImageMessageTemplate(): CometChatMessageTemplate {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getImageMessageTemplate();
  }
  getVideoMessageTemplate(): CometChatMessageTemplate {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getVideoMessageTemplate();
  }
  getAudioMessageTemplate(): CometChatMessageTemplate {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getAudioMessageTemplate();
  }
  getFileMessageTemplate(): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getFileMessageTemplate(

    );
  }
  getGroupActionTemplate(additionalConfigurations?: Object | undefined): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getGroupActionTemplate(
      additionalConfigurations
    );
  }
  getAllMessageTemplates(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate[] {
    return (this.dataSource ?? new MessagesDataSource()).getAllMessageTemplates(
      additionalConfigurations
    );
  }
  getMessageTemplate(
    messageType: string,
    messageCategory: string,
  ): CometChatMessageTemplate | null {
    return (this.dataSource ?? new MessagesDataSource()).getMessageTemplate(
      messageType,
      messageCategory
    );
  }
  getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getMessageOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    return (this.dataSource ?? new MessagesDataSource()).getCommonOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );
  }
  getAttachmentOptions(
    id: ComposerId,
    additionalConfigurations?: any

  ): CometChatMessageComposerAction[] {
    return (this.dataSource ?? new MessagesDataSource()).getAttachmentOptions(
      id,
      additionalConfigurations
    );
  }
  getAllMessageTypes(): string[] {
    return (this.dataSource ?? new MessagesDataSource()).getAllMessageTypes();
  }
  getAllMessageCategories(additionalConfigurations?: Object | undefined): string[] {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getAllMessageCategories(additionalConfigurations);
  }
  getStickerButton(
    id: ComposerId,
    user?: CometChat.User,
    group?: CometChat.Group,
    messageToReply?: CometChat.BaseMessage | null,
    closeReplyPreview?: () => void,
  ): JSX.Element | undefined {
    return (this.dataSource ?? new MessagesDataSource()).getStickerButton(
      id,
      user,
      group,
      messageToReply,
      closeReplyPreview
    );
  }
  getId(): string {
    return (this.dataSource ?? new MessagesDataSource()).getId();
  }
  getDeleteMessageBubble(
    messageObject: CometChat.BaseMessage, text?: string, alignment?: MessageBubbleAlignment) {
    return (this.dataSource ?? new MessagesDataSource()).getDeleteMessageBubble(
      messageObject, text, alignment);
  }
  getGroupActionBubble(
    message: CometChat.BaseMessage
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getGroupActionBubble(
      message
    );
  }
  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getTextMessageBubble(
      messageText,
      message,
      alignment,
      additionalConfigurations
    );
  }
  getAgentAssistantMessageBubble(
    message: CometChat.AIAssistantMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getAgentAssistantMessageBubble(
      message,
      alignment,
      additionalConfigurations
    );
  }

  getToolArgumentsMessageBubble(
    message: CometChat.AIToolArgumentMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getToolArgumentsMessageBubble(
      message,
      alignment,
      additionalConfigurations
    );
  }

  getToolResultsMessageBubble(
    message: CometChat.AIToolResultMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getToolResultsMessageBubble(
      message,
      alignment,
      additionalConfigurations
    );
  }
  getStreamMessageBubble(
    message: CometChat.CustomMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getStreamMessageBubble(
      message,
      alignment,
      additionalConfigurations
    );
  }
  getVideoMessageBubble(
    videoUrl: string,
    message: CometChat.MediaMessage,
    thumbnailUrl?: string,
    onClick?: Function, alignment?: MessageBubbleAlignment) {
    return (this.dataSource ?? new MessagesDataSource()).getVideoMessageBubble(
      videoUrl,
      message,
      thumbnailUrl,
      onClick,
      alignment
    );
  }
  getImageMessageBubble(
    imageUrl: string,
    placeholderImage: string,
    message: CometChat.MediaMessage,
    onClick?: Function, alignment?: MessageBubbleAlignment
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getImageMessageBubble(
      imageUrl,
      placeholderImage,
      message,
      onClick,
      alignment
    );
  }
  getAudioMessageBubble(
    audioUrl: string,
    message: CometChat.MediaMessage,
    title?: string,
    alignment?: MessageBubbleAlignment
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getAudioMessageBubble(
      audioUrl,
      message,
      title,
      alignment
    );
  }
  getFileMessageBubble(
    fileUrl: string,
    message: CometChat.MediaMessage,
    title?: string
    , alignment?: MessageBubbleAlignment
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getFileMessageBubble(
      fileUrl,
      message,
      title,
      alignment
    );
  }
  getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser: CometChat.User,
    additionalConfigurations?: additionalParams
  ): string {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getLastConversationMessage(
      conversation,
      loggedInUser,
      additionalConfigurations
    );
  }

  getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group, additionalConfigurations?: any): Element[] | JSX.Element[] {
    return (this.dataSource ?? new MessagesDataSource()).getAuxiliaryHeaderMenu(
      user,
      group,
      additionalConfigurations
    );
  }
  getAllTextFormatters(formatterParams: additionalParams): CometChatTextFormatter[] {
    let formatters = [];
    const mentionsFormatter = formatterParams.disableMentions ? null : (this.dataSource ?? new MessagesDataSource()).getMentionsTextFormatter(
      formatterParams
    );
    const urlTextFormatter = (this.dataSource ?? new MessagesDataSource()).getUrlTextFormatter(
      formatterParams
    );
    if (mentionsFormatter) {
      formatters.push(mentionsFormatter);
    }
    if (urlTextFormatter) {
      formatters.push(urlTextFormatter);
    }
    return formatters;
  }

  getMentionsTextFormatter(params: Object = {}): CometChatMentionsFormatter {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getMentionsTextFormatter(params);
  }
  getUrlTextFormatter(params: Object = {}): CometChatUrlsFormatter {
    return (this.dataSource ?? new MessagesDataSource()).getUrlTextFormatter(
      params
    );
  }
  getMentionsFormattedText(
    message: CometChat.TextMessage,
    subtitle: string,
    additionalConfigurations: Object
  ): string {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getMentionsFormattedText(message, subtitle, additionalConfigurations);
  }

  getFormMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getFormMessageContentView(message, alignment);
  }
  getSchedulerMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getSchedulerMessageContentView(message, alignment);
  }
  getCardMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getCardMessageContentView(message, alignment);
  }
  getFormMessageTemplate(): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getFormMessageTemplate(

    );
  }
  getSchedulerMessageTemplate(): CometChatMessageTemplate {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getSchedulerMessageTemplate();
  }
  getCardMessageTemplate(): CometChatMessageTemplate {
    return (this.dataSource ?? new MessagesDataSource()).getCardMessageTemplate(

    );
  }
  getFormMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getFormMessageBubble(
      message,
      alignment
    );
  }
  getSchedulerMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ) {
    return (
      this.dataSource ?? new MessagesDataSource()
    ).getSchedulerMessageBubble(message, alignment);
  }
  getCardMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment,
  ) {
    return (this.dataSource ?? new MessagesDataSource()).getCardMessageBubble(
      message,
      alignment
    );
  }
}
