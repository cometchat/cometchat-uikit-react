import { CometChat } from "@cometchat/chat-sdk-javascript";
import React, { useState } from "react";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import StickerIcon from "../../../assets/sticker.svg";
import StickerIconFill from "../../../assets/sticker_fill.svg";
import CloseIcon from "../../../assets/close.svg";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { StickersConstants } from "./StickersConstants";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { StickersKeyboard } from "./StickersKeyboard";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { MessageBubbleAlignment, MessageStatus, Placement } from "../../../Enums/Enums";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CometChatPopover } from "../../BaseComponents/CometChatPopover/CometChatPopover";
import { CometChatButton } from "../../BaseComponents/CometChatButton/CometChatButton";
import { CometChatImageBubble } from "../../BaseComponents/CometChatImageBubble/CometChatImageBubble";
import { ComposerId } from "../../../utils/MessagesDataSource";
import { CometChatMessageTemplate } from "../../../modals";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";
import { CometChatUIEvents } from "../../../events/CometChatUIEvents";

/**
 * Class responsible for decorating the data source with sticker-related functionalities.
 * Extends the DataSourceDecorator to add custom message templates, auxiliary options, and sticker-specific logic.
 */
export class StickersExtensionDecorator extends DataSourceDecorator {
  /**
  * New data source for the extension.
  */

  public newDataSource!: DataSource;

  /**
   * Flag to show or hide the sticker keyboard.
   * @default false
   */
  public showStickerKeyboard: boolean = false;

  /**
   * Constructs a new instance of StickersExtensionDecorator.
   * @param dataSource - The data source to be decorated.
   * @param configuration - Optional configuration for the stickers extension.
   */
  constructor(dataSource: DataSource) {
    super(dataSource);
    this.newDataSource = dataSource;
  }

  /**
   * Gets the decorated data source.
   * @returns The decorated data source.
   */
  getDataSource() {
    return this.newDataSource;
  }

  /**
   * Retrieves all message templates, including the sticker template if it doesn't already exist.
   * @param additionalConfigurations - Additional configurations, if any.
   * @returns An array of CometChatMessageTemplate objects.
   */
  override getAllMessageTemplates(
    additionalConfigurations?: any
  ): CometChatMessageTemplate[] {
    let template: CometChatMessageTemplate[] = super.getAllMessageTemplates(
      additionalConfigurations
    );
    if (!this.checkIfTemplateExist(template, StickersConstants.sticker)) {
      template.push(this.getStickerTemplate());
      return template;
    }
    return template;
  }

  /**
   * Retrieves auxiliary options for the stickers extension.
   * @param id - A map containing relevant IDs.
   * @param theme - The theme object for styling.
   * @param user - Optional user object.
   * @param group - Optional group object.
   * @returns An array of auxiliary options.
   */
  override getStickerButton(
    id: ComposerId,
    user?: CometChat.User,
    group?: CometChat.Group,
    messageToReply?: CometChat.BaseMessage | null,
    closeReplyPreview?: () => void,
  ) {
    return this.getStickerAuxiliaryButton(id, user, group, messageToReply, closeReplyPreview);
  }

  /**
   * Creates the sticker auxiliary button component.
   * @param id - A map containing relevant IDs.
   * @param theme - The theme object for styling.
   * @param user - Optional user object.
   * @param group - Optional group object.
   * @returns The JSX element for the sticker auxiliary button.
   */
  getStickerAuxiliaryButton = (
    id: ComposerId,
    user?: CometChat.User,
    group?: CometChat.Group,
    messageToReply?: CometChat.BaseMessage | null,
    onReplyPreviewClose?: () => void
  ) => {
    const stickerKeyboardRef = React.createRef<{
      openPopover: () => void;
      closePopover: () => void;
    }>();

    // Use state to track whether the keyboard is open or not
    const [showKeyboard, setShowKeyboard] = useState(false);
    var activePopoverSub: any = null;
    const closeSticker = () => {
      if (stickerKeyboardRef) {
        stickerKeyboardRef?.current?.closePopover()
      }
      setShowKeyboard(false)
      if (activePopoverSub) {
        activePopoverSub.unsubscribe();

      }
    }
    if (showKeyboard) {
      activePopoverSub = CometChatUIEvents.ccActivePopover.subscribe((id: string) => {
        if (id != StickersConstants.sticker) {
          closeSticker()
        }
      })
    }

    let openIconURL = StickerIcon;
    let closeIconURL = StickerIconFill;



    return (
      <div className={`cometchat-message-composer__auxilary-button-view-sticker-button ${showKeyboard ? "cometchat-message-composer__auxilary-button-view-sticker-button-active" : ""}`}>
        <CometChatPopover
          useParentContainer={true}
          useParentHeight={false}
          ref={stickerKeyboardRef}
          placement={Placement.top}
          closeOnOutsideClick={true}
          onOutsideClick={() => setShowKeyboard(false)}
          showOnHover={false}
          debounceOnHover={0}
          content={
            <StickersKeyboard
              ccStickerClicked={(e: any) => this.sendSticker(e, closeSticker,id, messageToReply, onReplyPreviewClose)}
            />
          }
        >
          <CometChatButton
            hoverText={getLocalizedString("message_composer_sticker_hover")}
            // Change the icon based on the state of showKeyboard
            iconURL={!showKeyboard ? openIconURL : closeIconURL}
            onClick={() => {
              CometChatUIEvents.ccActivePopover.next(StickersConstants.sticker)
              // Toggle the showKeyboard state
              setShowKeyboard((prev) => !prev);
            }}
          />
        </CometChatPopover>
      </div>
    );
  };

  /**
   * Sends a sticker message.
   * @param event - The event object containing sticker details.
   */
  sendSticker(event: any, closeSticker: Function,id:ComposerId, messageToReply?: CometChat.BaseMessage | null, onReplyPreviewClose?: () => void) {
    try {
      closeSticker();
      if(onReplyPreviewClose){
        onReplyPreviewClose();
      }
      if(!id.group && !id.user) return;
      let details = event?.detail;
      let sticker = {
        name: details?.stickerName,
        URL: details?.stickerURL,
      };
      const receiverId: string | undefined = id.user || id.group!;
      const receiverType: string = id.user
        ? CometChatUIKitConstants.MessageReceiverType.user
        : CometChatUIKitConstants.MessageReceiverType.group;
      const { parentMessageId } = id;

      const customData = {
        sticker_url: sticker.URL,
        sticker_name: sticker.name,
      };

      const customType = StickersConstants.sticker;

      const customMessage: CometChat.CustomMessage =
        new CometChat.CustomMessage(
          receiverId,
          receiverType,
          customType,
          customData
        );

      if (parentMessageId) {
        customMessage.setParentMessageId(parentMessageId);
      }
      
      customMessage.setMetadata({ incrementUnreadCount: true });
      customMessage.shouldUpdateConversation(true);
      (customMessage as any).setSentAt(
        CometChatUIKitUtility.getUnixTimestamp()
      );

      customMessage.setMuid(CometChatUIKitUtility.ID());

      CometChatMessageEvents.ccMessageSent.next({
        message: customMessage,
        status: MessageStatus.inprogress,
      });

      if(messageToReply){
        customMessage.setQuotedMessage(messageToReply);
        customMessage.setQuotedMessageId(messageToReply.getId());
      }
      CometChat.sendCustomMessage(customMessage).then(
        (message) => {
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.success,
          });
          if(messageToReply){
            CometChatMessageEvents.ccReplyToMessage.next({
              message: messageToReply,
              status:MessageStatus.success
            });     
          }
        },
        (error) => {
          customMessage.setMetadata({ error: true });
          CometChatMessageEvents.ccMessageSent.next({
            message: customMessage,
            status: MessageStatus.error,
          });
        }
      );
    } catch (error: any) {
      console.log("error in sending sticker", error);
    }
  }

  /**
   * Sends a sticker message.
   * @param event - The event object containing sticker details.
   */
  getSticker(message: CometChat.CustomMessage) {
    let stickerData: any;
    if (
      CometChatUIKitUtility.checkHasOwnProperty(
        message,
        StickersConstants.data
      ) &&
      CometChatUIKitUtility.checkHasOwnProperty(
        (message as CometChat.CustomMessage).getData(),
        StickersConstants.custom_data
      )
    ) {
      stickerData = message.getCustomData();
      if (
        CometChatUIKitUtility.checkHasOwnProperty(
          stickerData,
          StickersConstants.sticker_url
        )
      ) {
        return stickerData?.sticker_url;
      } else {
        return "";
      }
    } else {
      return "";
    }
  }

  /**
   * Creates a JSX element for displaying the sticker message content.
   * @param stickerMessage - The custom message containing sticker data.
   * @param _theme - The theme object for styling.
   * @returns The JSX element for the sticker message content.
   */
  getStickerMessageContentView(
    stickerMessage: CometChat.CustomMessage) {
    let isSentByMe = !stickerMessage.getSender() || stickerMessage.getSender().getUid() == CometChatUIKitLoginListener.getLoggedInUser()?.getUid();
    return (
      <CometChatImageBubble
        src={this.getSticker(stickerMessage)}
        isSentByMe={isSentByMe}
        disableLoadingState={true}
      />
    );
  }

  /**
   * Creates a sticker message template.
   * @param _theme - The theme object for styling.
   * @returns The sticker message template.
   */
  getStickerTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: StickersConstants.sticker,
      category: CometChatUIKitConstants.MessageCategory.custom,
      statusInfoView: super.getStatusInfoView,
      replyView: (
        message: CometChat.BaseMessage,
        _alignment?: MessageBubbleAlignment,
        onReplyViewClicked?:(messageToReply: CometChat.BaseMessage) => void
      ) => {
        let documentMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        return ChatConfigurator.getDataSource().getReplyView(documentMessage, _alignment, onReplyViewClicked);
      },
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let stickerMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        if (stickerMessage.getDeletedAt()) {
          return super.getDeleteMessageBubble(stickerMessage, undefined, _alignment);
        }
        return this.getStickerMessageContentView(stickerMessage);
      },
      options: (
        loggedInUser: CometChat.User,
        messageObject: CometChat.BaseMessage,
        group?: CometChat.Group,
        additionalParams?: Object | undefined
      ) => {
        return super.getCommonOptions(
          loggedInUser,
          messageObject,
          group,
          additionalParams
        );
      },
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

  /**
   * Checks if a specific message template already exists.
   * @param template - An array of message templates.
   * @param type - The type of message template to check for.
   * @returns True if the template exists, false otherwise.
   */
  checkIfTemplateExist(
    template: CometChatMessageTemplate[],
    type: string
  ): boolean {
    return template.some((obj) => obj.type === type);
  }

  /**
   * Retrieves all message categories, including custom categories.
   * @returns An array of message categories.
   */
  override getAllMessageCategories(additionalConfigurations?: Object | undefined): string[] {
    let categories: string[] = super.getAllMessageCategories(additionalConfigurations);
    if (
      !categories.some(
        (category) =>
          category === CometChatUIKitConstants.MessageCategory.custom
      )
    ) {
      categories.push(CometChatUIKitConstants.MessageCategory.custom);
    }
    return categories;
  }

  /**
   * Retrieves all message types, including sticker types.
   * @returns An array of message types.
   */
  override getAllMessageTypes(): string[] {
    let types: string[] = super.getAllMessageTypes();
    if (!types.some((type) => type === StickersConstants.sticker)) {
      types.push(StickersConstants.sticker);
    }
    return types;
  }

  /**
   * Retrieves the ID of the sticker extension.
   * @returns The ID string.
   */
  override getId(): string {
    return "stickers";
  }

  /**
   * Retrieves the last message in a conversation, checking for sticker messages.
   * @param conversation - The conversation object.
   * @param loggedInUser - The logged-in user.
   * @param additionalConfigurations - Additional configurations, if any.
   * @returns A string representing the last message.
   */
  override getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser: CometChat.User,
    additionalConfigurations?: any
  ): string {
    const message: CometChat.BaseMessage | undefined =
      conversation.getLastMessage();
    if (
      message != null &&
      message.getType() === StickersConstants.sticker &&
      message.getCategory() === CometChatUIKitConstants.MessageCategory.custom
    ) {
      return getLocalizedString("conversation_subtitle_sticker");
    } else {
      return super.getLastConversationMessage(
        conversation,
        loggedInUser,
        additionalConfigurations
      );
    }
  }
}
