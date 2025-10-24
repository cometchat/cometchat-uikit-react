import { CometChat } from "@cometchat/chat-sdk-javascript";
import React from "react";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import { CollaborativeWhiteboardConfiguration } from "./CollaborativeWhiteboardConfiguration";
import WhiteboardIcon from "../../../assets/collaborative_whiteboard.svg";
import { CollaborativeWhiteboardConstants } from "./CollaborativeWhiteboardConstants";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { DocumentIconAlignment, MessageBubbleAlignment, MessageStatus } from "../../../Enums/Enums";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatMessageComposerAction, CometChatMessageTemplate } from "../../../modals";
import { CometChatDocumentBubble } from "../../BaseComponents/CometChatDocumentBubble/CometChatDocumentBubble";
import bannerImageUrlLight from "../../../assets/Collaborative_Whiteboard_Light.png"
import bannerImageUrlDark from "../../../assets/Collaborative_Whiteboard_Dark.png"
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { getThemeMode, isMessageSentByMe } from "../../../utils/util";
import { CometChatUIKit } from "../../../CometChatUIKit/CometChatUIKit";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";
/**
 * Decorator class for extending functionality related to collaborative whiteboard.
 * @extends DataSourceDecorator
 */
export class CollaborativeWhiteBoardExtensionDecorator extends DataSourceDecorator {
  /**
   * Configuration for the collaborative whiteboard extension.
   * @type {CollaborativeWhiteboardConfiguration | undefined}
   */
  public configuration?: CollaborativeWhiteboardConfiguration;

  /**
   * Data source used for fetching and managing data.
   * @type {DataSource}
   */
  public newDataSource!: DataSource;



  /**
   * The user who is currently logged in.
   */
  protected loggedInUser?: CometChat.User | null | undefined =
    CometChatUIKitLoginListener.getLoggedInUser();

  /**
   * Creates an instance of the CollaborativeWhiteBoardExtensionDecorator.
   * @param {DataSource} dataSource - The data source to be decorated.
   * @param {CollaborativeWhiteboardConfiguration} [configuration] - The configuration for the whiteboard extension.
   */
  constructor(
    dataSource: DataSource,
    configuration?: CollaborativeWhiteboardConfiguration,

  ) {
    super(dataSource);
    this.newDataSource = dataSource;
    this.configuration = configuration;
    this.loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
  }

  /**
   * Gets all message types including the whiteboard extension type.
   * @returns {string[]} Array of message types.
   */
  override getAllMessageTypes(): string[] {
    let types: string[] = super.getAllMessageTypes();
    if (
      !types.some(
        (type) => type === CollaborativeWhiteboardConstants.extension_whiteboard
      )
    ) {
      types.push(CollaborativeWhiteboardConstants.extension_whiteboard);
    }
    return types;
  }

  override getId(): string {
    return "collaborativewhiteboard";
  }

  /**
   * Gets the unique identifier for the collaborative whiteboard extension.
   * @returns {string} The extension ID.
   */
  override getAllMessageCategories(additionalConfigurations?: Object | undefined): string[] {
    const categories = super.getAllMessageCategories(additionalConfigurations);
    if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
      categories.push(CometChatUIKitConstants.MessageCategory.custom);
    }
    return categories;
  }

  /**
   * Checks if a message template of a given type exists.
   * @param {CometChatMessageTemplate[]} template - Array of message templates.
   * @param {string} type - Type of the template to check.
   * @returns {boolean} True if the template exists, otherwise false.
   */
  checkIfTemplateExist(
    template: CometChatMessageTemplate[],
    type: string
  ): boolean {
    return template.some((obj) => obj.type === type);
  }

  /**
   * Gets all message templates, including the whiteboard template if not already present.
   * @param {any} [additionalConfigurations] - Additional configurations.
   * @returns {CometChatMessageTemplate[]} Array of message templates.
   */
  override getAllMessageTemplates(
    additionalConfigurations?: any
  ): CometChatMessageTemplate[] {
    const templates = super.getAllMessageTemplates(
      additionalConfigurations
    );
    if (
      !this.checkIfTemplateExist(
        templates,
        CollaborativeWhiteboardConstants.extension_whiteboard
      )
    ) {
      templates.push(this.getWhiteBoardTemplate());
    }
    return templates;
  }

  /**
   * Creates the whiteboard message template.
   * @returns {CometChatMessageTemplate} The whiteboard message template.
   */
  getWhiteBoardTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CollaborativeWhiteboardConstants.extension_whiteboard,
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
        let whiteboardMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        if (whiteboardMessage.getDeletedAt()) {
          return super.getDeleteMessageBubble(whiteboardMessage,undefined,_alignment);
        }
        return this.getWhiteboardContentView(whiteboardMessage,_alignment);
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
        message: CometChat.BaseMessage,
        alignment: MessageBubbleAlignment
      ) => {
        return super.getBottomView(message, alignment);
      },
    });
  }

  /**
   * Generates the content view for the whiteboard message.
   * @param {CometChat.CustomMessage} whiteboardMessage - The whiteboard message.
   * @returns {JSX.Element} The content view for the whiteboard message.
   */
  getWhiteboardContentView(
    whiteboardMessage: CometChat.CustomMessage,alignment?: MessageBubbleAlignment) {
    let documentBubbleAlignment: DocumentIconAlignment =
      DocumentIconAlignment.right;
    const whiteboardURL = this.getWhiteboardDocument(whiteboardMessage);
    const whiteboardTitle = getLocalizedString("message_list_collaborative_whiteboard_title");
    const whiteboardButtonText = getLocalizedString("messag_list_collaborative_whiteboard_open");
    const whiteboardSubitle = getLocalizedString("message_collaborative_whiteboard_subtitile");
    const isSentByMe = isMessageSentByMe(whiteboardMessage, this.loggedInUser!)
    const isDarkMode = getThemeMode() == "dark" ? true : false;
    const bannerImage = !isDarkMode ? bannerImageUrlLight : bannerImageUrlDark


    return (
      <div className="cometchat-collaborative-whiteboard">
      <CometChatDocumentBubble
        title={whiteboardTitle}
        URL={whiteboardURL}
        subtitle={whiteboardSubitle}
        buttonText={whiteboardButtonText}
        onClicked={this.launchCollaborativeWhiteboardDocument}
        bannerImage={bannerImage}
        isSentByMe={alignment == MessageBubbleAlignment.right}

      />
      </div>
          );
  }

  /**
   * Opens the collaborative whiteboard document in a new fullscreen window.
   * @param {string} whiteboardURL - The URL of the whiteboard document.
   */
  launchCollaborativeWhiteboardDocument(whiteboardURL: string) {
    const username = CometChatUIKitLoginListener.getLoggedInUser()?.getName();
    window.open(`${whiteboardURL}&username=${username}`, "", "fullscreen=yes, scrollbars=auto");
  }

  /**
   * Retrieves the URL of the whiteboard document from the message data.
   * @param {CometChat.CustomMessage} message - The message containing whiteboard data.
   * @returns {string | undefined} The URL of the whiteboard document.
   */
  getWhiteboardDocument(message: CometChat.CustomMessage) {
    try {
      if (message?.getData()) {
        const data: any = message.getData();
        if (data?.metadata) {
          const metadata = data?.metadata;
          if (
            CometChatUIKitUtility.checkHasOwnProperty(metadata, "@injected")
          ) {
            const injectedObject = metadata["@injected"];
            if (injectedObject?.extensions) {
              const extensionObject = injectedObject.extensions;
              return extensionObject[
                CollaborativeWhiteboardConstants.whiteboard
              ]
                ? extensionObject[CollaborativeWhiteboardConstants.whiteboard]
                  .board_url
                : extensionObject[CollaborativeWhiteboardConstants.whiteboard]
                  .document_url;
            }
          }
        }
      }
    } catch (error: any) {
      console.log("error in getting whiteboard details", error);
    }
  }

  /**
   * Overrides the method to get attachment options for the message composer.
   * Adds an option for a collaborative whiteboard if the parent message ID is not present.
   *
   * @param {any} id - The ID object containing user or group information.
   * @returns {CometChatMessageComposerAction[]} An array of message composer actions.
   */
  override getAttachmentOptions(id: any,additionalConfigurations?:any) {
    if (!id?.parentMessageId && !additionalConfigurations?.hideCollaborativeWhiteboardOption) {
      let replyToMessageRef = additionalConfigurations.messageToReplyRef;
      const replyToMessage: CometChat.BaseMessage | undefined =replyToMessageRef ? replyToMessageRef.current : null;
      let isUser = id?.user ? true : false;
      let receiverType: string = isUser
        ? CometChatUIKitConstants.MessageReceiverType.user
        : CometChatUIKitConstants.MessageReceiverType.group;
      let receiverId: string | undefined = isUser ? id.user : id.group;
      const messageComposerActions: CometChatMessageComposerAction[] =
        super.getAttachmentOptions(id,additionalConfigurations);
      let newAction: CometChatMessageComposerAction =
        new CometChatMessageComposerAction({
          id: CollaborativeWhiteboardConstants.whiteboard,
          title: getLocalizedString("messsage_composer_collaborative_whiteboard"),
          iconURL: this.configuration?.getOptionIconURL()
            ? this.configuration?.getOptionIconURL()
            : WhiteboardIcon,
          onClick: () => {
            const payload: any = {
              receiver: receiverId,
              receiverType: receiverType,
            };

            if (replyToMessage) {
              payload.quotedMessageId = replyToMessage.getId();
            }
            if(additionalConfigurations.closeReplyPreview){
              additionalConfigurations.closeReplyPreview();
            }
            CometChat.callExtension(
              CollaborativeWhiteboardConstants.whiteboard,
              CollaborativeWhiteboardConstants.post,
              CollaborativeWhiteboardConstants.v1_create,
              payload
            ).then(
              (res: any) => { 
                if(replyToMessageRef){
                  CometChatMessageEvents.ccReplyToMessage.next({message: replyToMessageRef.current, status: MessageStatus.success});
                }
              },
              (error: any) => {
                console.log("error in sending whiteboard", error);
              }
            );
          },
        });
      messageComposerActions.push(newAction);
      return messageComposerActions;
    } else {
      return super.getAttachmentOptions(id,additionalConfigurations);
    }
  }

  /**
  * Overrides the method to get the last message from a conversation.
  * Checks if the last message is related to the collaborative whiteboard extension
  * and returns a custom message if it matches.
  * @param {CometChat.Conversation} conversation - The conversation object from which to get the last message.
  * @param {CometChat.User} loggedInUser - The currently logged-in user.
  * @param {any} additionalConfigurations - Additional configurations if any.
  * @returns {string} A string representing the last conversation message.
  */
  override getLastConversationMessage(
    conversation: CometChat.Conversation,
    loggedInUser: CometChat.User,
    additionalConfigurations: any
  ): string {
    const message: CometChat.BaseMessage | undefined =
      conversation.getLastMessage();
    if (
      message != null &&
      message.getType() ===
      CollaborativeWhiteboardConstants.extension_whiteboard &&
      message.getCategory() === CometChatUIKitConstants.MessageCategory.custom
    ) {
      return getLocalizedString("conversation_subtitle_collaborative_whiteboard");
    } else {
      return super.getLastConversationMessage(
        conversation,
        loggedInUser,
        additionalConfigurations
      );
    }
  }
}
