


import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatMentionsFormatter } from "../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatTextFormatter } from "../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatUrlsFormatter } from "../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { additionalParams } from "./ConversationUtils";
import { CometChatActionsIcon, CometChatActionsView, CometChatMessageComposerAction, CometChatMessageTemplate } from "../modals/";
import { MessageBubbleAlignment } from "../Enums/Enums";
import { ComposerId } from "./MessagesDataSource";
import { CalendarObject } from "./CalendarObject";
import { JSX } from 'react';
/**
 * Class for providing message options and views.
 * It is used in AI and calling module and utils related to messages.
 */
export abstract class DataSource {
  abstract getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getBottomView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignment
  ): Element | JSX.Element | null;
  abstract getReplyView(
    message: CometChat.BaseMessage,
    alignment?: MessageBubbleAlignment,
    onReplyPreviewClick?: (messageToReply: CometChat.BaseMessage) => void,
    textFormatters?: CometChatTextFormatter[]
  ): Element | JSX.Element | null;
  abstract getFooterView(
    message: CometChat.BaseMessage,
  ): Element | JSX.Element | null;
  abstract getStatusInfoView(
    message: CometChat.BaseMessage,
    alignment: MessageBubbleAlignment,
    hideReceipts?: boolean,
    messageSentAtDateTimeFormat?: CalendarObject,
    showError?:boolean
  ): Element | JSX.Element | null;
  abstract getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    otherParams: Object | undefined
  ): Element | JSX.Element;
  abstract getImageMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getVideoMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getAudioMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getFileMessageContentView(
    message: CometChat.MediaMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getMessagePreviewSubtitle(
    message: CometChat.BaseMessage,
    textFormatters?: CometChatTextFormatter[],
    _alignment?: MessageBubbleAlignment
  ): JSX.Element | null;
  abstract getMessagePreviewTitle(
    message: CometChat.BaseMessage,
    _alignment?: MessageBubbleAlignment
  ): JSX.Element | null;
  abstract getAgentAssistantMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
    abstract getToolArgumentsMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
    abstract getToolResultsMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
  abstract getStreamMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
  abstract getTextMessageTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
  abstract getImageMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getVideoMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getAudioMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getFileMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getGroupActionTemplate(
    additionalConfigurations?: Object | undefined
  ): CometChatMessageTemplate;
  abstract getAllMessageTemplates(
    additionalConfigurations?: Object | undefined
  ): Array<CometChatMessageTemplate>;
  abstract getMessageTemplate(
    messageType: string,
    messageCategory: string,
  ): CometChatMessageTemplate | null;
  abstract getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView>;
  abstract getAttachmentOptions(
    id: ComposerId,
    additionalConfigurations?: any
  ): CometChatMessageComposerAction[];
  abstract getAllMessageTypes(): Array<string>;
  abstract getAllMessageCategories(additionalConfigurations?: Object | undefined): Array<string>;
  abstract getStickerButton(
    id: ComposerId,
    user?: CometChat.User,
    group?: CometChat.Group,
    messageToReply?: CometChat.BaseMessage | null,
    closeReplyPreview?: () => void,
  ): JSX.Element | undefined;
  abstract getId(): string;
  abstract getDeleteMessageBubble(
    messageObject: CometChat.BaseMessage,
    text?: string,
    alignment?: MessageBubbleAlignment,
  ): Element | JSX.Element;
  abstract getGroupActionBubble(
    message: CometChat.BaseMessage,
  ): Element | JSX.Element;
  abstract getStreamMessageBubble(
    message: CometChat.CustomMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ): Element | JSX.Element;
  abstract getAgentAssistantMessageBubble(
    message: CometChat.AIAssistantMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ): Element | JSX.Element;
    abstract getToolArgumentsMessageBubble(
    message: CometChat.AIToolArgumentMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ): Element | JSX.Element;
    abstract getToolResultsMessageBubble(
    message: CometChat.AIToolResultMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ): Element | JSX.Element;
  abstract getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: Object | undefined
  ): Element | JSX.Element;
  abstract getVideoMessageBubble(
    videoUrl: string,
    message: CometChat.MediaMessage,
    thumbnailUrl?: string,
    onClick?: Function,
    alignment?: MessageBubbleAlignment,
  ): Element | JSX.Element;
  abstract getImageMessageBubble(
    imageUrl: string,
    placeholderImage: string,
    message: CometChat.MediaMessage,
    onClick?: Function,
    alignment?: MessageBubbleAlignment,
  ): Element | JSX.Element;
  abstract getAudioMessageBubble(
    audioUrl: string,
    message: CometChat.MediaMessage,
    title?: string,
    alignment?: MessageBubbleAlignment,
  ): Element | JSX.Element;
  abstract getFileMessageBubble(
    fileUrl: string,
    message: CometChat.MediaMessage,
    title?: string,
    alignment?: MessageBubbleAlignment,
  ): Element | JSX.Element;
  abstract getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser: CometChat.User,
    additionalConfigurations?: additionalParams
  ): string;

  abstract getAuxiliaryHeaderMenu(
    user?: CometChat.User,
    group?: CometChat.Group,
    additionalConfigurations?: any
  ): Element[] | JSX.Element[];
  abstract getAllTextFormatters(formatterParams: additionalParams): CometChatTextFormatter[];
  abstract getMentionsTextFormatter(
    params: Object
  ): CometChatMentionsFormatter;
  abstract getUrlTextFormatter(params: Object): CometChatUrlsFormatter;
  abstract getMentionsFormattedText(
    message: CometChat.TextMessage,
    subtitle: string,
    additionalConfigurations?: Object | undefined
  ): string;
  abstract getFormMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getSchedulerMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getCardMessageContentView(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment,

  ): Element | JSX.Element;
  abstract getFormMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getSchedulerMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getCardMessageTemplate(

  ): CometChatMessageTemplate;
  abstract getFormMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ): Element | JSX.Element;
  abstract getSchedulerMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment
  ): Element | JSX.Element;
  abstract getCardMessageBubble(
    message: CometChat.InteractiveMessage,
    alignment: MessageBubbleAlignment,
  ): Element | JSX.Element;
}
