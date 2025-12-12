import { ChatConfigurator } from "./ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { DataSource } from "./DataSource";
import React, { JSX } from "react";
import { CometChatUIKitLoginListener } from "../CometChatUIKit/CometChatUIKitLoginListener";
import { ConversationUtils, additionalParams } from "./ConversationUtils";
import { CometChatMentionsFormatter } from "../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatTextFormatter } from "../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatActionsIcon, CometChatActionsView, CometChatMessageComposerAction, CometChatMessageTemplate } from "../modals";
import { CometChatLocalize, getLocalizedString } from "../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";
import { MentionsTargetElement, MessageBubbleAlignment, Receipts } from "../Enums/Enums";
import { CometChatFullScreenViewer } from "../components/BaseComponents/CometChatFullScreenViewer/CometChatFullScreenViewer";
import { CometChatImageBubble } from "../components/BaseComponents/CometChatImageBubble/CometChatImageBubble";

import AudioIcon from "../assets/play_circle.svg";
import CopyIcon from "../assets/Copy.svg";
import DeleteIcon from "../assets/delete.svg";
import EditIcon from "../assets/edit_icon.svg";
import FileIcon from "../assets/document_icon.svg";
import ImageIcon from "../assets/photo.svg";
import InformationIcon from "../assets/info_icon.svg";
import ReportIcon from "../assets/warning_neutral.svg";
import PlaceholderImage from "../assets/image_placeholder.png";
import PrivateMessageIcon from "../assets/send_message_privately.svg";
import ReactionIcon from "../assets/add_reaction_icon.svg";
import ThreadIcon from "../assets/reply_in_thread.svg";
import Reply from "../assets/reply.svg";
import VideoIcon from "../assets/videocam.svg";
import { CometChatTextBubble } from "../components/BaseComponents/CometChatTextBubble/CometChatTextBubble";
import { CometChatDeleteBubble } from "../components/BaseComponents/CometChatDeleteBubble/CometChatDeleteBubble";
import { CometChatVideoBubble } from "../components/BaseComponents/CometChatVideoBubble/CometChatVideoBubble";
import { CometChatAudioBubble } from "../components/BaseComponents/CometChatAudioBubble/CometChatAudioBubble";
import { CometChatFileBubble } from "../components/BaseComponents/CometChatFileBubble/CometChatFileBubble";
import jpgIcon from '../assets/file_type_jpg.png';
import linkIcon from '../assets/file_type_link.png';
import movIcon from '../assets/file_type_mov.png';
import mp3Icon from '../assets/file_type_mp3.png';
import pdfIcon from '../assets/file_type_pdf.png';
import pptIcon from '../assets/file_type_ppt.png';
import txtIcon from '../assets/file_type_txt.png';
import unsupportedIcon from '../assets/file_type_unsupported.png';
import wordIcon from '../assets/file_type_word.png';
import xlsxIcon from '../assets/file_type_xlsx.png';
import zipIcon from '../assets/file_type_zip.png';
import { CometChatActionBubble } from "../components/BaseComponents/CometChatActionBubble/CometChatActionBubble";
import { CometChatUIEvents } from "../events/CometChatUIEvents";
import { CometChatDate } from "../components/BaseComponents/CometChatDate/CometChatDate";
import { MessageReceiptUtils } from "./MessageReceiptUtils";
import { isMobileDevice } from "./util";
import { CalendarObject } from "./CalendarObject";
import { CometChatAIAssistantMessageBubble } from "../components/BaseComponents/CometChatAIAssistantMessageBubble/CometChatAIAssistantMessageBubble";
import { CometChatStreamMessageBubble } from "../components/BaseComponents/CometChatStreamMessageBubble/CometChatStreamMessageBubble";
import { CometChatToolCallResultBubble } from "../components/BaseComponents/CometChatToolCallResultBubble/CometChatToolCallResultBubble";
import { CometChatToolCallArgumentBubble } from "../components/BaseComponents/CometChatToolCallArgumentBubble/CometChatToolCallArgumentBubble";
import { CometChatMessagePreview } from "../components/BaseComponents/CometChatMessagePreview/CometChatMessagePreview";
import { CollaborativeDocumentConstants } from "../components/Extensions/CollaborativeDocument/CollaborativeDocumentConstants";
import { CollaborativeWhiteboardConstants } from "../components/Extensions/CollaborativeWhiteboard/CollaborativeWhiteboardConstants";
import { PollsConstants } from "../components/Extensions/Polls/PollsConstants";
import { StickersConstants } from "../components/Extensions/Stickers/StickersConstants";
import { CometChatUIKitUtility } from "../CometChatUIKit/CometChatUIKitUtility";
export type ComposerId = { parentMessageId: number | null, user: string | null, group: string | null };
/**
 * Utility class that extends DataSource and provides getters for message options.
 * It is used in message and dataSource utils.
 */

export interface additionalParamsOptions {
  hideReplyInThreadOption?: boolean,
  hideReplyOption?: boolean,
  hideTranslateMessageOption?: boolean,
  hideReactionOption?: boolean,
  hideEditMessageOption?: boolean,
  hideDeleteMessageOption?: boolean,
  hideMessagePrivatelyOption?: boolean,
  hideCopyMessageOption?: boolean,
  hideMessageInfoOption?: boolean,
  hideFlagMessageOption?: boolean,
}

export class MessagesDataSource implements DataSource {
  getEditOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.editMessage,
      title: getLocalizedString("message_list_option_edit"),
      iconURL: EditIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getDeleteOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.deleteMessage,
      title: getLocalizedString("message_list_option_delete"),
      iconURL: DeleteIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getReactionOption(): CometChatActionsView {
    return new CometChatActionsView({
      id: CometChatUIKitConstants.MessageOption.reactToMessage,
      title: getLocalizedString("message_list_option_react"),
      iconURL: ReactionIcon,
      customView: undefined,
    });
  }

  getReplyInThreadOption(): CometChatActionsIcon {
    const replyString = getLocalizedString("message_list_option_reply")
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.replyInThread,
      title: replyString !== '' ? replyString : getLocalizedString("message_list_option_reply_in_thread"),
      iconURL: ThreadIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getReplyOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.replyMessage,
      title: getLocalizedString("message_list_option_reply_to_message"),
      iconURL: Reply,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getSendMessagePrivatelyOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.sendMessagePrivately,
      title: getLocalizedString("message_list_option_message_privately"),
      iconURL: PrivateMessageIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getCopyOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.copyMessage,
      title: getLocalizedString("message_list_option_copy"),
      iconURL: CopyIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getMessageInfoOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.messageInformation,
      title: getLocalizedString("message_list_option_info"),
      iconURL: InformationIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  getReportOption(): CometChatActionsIcon {
    return new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.flagMessage,
      title: getLocalizedString("message_list_option_flag_message"),
      iconURL: ReportIcon,
      onClick: undefined as unknown as (id: number) => void,
    });
  }

  isSentByMe(
    loggedInUser: CometChat.User,
    message: CometChat.BaseMessage
  ): boolean {
    return (
      !message.getSender() ||
      loggedInUser.getUid() === message.getSender().getUid()
    );
  }

  getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: additionalParamsOptions
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);
    let isParticipant: boolean = false;

    if (
      group?.getScope() === CometChatUIKitConstants.groupMemberScope.participant
    ) {
      isParticipant = true;
    }

    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> = [];
    if (!additionalParams?.hideReactionOption) {
      messageOptionList.push(this.getReactionOption());
    }
    if (!additionalParams?.hideReplyOption) {
      messageOptionList.push(this.getReplyOption());
    }
    if (!messageObject.getParentMessageId() && !additionalParams?.hideReplyInThreadOption) {
      messageOptionList.push(this.getReplyInThreadOption());
    }
    if (!additionalParams?.hideCopyMessageOption) {
      messageOptionList.push(this.getCopyOption());
    }
    if ((isSentByMe || (!isParticipant && group)) && !additionalParams?.hideEditMessageOption) {
      messageOptionList.push(this.getEditOption());
    }
    if (isSentByMe && !additionalParams?.hideMessageInfoOption) {
      messageOptionList.push(this.getMessageInfoOption());
    }
    if (!isSentByMe && !additionalParams?.hideFlagMessageOption && messageObject.getCategory() === CometChatUIKitConstants.MessageCategory.message) {
      messageOptionList.push(this.getReportOption());
    }
    if ((isSentByMe || (!isParticipant && group)) && !additionalParams?.hideDeleteMessageOption)
      messageOptionList.push(this.getDeleteOption());
    if (group && !isSentByMe && !additionalParams?.hideMessagePrivatelyOption) {
      messageOptionList.push(this.getSendMessagePrivatelyOption());
    }
    return messageOptionList;
  }
  getIsSentByMe(message: CometChat.BaseMessage) {
    return !message.getSender() || message.getSender().getUid() == CometChatUIKitLoginListener.getLoggedInUser()?.getUid()
  }
  getImageMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> =
      [];
    messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );

    return messageOptionList;
  }

  getVideoMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> =
      [];
    messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );

    return messageOptionList;
  }

  getAudioMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> =
      [];
    messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );

    return messageOptionList;
  }

  getFileMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: Object | undefined
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> =
      [];
    messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(
      loggedInUser,
      messageObject,
      group,
      additionalParams
    );

    return messageOptionList;
  }
  getReceiptClass(status?: number) {
    if (status == Receipts.error) {
      return "error";
    }
    if (status == Receipts.read) {
      return "read";
    }
    if (status == Receipts.delivered) {
      return "delivered";
    }
    if (status == Receipts.sent) {
      return "sent";
    }
    if (status == Receipts.wait) {
      return "wait";
    }
  }
  /**
* Function to get receipt for message bubble
* @param {CometChat.BaseMessage} item - The message bubble for which the receipt needs to be fetched
* @returns {JSX.Element | null} Returns JSX.Element for receipt of a message bubble or null
*/

getBubbleStatusInfoReceipt: (item: CometChat.BaseMessage, hideReceipts?: boolean,showError?:boolean) => JSX.Element | null =
(item: CometChat.BaseMessage, hideReceipts?: boolean, showError?: boolean) => {
      if (

        !hideReceipts &&
        (!item?.getSender() ||
          CometChatUIKitLoginListener.getLoggedInUser()?.getUid() === item?.getSender()?.getUid()) &&
        item?.getCategory() !==
        CometChatUIKitConstants.MessageCategory.action &&
        item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call &&
        !item?.getDeletedAt() &&
        item?.getCategory() !==
        CometChatUIKitConstants.MessageCategory.interactive
      ) {
        let state = MessageReceiptUtils.getReceiptStatus(item);
        return (
          <div className={`cometchat-receipts cometchat-message-bubble__status-info-view-receipts cometchat-message-bubble__status-info-view-receipts-${this.getReceiptClass(state)} cometchat-receipts-${this.getReceiptClass(state)}`}>
            <div className="cometchat-message-list__receipt"></div>
          </div>
        );
      } else {
        if (showError) {
          let state = MessageReceiptUtils.getReceiptStatus(item);
          if(state === Receipts.error){
            return (
              <div className={`cometchat-receipts cometchat-message-bubble__status-info-view-receipts cometchat-message-bubble__status-info-view-receipts-${this.getReceiptClass(state)} cometchat-receipts-${this.getReceiptClass(state)}`}>
                <div className="cometchat-message-list__receipt"></div>
              </div>
            )
          }

        }


        return null;
      }
    }
  /**
* Function for displaying the timestamp  next to messages.
* @returns CalendarObject
*/
getMessageSentAtDateFormat(messageSentAtDateTimeFormat?:CalendarObject) {
  const defaultFormat = {
    yesterday: `hh:mm A`,
    otherDays: `hh:mm A`,
    today: `hh:mm A`
  };

  const finalFormat = {
    ...defaultFormat,
    ...CometChatLocalize.calendarObject,
    ...messageSentAtDateTimeFormat
  };

  return finalFormat;
}
  /**
* Function to get status and date for message bubble
* @param {CometChat.BaseMessage} item - The message bubble for which the information needs to be fetched
* @returns {JSX.Element | null} Returns JSX.Element for status and date of a message bubble or null
*/
  getBubbleStatusInfoDate: (item: CometChat.BaseMessage, messageSentAtDateTimeFormat?: CalendarObject) => JSX.Element | null =
    (item: CometChat.BaseMessage, messageSentAtDateTimeFormat?: CalendarObject) => {
      if (
        item?.getCategory() !==
        CometChatUIKitConstants.MessageCategory.action &&
        item?.getCategory() !== CometChatUIKitConstants.MessageCategory.call
      ) {
        return (
          <CometChatDate
            timestamp={item.getSentAt()}
            calendarObject={this.getMessageSentAtDateFormat(messageSentAtDateTimeFormat)}
          ></CometChatDate>
        );
      } else {
        return null;
      }
    }
  getStatusInfoView = (_messageObject: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignment, hideReceipts?: boolean, messageSentAtDateTimeFormat?: CalendarObject, showError?: boolean
  ) => {
    if (!(_messageObject instanceof CometChat.Action) && !(_messageObject instanceof CometChat.Call) && (_messageObject.getType() != "meeting" || (_messageObject.getType() == "meeting" && _messageObject.getDeletedAt()))) {
      return (
        <div
          className="cometchat-message-bubble__status-info-view"
        >
          {!_messageObject.getDeletedAt() && _messageObject.getType() == CometChatUIKitConstants.MessageTypes.text && _messageObject.getEditedAt() ? <span className="cometchat-message-bubble__status-info-view-helper-text">  {getLocalizedString("message_list_action_edited")} </span> : null}

          {this.getBubbleStatusInfoDate(_messageObject, messageSentAtDateTimeFormat)}
          {!hideReceipts && this.getBubbleStatusInfoReceipt(_messageObject, hideReceipts,showError)}
        </div>
      );
    } else {
      return null;
    }
  }

  getBottomView(
    _messageObject: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignment
  ) {
    return null;
  }

  getReplyView(
    _messageObject: CometChat.BaseMessage,
    _alignment: MessageBubbleAlignment,
    onReplyPreviewClick?: (messageToReply: CometChat.BaseMessage) => void,
    textFormatters?: CometChatTextFormatter[]
  ) {
    // Use default text formatters if textFormatters is undefined
    const finalTextFormatters = textFormatters || ChatConfigurator.getDataSource().getAllTextFormatters({});

    let isMessageModerated = false;
    if(_messageObject instanceof CometChat.TextMessage || _messageObject instanceof CometChat.MediaMessage){
      if(_messageObject.getModerationStatus() === CometChatUIKitConstants.moderationStatus.disapproved){
        isMessageModerated = true;
      }
    }
    const hasQuotedMessage = _messageObject.getQuotedMessage();
      if (hasQuotedMessage &&
        !(_messageObject instanceof CometChat.Action) &&
        !(_messageObject instanceof CometChat.Call) &&
        !(_messageObject.getType() == "meeting") &&
        !(_messageObject.getDeletedAt())
        ) {
      return <div style={{ width: '100%' }} onClick={() => {
        if(onReplyPreviewClick){
          onReplyPreviewClick(_messageObject)
        }
      }}>
        <CometChatMessagePreview 
          hideCloseButton={true} 
          message={_messageObject.getQuotedMessage()} 
          isMessageModerated={isMessageModerated}
          textFormatters={finalTextFormatters}
          previewTitle={this.getMessagePreviewTitle(_messageObject.getQuotedMessage(), _alignment)}
          previewSubtitle={this.getMessagePreviewSubtitle(_messageObject.getQuotedMessage(), textFormatters, _alignment)}
        />
      </div>;
    }
    return null;
  }

  getFooterView(_messageObject: CometChat.BaseMessage) {
    return _messageObject instanceof CometChat.AIAssistantMessage ? (
      <div
        title={getLocalizedString("message_list_option_copy")}
        className="cometchat-ai-assistant-message-bubble__copy"
        style={{ cursor: "pointer" }}
        onClick={() =>
          this.handleCopy(_messageObject as CometChat.AIAssistantMessage)
        }
      ></div>
    ) : null;
  }

  getTextMessageTemplate(
    additionalConfigurations?: additionalParams
  ): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.text,
      category: CometChatUIKitConstants.MessageCategory.message,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment,
        textFormatters?: CometChatTextFormatter[]

      ) => {
        const shouldOverrideTextFormatters = (
          existingFormatters?: CometChatTextFormatter[],
          incoming?: CometChatTextFormatter[]
        ): boolean => {
          if (!incoming || incoming.length === 0) return false;
          if (!existingFormatters || existingFormatters.length === 0) return true;

          // Compare by constructor name or another property that uniquely identifies formatter types
          return incoming.some(incomingFormatter =>
            !existingFormatters.some(existingFormatter =>
              incomingFormatter.constructor?.name === existingFormatter.constructor?.name
            )
          );
        };

        const mergedParams = {
          ...additionalConfigurations,
          ...(shouldOverrideTextFormatters(
            additionalConfigurations?.textFormatters,
            textFormatters
          ) ? { textFormatters } : {})
        };
        let textMessage: CometChat.TextMessage =
          message as CometChat.TextMessage;
        if (textMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(textMessage, undefined, _alignment);
        }
        return ChatConfigurator.getDataSource().getTextMessageContentView(
          textMessage,
          _alignment,
          mergedParams
        );
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }
  getAgentAssistantMessageBubble(message: CometChat.AIAssistantMessage) {
    return <CometChatAIAssistantMessageBubble message={message} />

  }
  getToolArgumentsMessageBubble(message: CometChat.AIToolArgumentMessage) {
    return <CometChatToolCallArgumentBubble message={message} />

  }
  getToolResultsMessageBubble(message: CometChat.AIToolResultMessage) {
    return <CometChatToolCallResultBubble message={message} />

  }
  handleCopy = (message: CometChat.AIAssistantMessage) => {
    if (message.getAssistantMessageData()?.getText()) {
      if (navigator && navigator.clipboard) {
        navigator.clipboard.writeText(message.getAssistantMessageData()?.getText());
      } else {
        // fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = message.getAssistantMessageData()?.getText();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    }
  };
  getAgentAssistantMessageTemplate() {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.assistant,
      category: CometChatUIKitConstants.MessageCategory.agentic,
      statusInfoView: undefined,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment,

      ) => {
        return ChatConfigurator.getDataSource().getAgentAssistantMessageBubble(message as CometChat.AIAssistantMessage, _alignment);

      },
      options: undefined,
      footerView: (message: CometChat.BaseMessage) => {
        return ChatConfigurator.getDataSource().getFooterView(message as CometChat.AIAssistantMessage);
      },

    });
  }
  getToolResultsMessageTemplate() {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.toolResults,
      category: CometChatUIKitConstants.MessageCategory.agentic,
      statusInfoView: undefined,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment,

      ) => {
        return ChatConfigurator.getDataSource().getToolResultsMessageBubble(message as CometChat.AIToolResultMessage, _alignment);

      },
      options: undefined,
      footerView: (message: CometChat.BaseMessage) => {
        return ChatConfigurator.getDataSource().getFooterView(message as CometChat.AIToolResultMessage);
      },
    });
  }
  getToolArgumentsMessageTemplate() {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.toolArguments,
      category: CometChatUIKitConstants.MessageCategory.agentic,
      statusInfoView: undefined,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment,

      ) => {
        return ChatConfigurator.getDataSource().getToolArgumentsMessageBubble(message as CometChat.AIToolArgumentMessage, _alignment);

      },
      options: undefined,
      footerView: (message: CometChat.BaseMessage) => {
        return ChatConfigurator.getDataSource().getFooterView(message as CometChat.AIToolArgumentMessage);
      }
    });
  }
  getStreamMessageBubble(message: CometChat.CustomMessage) {
    return <CometChatStreamMessageBubble key={message.getId() + message.getType()} message={message as unknown as CometChat.AIAssistantBaseEvent} />
  }

  getStreamMessageTemplate() {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.streamMessageTypes.run_started,
      category: CometChatUIKitConstants.MessageCategory.custom,
      statusInfoView: undefined,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment,

      ) => {

        return ChatConfigurator.getDataSource().getStreamMessageBubble(message as CometChat.CustomMessage, _alignment);
      },
      options: undefined,
      bottomView: undefined
    });
  }

  getAudioMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.audio,
      category: CometChatUIKitConstants.MessageCategory.message,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let audioMessage: CometChat.MediaMessage =
          message as CometChat.MediaMessage;
        if (audioMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message, undefined, _alignment);
        }
        return ChatConfigurator.getDataSource().getAudioMessageContentView(
          audioMessage,
          _alignment
        );
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }

  getVideoMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.video,
      category: CometChatUIKitConstants.MessageCategory.message,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let videoMessage: CometChat.MediaMessage =
          message as CometChat.MediaMessage;
        if (videoMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message, undefined, _alignment);
        }
        return ChatConfigurator.getDataSource().getVideoMessageContentView(
          videoMessage,
          _alignment
        );
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }

  getImageMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.image,
      category: CometChatUIKitConstants.MessageCategory.message,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let imageMessage: CometChat.MediaMessage =
          message as CometChat.MediaMessage;
        if (imageMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message, undefined, _alignment);
        }

        return ChatConfigurator.getDataSource().getImageMessageContentView(
          imageMessage,
          _alignment
        );
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }

  getGroupActionTemplate(additionalConfigurations?: { hideGroupActionMessages?: boolean }): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.groupMember,
      category: CometChatUIKitConstants.MessageCategory.action,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return !additionalConfigurations?.hideGroupActionMessages ? this.getGroupActionBubble(message) : null;
      },
    });
  }

  getFileMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.file,
      category: CometChatUIKitConstants.MessageCategory.message,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let fileMessage: CometChat.MediaMessage =
          message as CometChat.MediaMessage;
        if (fileMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message, undefined, _alignment);
        }

        return ChatConfigurator.getDataSource().getFileMessageContentView(
          fileMessage,
          _alignment
        );
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }


  getAllMessageTemplates(
    additionalConfigurations?: additionalParams
  ): Array<CometChatMessageTemplate> {
    if (!additionalConfigurations) {
      additionalConfigurations = {
        disableMentions: false,
      };
    }
    return [
      ChatConfigurator.getDataSource().getTextMessageTemplate(
        additionalConfigurations
      ),
      ChatConfigurator.getDataSource().getImageMessageTemplate(),
      ChatConfigurator.getDataSource().getVideoMessageTemplate(),
      ChatConfigurator.getDataSource().getAudioMessageTemplate(),
      ChatConfigurator.getDataSource().getFileMessageTemplate(),
      ChatConfigurator.getDataSource().getGroupActionTemplate(additionalConfigurations),
      ChatConfigurator.getDataSource().getFormMessageTemplate(),
      ChatConfigurator.getDataSource().getSchedulerMessageTemplate(),
      ChatConfigurator.getDataSource().getCardMessageTemplate(),
      ChatConfigurator.getDataSource().getAgentAssistantMessageTemplate(),
      ChatConfigurator.getDataSource().getStreamMessageTemplate(),
      this.getToolResultsMessageTemplate(),
      this.getToolArgumentsMessageTemplate()
    ];
  }

  getMessageTemplate(
    messageType: string,
    messageCategory: string,
    additionalConfigurations?: additionalParams
  ): CometChatMessageTemplate | null {

    if (!additionalConfigurations) {
      additionalConfigurations = {
        disableMentions: false,
      };
    }

    let _template: CometChatMessageTemplate | null = null;
    if (messageCategory !== CometChatUIKitConstants.MessageCategory.call) {
      switch (messageType) {
        case CometChatUIKitConstants.MessageTypes.text:
          _template =
            ChatConfigurator.getDataSource().getTextMessageTemplate(additionalConfigurations);
          break;

        case CometChatUIKitConstants.MessageTypes.image:
          _template =
            ChatConfigurator.getDataSource().getImageMessageTemplate();
          break;

        case CometChatUIKitConstants.MessageTypes.video:
          _template =
            ChatConfigurator.getDataSource().getVideoMessageTemplate();
          break;

        case CometChatUIKitConstants.MessageTypes.groupMember:
          _template =
            ChatConfigurator.getDataSource().getGroupActionTemplate(additionalConfigurations);
          break;

        case CometChatUIKitConstants.MessageTypes.file:
          _template =
            ChatConfigurator.getDataSource().getFileMessageTemplate();
          break;

        case CometChatUIKitConstants.MessageTypes.audio:
          _template =
            ChatConfigurator.getDataSource().getAudioMessageTemplate();
          break;
        case CometChatUIKitConstants.MessageTypes.form:
          _template =
            ChatConfigurator.getDataSource().getFormMessageTemplate();
          break;
        case CometChatUIKitConstants.MessageTypes.scheduler:
          _template =
            ChatConfigurator.getDataSource().getSchedulerMessageTemplate();
          break;
        case CometChatUIKitConstants.MessageTypes.card:
          _template =
            ChatConfigurator.getDataSource().getCardMessageTemplate();
          break;
      }
    }
    return _template;
  }

  getMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: additionalParamsOptions
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let _optionList: Array<CometChatActionsIcon | CometChatActionsView> = [];
    let isParticipant: boolean = false;

    let moderationStatus: string = CometChatUIKitConstants.moderationStatus.unmoderated;
    
    if (messageObject instanceof CometChat.TextMessage || messageObject instanceof CometChat.MediaMessage) {
      moderationStatus = messageObject.getModerationStatus();
    }

    if (
      group?.getScope() === CometChatUIKitConstants.groupMemberScope.participant
    ) {
      isParticipant = true;
    }

    if (moderationStatus === CometChatUIKitConstants.moderationStatus.pending) {
      return [];
    } else if (moderationStatus === CometChatUIKitConstants.moderationStatus.disapproved) {
      let isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);
      _optionList = [];
      if ((isSentByMe || (!isParticipant && group)) && !additionalParams?.hideDeleteMessageOption)
        _optionList.push(this.getDeleteOption());

      if (messageObject.getType() === 'text') {
        if (!additionalParams?.hideCopyMessageOption) {
          _optionList.push(this.getCopyOption());
        }
      }
      return _optionList;
    }

    if (
      messageObject.getCategory() ===
      CometChatUIKitConstants.MessageCategory.message
    ) {
      switch (messageObject.getType()) {
        case CometChatUIKitConstants.MessageTypes.text:
          _optionList = ChatConfigurator.getDataSource().getTextMessageOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
        case CometChatUIKitConstants.MessageTypes.image:
          _optionList = ChatConfigurator.getDataSource().getImageMessageOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
        case CometChatUIKitConstants.MessageTypes.video:
          _optionList = ChatConfigurator.getDataSource().getVideoMessageOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
        case CometChatUIKitConstants.MessageTypes.groupMember:
          _optionList = [];
          break;
        case CometChatUIKitConstants.MessageTypes.file:
          _optionList = ChatConfigurator.getDataSource().getFileMessageOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
        case CometChatUIKitConstants.MessageTypes.audio:
          _optionList = ChatConfigurator.getDataSource().getAudioMessageOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
        default:
          _optionList = ChatConfigurator.getDataSource().getCommonOptions(
            loggedInUser,
            messageObject,
            group,
            additionalParams
          );
          break;
      }
    }
    else if (
      messageObject.getCategory() ==
      CometChatUIKitConstants.MessageCategory.custom ||
      messageObject.getCategory() ==
      CometChatUIKitConstants.MessageCategory.interactive
    ) {
      _optionList = ChatConfigurator.getDataSource().getCommonOptions(
        loggedInUser,
        messageObject,
        group,
        additionalParams
      );
    }
    return _optionList;
  }

  getCommonOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: additionalParamsOptions
  ): Array<CometChatActionsIcon | CometChatActionsView> {
    let isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);
    let isParticipant: boolean = false;
    if (group?.getScope() === CometChatUIKitConstants.groupMemberScope.participant)
      isParticipant = true;

    let messageOptionList: Array<CometChatActionsIcon | CometChatActionsView> =
      [];

    if (!additionalParams?.hideReactionOption) {
      messageOptionList.push(this.getReactionOption());
    }
    if (!additionalParams?.hideReplyOption) {
      messageOptionList.push(this.getReplyOption());
    }
    if (!messageObject?.getParentMessageId() && !additionalParams?.hideReplyInThreadOption) {
      messageOptionList.push(this.getReplyInThreadOption());
    }
    if (isSentByMe && !additionalParams?.hideMessageInfoOption) {
      messageOptionList.push(this.getMessageInfoOption());
    }
    if (
      !isSentByMe &&
      !additionalParams?.hideFlagMessageOption &&
      messageObject.getCategory() === CometChatUIKitConstants.MessageCategory.message
    ) {
      messageOptionList.push(this.getReportOption());
    }
    if ((isSentByMe || (!isParticipant && group)) && !additionalParams?.hideDeleteMessageOption)
      messageOptionList.push(this.getDeleteOption());

    if (group?.getGuid() && !isSentByMe && !additionalParams?.hideMessagePrivatelyOption) {
      messageOptionList.push(this.getSendMessagePrivatelyOption());
    }
    return messageOptionList;
  }

  getAllMessageTypes(): Array<string> {
    return [
      CometChatUIKitConstants.MessageTypes.text,
      CometChatUIKitConstants.MessageTypes.image,
      CometChatUIKitConstants.MessageTypes.audio,
      CometChatUIKitConstants.MessageTypes.video,
      CometChatUIKitConstants.MessageTypes.file,
      CometChatUIKitConstants.MessageTypes.groupMember,
      CometChatUIKitConstants.MessageTypes.form,
      CometChatUIKitConstants.MessageTypes.scheduler,
      CometChatUIKitConstants.MessageTypes.card,
      CometChatUIKitConstants.MessageTypes.assistant,
      // CometChatUIKitConstants.MessageTypes.toolArguments,
      // CometChatUIKitConstants.MessageTypes.toolResults
    ];
  }

  addList(): string {
    return "<Message Utils>";
  }

  getAllMessageCategories(additionalConfigurations?: { hideGroupActionMessages?: boolean }): Array<string> {
    let categories =  [
      CometChatUIKitConstants.MessageCategory.message,
      CometChatUIKitConstants.MessageCategory.interactive,
      CometChatUIKitConstants.MessageCategory.agentic
    ];
    if (!additionalConfigurations?.hideGroupActionMessages){
      categories.push(CometChatUIKitConstants.MessageCategory.action)
    }
    return categories;
  }

  getStickerButton(
    id: ComposerId,
    
    user?: CometChat.User,
    group?: CometChat.Group,
    messageToReply?: CometChat.BaseMessage | null,
    closeReplyPreview?: () => void,
  ): JSX.Element | undefined {
    return undefined;
  }

  getId(): string {
    return "messageUtils";
  }

  getTextMessageContentView(
    message: CometChat.TextMessage,
    _alignment: MessageBubbleAlignment,

    additionalConfigurations?: additionalParams
  ) {
    return ChatConfigurator.getDataSource().getTextMessageBubble(
      message.getText(),
      message,
      _alignment,
      additionalConfigurations
    );
  }

  getAudioMessageContentView(
    message: CometChat.MediaMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getAudioMessageBubble(
      message?.getAttachments()[0]?.getUrl(),
      message,
      message?.getAttachments()[0]?.getName(),
      _alignment
    );
  }

  getFileMessageContentView(
    message: CometChat.MediaMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getFileMessageBubble(
      message?.getAttachments()[0]?.getUrl(),
      message,
      message?.getAttachments()[0]?.getName(),
      _alignment
    );
  }

  getImageMessageContentView(
    message: CometChat.MediaMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    let imageUrl = message?.getAttachments()[0]?.getUrl() || "";
    return ChatConfigurator.getDataSource().getImageMessageBubble(
      imageUrl,
      PlaceholderImage,
      message,
      undefined,
      _alignment
    );
  }

  getVideoMessageContentView(
    message: CometChat.MediaMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getVideoMessageBubble(
      message?.getAttachments()[0]?.getUrl(),
      message,
      undefined, undefined,
      _alignment
    );
  }

  getActionMessage(message: any): string {
    let actionMessage = "";
    if (
      message.hasOwnProperty("actionBy") === false ||
      message.hasOwnProperty("actionOn") === false
    ) {
      return actionMessage;
    }
    if (
      message.action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
      message.action !== CometChatUIKitConstants.groupMemberAction.LEFT &&
      (message.actionBy.hasOwnProperty("name") === false ||
        message.actionOn.hasOwnProperty("name") === false)
    ) {
      return actionMessage;
    }
    if (
      message.action === CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE
    ) {
      if (
        message.hasOwnProperty("data") &&
        message.data.hasOwnProperty("extras")
      ) {
        if (message.data.extras.hasOwnProperty("scope")) {
          if (message.data.extras.scope.hasOwnProperty("new") === false) {
            return actionMessage;
          }
        } else {
          return actionMessage;
        }
      } else {
        return actionMessage;
      }
    }
    if (
      message.action ===
      CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE &&
      message.data.extras.hasOwnProperty("scope") === false
    ) {
      return actionMessage;
    }
    if (
      message.action ===
      CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE &&
      message.data.extras.scope.hasOwnProperty("new") === false
    ) {
      return actionMessage;
    }
    const byEntity = message.actionBy;
    const onEntity = message.actionOn;
    const byString = byEntity.name;
    const forString =
      message.action !== CometChatUIKitConstants.groupMemberAction.JOINED &&
        message.action !== CometChatUIKitConstants.groupMemberAction.LEFT
        ? onEntity.name
        : "";
    switch (message.action) {
      case CometChatUIKitConstants.groupMemberAction.ADDED:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_added")} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.JOINED:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_joined")}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.LEFT:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_left")}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.KICKED:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_kicked")} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.BANNED:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_banned")} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.UNBANNED:
        actionMessage = `${byString} ${getLocalizedString("message_list_action_unbanned")} ${forString}`;
        break;
      case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE: {
        const newScope = message["data"]["extras"]["scope"]["new"];
        actionMessage = `${byString} ${getLocalizedString(
          "message_list_action_made"
        )} ${forString} ${getLocalizedString(`member_scope_${newScope}`)}`;
        break;
      }
      default:
        break;
    }
    return actionMessage;
  }

  getDeleteMessageBubble(
    message: CometChat.BaseMessage,
    text?: string,
    alignment?: MessageBubbleAlignment
  ) {
    return <CometChatDeleteBubble isSentByMe={alignment == MessageBubbleAlignment.right} text={text} />;
  }

  getGroupActionBubble(
    message: CometChat.BaseMessage,

  ) {
    let messageText = this.getActionMessage(message);
    return <CometChatActionBubble messageText={messageText} />;
  }


  getTextMessageBubble(
    messageText: string,
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: additionalParams
  ): Element | JSX.Element {
    let config = {
      ...additionalConfigurations,
      textFormatters:
        additionalConfigurations?.textFormatters &&
          additionalConfigurations?.textFormatters.length
          ? [...additionalConfigurations.textFormatters]
          : this.getAllTextFormatters({ alignment, disableMentions: additionalConfigurations?.disableMentions }),
    };

    let textFormatters: Array<CometChatTextFormatter> = config.textFormatters;
    let urlTextFormatter!: CometChatUrlsFormatter;
    if (config && !config.disableMentions) {
      let mentionsTextFormatter!: CometChatMentionsFormatter;
      for (let i = 0; i < textFormatters.length; i++) {
        if (textFormatters[i] instanceof CometChatMentionsFormatter) {
          mentionsTextFormatter = textFormatters[
            i
          ] as CometChatMentionsFormatter;
          mentionsTextFormatter.setMessage(message);
          if (message.getMentionedUsers().length) {
            mentionsTextFormatter.setCometChatUserGroupMembers(
              message.getMentionedUsers()
            );
          }

          if (
            message.getType() === CometChatUIKitConstants.MessageTypes.text &&
            !message.getDeletedAt()
          ) {
            const channelRegex = /<@all:(.*?)>/g;
            const text = message.getText();
            const matches = Array.from(text.matchAll(channelRegex));
            const mentionedChannels = matches.map((m) => m[1]);
            mentionsTextFormatter.setCometChatMentionedChannels(
              mentionedChannels
            );
          }
          
          mentionsTextFormatter.setLoggedInUser(
            CometChatUIKitLoginListener.getLoggedInUser()!
          );
          if (urlTextFormatter) {
            break;
          }
        }
        if (textFormatters[i] instanceof CometChatUrlsFormatter) {
          urlTextFormatter = textFormatters[i] as CometChatUrlsFormatter;
          if (mentionsTextFormatter) {
            break;
          }
        }
      }
      if (!mentionsTextFormatter) {
        mentionsTextFormatter =
          ChatConfigurator.getDataSource().getMentionsTextFormatter({
            message,
            ...config,
            alignment,

          });
        textFormatters.push(mentionsTextFormatter);
      }
    } else {
      for (let i = 0; i < textFormatters.length; i++) {
        if (textFormatters[i] instanceof CometChatUrlsFormatter) {
          urlTextFormatter = textFormatters[i] as CometChatUrlsFormatter;
          break;
        }
      }
    }

    if (!urlTextFormatter) {
      urlTextFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter({

        alignment,
      });
      textFormatters.push(urlTextFormatter);
    }


    for (let i = 0; i < textFormatters.length; i++) {
      textFormatters[i].setMessageBubbleAlignment(alignment);
      textFormatters[i].setMessage(message);
    }
    return (
      <CometChatTextBubble
        isSentByMe={alignment == MessageBubbleAlignment.right} text={messageText}
        textFormatters={textFormatters}
      />
    );
  }

  getAudioMessageBubble(
    audioUrl: string,
    message: CometChat.MediaMessage,
    title?: string, alignment?: MessageBubbleAlignment): Element | JSX.Element {
    return <CometChatAudioBubble isSentByMe={alignment == MessageBubbleAlignment.right}
      src={audioUrl} />;
  }
  /**
   * Function to check mimeType and return the iconUrl of that type
   * @param mimeType 
   * @returns 
   */
  getFileType = (mimeType: string): string => {
    if (!mimeType) {
      return "";
    }
    if (mimeType.startsWith('audio/')) {
      return mp3Icon;
    }

    if (mimeType.startsWith('video/')) {
      return movIcon;
    }

    if (mimeType.startsWith('image/')) {
      return jpgIcon;
    }
    if (mimeType.startsWith('text/')) {
      let icon = mimeType == 'text/html' ? linkIcon : txtIcon
      return icon;
    }
    const mimeTypeMap: { [key: string]: string } = {
      'application/pdf': pdfIcon,
      'application/msword': wordIcon,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': wordIcon,
      'application/vnd.ms-excel': xlsxIcon,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': xlsxIcon,
      'application/vnd.ms-powerpoint': pptIcon,
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': pptIcon,
      'application/zip': zipIcon,
      'application/x-rar-compressed': zipIcon,
    };

    return mimeTypeMap[mimeType] || unsupportedIcon;
  };
  /**
   * Function to convert bites to human readable fromat eg. kb,mb,gb
   * @param sizeInBytes 
   * @returns 
   */
  getFileSize = (sizeInBytes: number): string => {
    if (!sizeInBytes) {
      return "";
    }
    const sizeUnits = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < sizeUnits.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${Math.round(size)} ${sizeUnits[unitIndex]}`;
  };


  getFileMessageBubble(
    fileUrl: string,
    message: CometChat.MediaMessage,
    title?: string,
    alignment?: MessageBubbleAlignment  ): Element | JSX.Element {
    let attachment = message.getAttachments()[0];
    const metadataFile = (message.getMetadata() as any)?.file as File | undefined;
    const name = title ?? attachment?.getName() ?? metadataFile?.name;
    const mimeType = attachment?.getMimeType() ?? metadataFile?.type;
    const size = this.getFileSize(attachment?.getSize() ?? metadataFile?.size);
    const icon = this.getFileType(mimeType);
    const subtitle = `${size} ${attachment?.getExtension() ? `• ${attachment.getExtension()}` : ''}`.trim();
    return (
      <CometChatFileBubble
        fileTypeIconURL={icon}
        subtitle={subtitle}
        title={name}
        fileURL={fileUrl}
        isSentByMe={alignment == MessageBubbleAlignment.right}
      />
    );
  }

  getImageMessageBubble(
    imageUrl: string,
    placeholderImage: string,
    message: CometChat.MediaMessage,

    onClick?: Function) {


    const fullScreenViewer = (
      <CometChatFullScreenViewer
        url={message?.getAttachments()[0]?.getUrl() ?? imageUrl}
        ccCloseClicked={() => {
          CometChatUIEvents.ccHideDialog.next();
        }}
        message={message}
      />
    );
    return (
      <CometChatImageBubble
        src={imageUrl}
        placeholderImage={placeholderImage}
        isSentByMe={this.getIsSentByMe(message)}
        onImageClicked={!isMobileDevice() ? () => {
          CometChatUIEvents.ccShowDialog.next({
            child: fullScreenViewer,
            confirmCallback: null,
          });
        } : undefined}
      />
    );
  }

  getVideoMessageBubble(
    videoUrl: string,
    message: CometChat.MediaMessage,

    thumbnailUrl?: string,
    onClick?: Function
  ): Element | JSX.Element {


    return (
      <CometChatVideoBubble
        isSentByMe={this.getIsSentByMe(message)}
        src={videoUrl}
      />
    );
  }

  imageAttachmentOption(): CometChatMessageComposerAction {
    return new CometChatMessageComposerAction({
      id: CometChatUIKitConstants.MessageTypes.image,
      title: getLocalizedString("message_composer_attach_image"),
      iconURL: ImageIcon,
      onClick: null
    });
  }

  videoAttachmentOption(): CometChatMessageComposerAction {
    return new CometChatMessageComposerAction({
      id: CometChatUIKitConstants.MessageTypes.video,
      title: getLocalizedString("message_composer_attach_video"),
      iconURL: VideoIcon,
      onClick: null
    });
  }

  audioAttachmentOption(): CometChatMessageComposerAction {
    return new CometChatMessageComposerAction({
      id: CometChatUIKitConstants.MessageTypes.audio,
      title: getLocalizedString("message_composer_attach_audio"),
      iconURL: AudioIcon,
      onClick: null
    });
  }

  fileAttachmentOption(): CometChatMessageComposerAction {
    return new CometChatMessageComposerAction({
      id: CometChatUIKitConstants.MessageTypes.file,
      title: getLocalizedString("message_composer_attach_file"),
      iconURL: FileIcon,
      onClick: null
    });
  }

  getAttachmentOptions(

    id: ComposerId,
    additionalConfigurations?: any
  ): Array<CometChatMessageComposerAction> {
    const actionsData: CometChatMessageComposerAction[] = [
      this.imageAttachmentOption(),
      this.videoAttachmentOption(),
      this.audioAttachmentOption(),
      this.fileAttachmentOption(),
    ];
    const showAttachmentsMap = {
      [CometChatUIKitConstants.MessageTypes.image]: additionalConfigurations?.hideImageAttachmentOption,
      [CometChatUIKitConstants.MessageTypes.video]: additionalConfigurations?.hideVideoAttachmentOption,
      [CometChatUIKitConstants.MessageTypes.audio]: additionalConfigurations?.hideAudioAttachmentOption,
      [CometChatUIKitConstants.MessageTypes.file]: additionalConfigurations?.hideFileAttachmentOption,
    };
    const actions = actionsData.filter(action => !showAttachmentsMap[action.id]);
    return actions;
  }

  getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser: CometChat.User,
    additionalConfigurations: additionalParams
  ): string {
    let formatters:CometChatTextFormatter[] = additionalConfigurations.textFormatters || additionalConfigurations.textFormattersList || []
    let config = {
      ...additionalConfigurations,
      textFormatters:
        formatters &&
          formatters.length
          ? [...formatters]
          : [this.getMentionsTextFormatter({ disableMentions: additionalConfigurations.disableMentions })],
    };
    let message = ConversationUtils.getLastConversationMessage(
      conversation,
      loggedInUser,
      config as any  // toDo remove any
    );
    message = CometChatUIKitUtility.sanitizeText(message);
    let messageObject = conversation.getLastMessage();


    if (messageObject) {

      let textFormatters: Array<CometChatTextFormatter> = config.textFormatters;
      if (config && !config.disableMentions) {
        let mentionsTextFormatter!: CometChatMentionsFormatter;
        for (let i = 0; i < textFormatters.length; i++) {
          if (textFormatters[i] instanceof CometChatMentionsFormatter) {
            mentionsTextFormatter = textFormatters[
              i
            ] as unknown as CometChatMentionsFormatter;
            mentionsTextFormatter.setMessage(messageObject);
            if (messageObject.getMentionedUsers().length) {
              mentionsTextFormatter.setCometChatUserGroupMembers(
                messageObject.getMentionedUsers()
              );
            }
            if (
              messageObject.getType() ===
                CometChatUIKitConstants.MessageTypes.text &&
              !messageObject.getDeletedAt()
            ) {
              const channelRegex = /<@all:(.*?)>/g;
              const text = messageObject.getText() as string;
              const matches = Array.from(text.matchAll(channelRegex));
              const mentionedChannels = matches.map((m) => m[1]);
              mentionsTextFormatter.setCometChatMentionedChannels(
                mentionedChannels
              );
            }
            
            mentionsTextFormatter.setLoggedInUser(
              CometChatUIKitLoginListener.getLoggedInUser()!
            );
          }
          if (mentionsTextFormatter) {
            break;
          }
        }
        if (!mentionsTextFormatter) {
          mentionsTextFormatter =
            ChatConfigurator.getDataSource().getMentionsTextFormatter({
              messageObject,
              ...config,
              alignment: null
            });
          textFormatters.push(mentionsTextFormatter);
        }
      }

      if (
        messageObject &&
        messageObject instanceof CometChat.TextMessage
      ) {
        for (let i = 0; i < textFormatters.length; i++) {
          let temp_message = textFormatters[i].getFormattedText(message, { mentionsTargetElement: MentionsTargetElement.conversation });
          if (typeof (temp_message) == "string") {
            message = temp_message;
          }
        }
      }
    }


    return message;
  }

  /**
 * Helper method to get subtitle JSX element for message preview
 * @param message - The message object
 * @param textFormatters - Text formatters to apply
 * @param _alignment - Alignment of the message bubble
 * @returns JSX element for subtitle or null
 */
getMessagePreviewSubtitle(
  message: CometChat.BaseMessage,
  textFormatters?: CometChatTextFormatter[],
  _alignment?: MessageBubbleAlignment
): JSX.Element | null {
  try {
    if (!message) return null;
    const messageType = message.getType();
    const attachments: any = (message as CometChat.MediaMessage).getAttachments?.();

    // Helper functions for creating subtitle elements
    const createSubtitleWrapper = (iconType: string, text: string, iconClass?: string) => {
      const finalIconClass = iconClass || `cometchat-message-preview__subtitle-icon-${iconType}`;
      
      return (
        <div className="cometchat-message-preview__subtitle">
          <div className={`cometchat-message-preview__subtitle-icon ${finalIconClass}`} />
          <div className="cometchat-message-preview__subtitle-text">{text}</div>
        </div>
      );
    };

    const createCallWrapper = (callType: string, direction: string, text: string, iconClass?: string) => {
      const finalIconClass = iconClass || `cometchat-message-preview__subtitle-icon-${callType}-${direction}`;
      
      return (
        <div className="cometchat-message-preview__subtitle cometchat-message-preview__subtitle-call">
          <div className={`cometchat-message-preview__subtitle-icon ${finalIconClass}`} />
          <div className="cometchat-message-preview__subtitle-text">{text}</div>
        </div>
      );
    };

    const createSimpleWrapper = (iconType: string, text: string, iconClass?: string) => {
      const finalIconClass = iconClass || `cometchat-message-preview__subtitle-icon-${iconType}`;
      
      return (
        <div className="cometchat-message-preview__subtitle">
          <div className={`cometchat-message-preview__subtitle-icon ${finalIconClass}`} />
          <div className="cometchat-message-preview__subtitle-text">{text}</div>
        </div>
      );
    };

    const createTextWrapper = (text: string) => {
      const finalTextFormatters = textFormatters || ChatConfigurator.getDataSource().getAllTextFormatters({});
      let formattedText = CometChatUIKitUtility.sanitizeText(text);
      finalTextFormatters.forEach((formatter)=>{
        formatter.setMessage(message);
        formatter.setMessageBubbleAlignment(_alignment!);
      })

      for (let i = 0; i < finalTextFormatters.length; i++) {
        (formattedText as string | void) = finalTextFormatters[i].getFormattedText(formattedText, {
            mentionsTargetElement: MentionsTargetElement.textbubble,
        });
    }  

      return (
        <div className="cometchat-message-preview__subtitle" key={message.getId()}>
          <div 
            className="cometchat-message-preview__subtitle-text"
            dangerouslySetInnerHTML={{ __html: formattedText }}
          />
        </div>
      );
    };

    // Handle deleted messages first
    if (message.getDeletedAt()) {
      return createSimpleWrapper('deleted', getLocalizedString("message_preview_deleted_message"));
    }

    // Handle different message types
    switch (messageType) {
      case CometChatUIKitConstants.MessageTypes.text:
        const messageText = (message as CometChat.TextMessage).getText();
        return createTextWrapper(messageText);

      case CometChatUIKitConstants.MessageTypes.image:
        return attachments ? createSubtitleWrapper('image', attachments[0].name, 'cometchat-message-preview__subtitle-icon-image') : null;
      
      case CometChatUIKitConstants.MessageTypes.video:
        return attachments ? createSubtitleWrapper('video', attachments[0].name, 'cometchat-message-preview__subtitle-icon-video') : null;
      
      case CometChatUIKitConstants.MessageTypes.audio:
        return attachments ? createSubtitleWrapper('audio', attachments[0].name, 'cometchat-message-preview__subtitle-icon-audio') : null;
      
      case CometChatUIKitConstants.MessageTypes.file:
        return attachments ? createSubtitleWrapper('file', attachments[0].name, 'cometchat-message-preview__subtitle-icon-file') : null;
      
      case CometChatUIKitConstants.calls.meeting:
        try {
          const customData = (message as CometChat.CustomMessage).getCustomData() as any;
          const callType = customData?.callType || 'meeting';
          const isOutgoing = message.getSender().getUid() === CometChatUIKitLoginListener.getLoggedInUser()?.getUid();
          const direction = isOutgoing ? 'outgoing' : 'incoming';
          const callText = `${isOutgoing ? 'Outgoing' : 'Incoming'} ${callType} call`;
          const iconClass = `cometchat-message-preview__subtitle-icon-meeting-${direction}-${callType}`;
          return createCallWrapper(callType, direction, callText, iconClass);
        } catch (callError) {
          return createSimpleWrapper('meeting', 'Call', 'cometchat-message-preview__subtitle-icon-meeting');
        }
      
      case PollsConstants.extension_poll:
        return createSimpleWrapper('poll', 'Poll', 'cometchat-message-preview__subtitle-icon-poll');
      
      case StickersConstants.sticker:
        return createSimpleWrapper('sticker', getLocalizedString('message_composer_sticker_hover'), 'cometchat-message-preview__subtitle-icon-sticker');
      
      case CollaborativeWhiteboardConstants.extension_whiteboard:
        return createSimpleWrapper('collaborative-whiteboard', getLocalizedString("messsage_composer_collaborative_whiteboard"), 'cometchat-message-preview__subtitle-icon-collaborative-whiteboard');
      
      case CollaborativeDocumentConstants.extension_document:
        return createSimpleWrapper('collaborative-document', getLocalizedString("messsage_composer_collaborative_document"), 'cometchat-message-preview__subtitle-icon-collaborative-document');
      
      default:
        if (message instanceof CometChat.CustomMessage) {
          return createSimpleWrapper('unsupported', message.getConversationText() || message.getType(), `cometchat-message-preview__subtitle-icon-unsupported cometchat-message-preview__subtitle-icon-${message.getType()}`);
        }
        return (
          <div className="cometchat-message-preview__subtitle">
            <div className="cometchat-message-preview__subtitle-icon cometchat-message-preview__subtitle-icon-unsupported" />
            <div className="cometchat-message-preview__subtitle-text">Unsupported message</div>
          </div>
        );
    }
  } catch (error) {
    return null;
  }
}

/**
 * Helper method to get title JSX element for message preview
 * @param message - The message object
 * @param _alignment - Alignment of the message bubble
 * @returns JSX element for subtitle or null
 */
getMessagePreviewTitle(message: CometChat.BaseMessage, _alignment?: MessageBubbleAlignment): JSX.Element | null {
    if (!message) return null;
    const isSentByMe = message.getSender().getUid() === CometChatUIKitLoginListener.getLoggedInUser()?.getUid();
    return (
      <div className={`cometchat-message-preview__title`}>
        {isSentByMe ? getLocalizedString("conversation_subtitle_you_message") : message.getSender().getName()}
      </div>
    );
}


  getAuxiliaryHeaderMenu(user?: CometChat.User, group?: CometChat.Group, additionalConfigurations?: any): Element[] | JSX.Element[] {
    return [];
  }


  /**
   * Adds styled @ for every mention in the text by matching uid
   *
   * @param {CometChat.TextMessage} message
   * @param {string} subtitle
   * @returns {void}
   */
  getMentionsFormattedText(
    message: CometChat.TextMessage,
    subtitle: string,
    mentionsFormatterParams: {
      mentionsTargetElement: MentionsTargetElement
    }
  ) {
    const userRegex = /<@uid:(.*?)>/g;
    const channelRegex = /<@all:(.*?)>/g;
    let messageText = message.getText();
    let messageTextTmp: string = subtitle;
    let userMatch = userRegex.exec(messageText);
    let channelMatch = channelRegex.exec(messageText);
    let cometChatUsers: Array<CometChat.User | CometChat.GroupMember> = [];
    let cometChatChannels: Array<string> = [];
    let mentionedUsers = message.getMentionedUsers();
    while (userMatch !== null) {
      let user;
      for (let i = 0; i < mentionedUsers.length; i++) {
        if (userMatch[1] == mentionedUsers[i].getUid()) {
          user = mentionedUsers[i];
        }
      }
      if (user) {
        cometChatUsers.push(user);
      }
      userMatch = userRegex.exec(messageText);
    }
    while (channelMatch !== null) {
      cometChatChannels.push(channelMatch[1]);
      channelMatch = channelRegex.exec(messageText);
    }

    let mentionsFormatter = this.getMentionsTextFormatter({

    });

    mentionsFormatter.setClasses(["cc-mentions"]);
    mentionsFormatter.setCometChatUserGroupMembers(cometChatUsers);
    mentionsFormatter.setCometChatMentionedChannels(cometChatChannels);

    messageTextTmp = mentionsFormatter.getFormattedText(
      messageTextTmp,
      mentionsFormatterParams
    ) as string;
    return messageTextTmp;
  }

  getAllTextFormatters(formatterParams: additionalParams): CometChatTextFormatter[] {
    let formatters = [];
    const mentionsFormatter = formatterParams.disableMentions ? null : ChatConfigurator.getDataSource().getMentionsTextFormatter(
      formatterParams
    );
    const urlTextFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter(formatterParams);
    if (mentionsFormatter) {
      formatters.push(mentionsFormatter);
    }
    if (urlTextFormatter) {
      formatters.push(urlTextFormatter);
    }
    return formatters;
  }

  getMentionsTextFormatter(params: additionalParams): CometChatMentionsFormatter {
    let mentionsTextFormatter = new CometChatMentionsFormatter();
    return mentionsTextFormatter;
  }

  getUrlTextFormatter(params: additionalParams = {}): CometChatUrlsFormatter {
    let urlTextFormatter = new CometChatUrlsFormatter([
      /((https?:\/\/|www\.)[^\s]+)/i,
    ]);
    return urlTextFormatter;
  }
  getFormMessageBubble(message: CometChat.InteractiveMessage, alignment: MessageBubbleAlignment): Element | JSX.Element {
    return this.getDeleteMessageBubble(message, getLocalizedString("message_type_not_supported"), alignment);

  }
  getSchedulerMessageBubble(message: CometChat.InteractiveMessage, alignment: MessageBubbleAlignment): Element | JSX.Element {
    return this.getDeleteMessageBubble(message, getLocalizedString("message_type_not_supported"), alignment);

  }
  getCardMessageBubble(message: CometChat.InteractiveMessage, alignment: MessageBubbleAlignment): Element | JSX.Element {
    return this.getDeleteMessageBubble(message, getLocalizedString("message_type_not_supported"), alignment);

  }
  getFormMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.form,
      category: CometChatUIKitConstants.MessageCategory.interactive,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        const formMessage: CometChat.InteractiveMessage = message as CometChat.InteractiveMessage;
        if (formMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message);
        }
        return this.getFormMessageContentView(message as CometChat.InteractiveMessage, _alignment);
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }

  getSchedulerMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.scheduler,
      category: CometChatUIKitConstants.MessageCategory.interactive,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        const schedulerMessage: CometChat.InteractiveMessage = message as CometChat.InteractiveMessage;
        if (schedulerMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message);
        }
        return this.getSchedulerMessageContentView(message as CometChat.InteractiveMessage, _alignment);
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }

  getCardMessageTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CometChatUIKitConstants.MessageTypes.card,
      category: CometChatUIKitConstants.MessageCategory.interactive,
      statusInfoView: ChatConfigurator.getDataSource().getStatusInfoView,
      replyView: ChatConfigurator.getDataSource().getReplyView,
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        const cardMessage: CometChat.InteractiveMessage = message as CometChat.InteractiveMessage;
        if (cardMessage.getDeletedAt() != null) {
          return this.getDeleteMessageBubble(message);
        }
        return this.getCardMessageContentView(message as CometChat.InteractiveMessage, _alignment);
      },
      options: ChatConfigurator.getDataSource().getMessageOptions,
      bottomView: (
        _message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        return ChatConfigurator.getDataSource().getBottomView(
          _message,
          _alignment
        );
      },
    });
  }
  getFormMessageContentView(
    message: CometChat.InteractiveMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getFormMessageBubble(
      message, _alignment);
  }
  getSchedulerMessageContentView(
    message: CometChat.InteractiveMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getSchedulerMessageBubble(
      message, _alignment);
  }

  getCardMessageContentView(
    message: CometChat.InteractiveMessage,
    _alignment: MessageBubbleAlignment,

  ): Element | JSX.Element {
    return ChatConfigurator.getDataSource().getCardMessageBubble(
      message, _alignment);
  }
}
