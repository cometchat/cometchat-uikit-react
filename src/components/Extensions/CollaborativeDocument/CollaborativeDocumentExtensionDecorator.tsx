import { CometChat } from "@cometchat/chat-sdk-javascript";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import { CollaborativeDocumentConfiguration } from "./CollaborativeDocumentConfiguration";
import DocumentIcon from "../../../assets/collabrative_document.svg";
import { CollaborativeDocumentConstants } from "./CollaborativeDocumentConstants";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { MessageBubbleAlignment, MessageStatus } from "../../../Enums/Enums";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatMessageComposerAction, CometChatMessageTemplate } from "../../../modals";
import { CometChatDocumentBubble } from "../../BaseComponents/CometChatDocumentBubble/CometChatDocumentBubble";
import bannerImageUrlLight from "../../../assets/Collaborative_Document_Light.png";
import bannerImageUrlDark from "../../../assets/Collaborative_Document_Dark.png";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { getThemeMode, isMessageSentByMe } from "../../../utils/util";
import { CometChatUIKit } from "../../../CometChatUIKit/CometChatUIKit";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";



/**
 * The `CollaborativeDocumentExtensionDecorator` class extends `DataSourceDecorator`
 * to provide additional features and customizations for the collaborative document extension.
 * It integrates with the CometChat UIKit to enable document collaboration in chat.
 */
export class CollaborativeDocumentExtensionDecorator extends DataSourceDecorator {

  /**
  * The configuration for the collaborative document extension.
  * This configuration object allows customizing the appearance and behavior
  * of the document collaboration features.
  *
  * @type {CollaborativeDocumentConfiguration | undefined}
  */
  public configuration?: CollaborativeDocumentConfiguration;

  /**
   * The new data source object.
   * This is used to manage and manipulate the data for the collaborative document extension.
   *
   * @type {DataSource}
   */
  public newDataSource!: DataSource;



  /**
  * The user who is currently logged in.
  */
  protected loggedInUser?: CometChat.User | null | undefined =
    CometChatUIKitLoginListener.getLoggedInUser();

  /**
   * Creates an instance of `CollaborativeDocumentExtensionDecorator`.
   *
   * @param {DataSource} dataSource - The data source object to be decorated.
   * @param {CollaborativeDocumentConfiguration} [configuration] - An optional configuration object for the extension.
   */
  constructor(
    dataSource: DataSource,
    configuration?: CollaborativeDocumentConfiguration
  ) {
    super(dataSource);
    this.newDataSource = dataSource;
    this.configuration = configuration!;
    this.loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
  }

  /**
  * Retrieves all message types supported by the extension, including custom document messages.
  *
  * @returns {string[]} An array of message types.
  * @override
  */
  override getAllMessageTypes(): string[] {
    const types = super.getAllMessageTypes();
    if (!types.includes(CollaborativeDocumentConstants.extension_document)) {
      types.push(CollaborativeDocumentConstants.extension_document);
    }
    return types;
  }

  /**
  * Retrieves the unique ID of the collaborative document extension.
  *
  * @returns {string} The unique ID for the extension.
  * @override
  */
  override getId(): string {
    return "collaborativedocument";
  }

  /**
   * Retrieves all message categories supported by the extension, including custom categories.
   *
   * @returns {string[]} An array of message categories.
   * @override
   */
  override getAllMessageCategories(additionalConfigurations?: Object | undefined): string[] {
    const categories = super.getAllMessageCategories(additionalConfigurations);
    if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
      categories.push(CometChatUIKitConstants.MessageCategory.custom);
    }
    return categories;
  }

  /**
   * Checks if a message template with the specified type already exists.
   *
   * @param {CometChatMessageTemplate[]} template - An array of message templates.
   * @param {string} type - The message type to check for.
   * @returns {boolean} `true` if the template exists, otherwise `false`.
   */
  checkIfTemplateExist(
    template: CometChatMessageTemplate[],
    type: string
  ): boolean {
    return template.some((obj) => obj.type === type);
  }

  /**
   * Retrieves all message templates, including the custom document template.
   *
   * @param {any} [additionalConfigurations] - Additional configurations for the templates.
   * @returns {CometChatMessageTemplate[]} An array of message templates.
   * @override
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
        CollaborativeDocumentConstants.extension_document
      )
    ) {
      templates.push(this.getDocumentTemplate());
    }
    return templates;
  }

  /**
   * Creates a custom message template for the collaborative document extension.
   *
   * @returns {CometChatMessageTemplate} A message template for the document extension.
   */
  getDocumentTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: CollaborativeDocumentConstants.extension_document,
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
        let documentMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        if (documentMessage.getDeletedAt()) {
          return super.getDeleteMessageBubble(documentMessage, undefined, _alignment);
        }
        return this.getDocumentContentView(documentMessage, _alignment);
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
   * Retrieves the content view for the document message bubble.
   *
   * @param {CometChat.CustomMessage} documentMessage - The document message to display.
   * @returns {JSX.Element} The document content view component.
   */
  getDocumentContentView(
    documentMessage: CometChat.CustomMessage, alignment?: MessageBubbleAlignment) {
    const documentURL = this.getDocumentURL(documentMessage);
    const documentTitle = getLocalizedString("message_list_collaborative_document_title");
    const documentButtonText = getLocalizedString("message_list_collaborative_document_open");
    const documentSubitle = getLocalizedString("message_list_collaborative_document_subtitile");
    const isSentByMe = isMessageSentByMe(documentMessage, this.loggedInUser!)

    const isDarkMode = getThemeMode() == "dark" ? true : false;
    const bannerImage = !isDarkMode ? bannerImageUrlLight : bannerImageUrlDark;
    return (
      <div className="cometchat-collaborative-document">
        <CometChatDocumentBubble
          title={documentTitle}
          URL={documentURL}
          subtitle={documentSubitle}
          buttonText={documentButtonText}
          onClicked={this.launchCollaborativeDocument}
          bannerImage={bannerImage}
          isSentByMe={alignment == MessageBubbleAlignment.right}
        />
      </div>
    );
  }

  /**
  * Launches the collaborative document in a new fullscreen window.
  *
  * @param {string} documentURL - The URL of the document to open.
  */
  launchCollaborativeDocument(documentURL: string) {
    window.open(documentURL, "", "fullscreen=yes, scrollbars=auto");
  }

  /**
   * Retrieves the URL for a collaborative document or board from a custom message.
   *
   * @param {CometChat.CustomMessage} message - The custom message containing the document or board data.
   * @returns {string | undefined} The URL of the document or board, or undefined if not found.
   */
  getDocumentURL(message: CometChat.CustomMessage) {
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
              return extensionObject[CollaborativeDocumentConstants.document]
                ? extensionObject[CollaborativeDocumentConstants.document]
                  .document_url
                : extensionObject[CollaborativeDocumentConstants.document]
                  .board_url;
            }
          }
        }
      }
    } catch (error: any) {
      console.log("error in fetching document url", error);
    }
  }

  /**
   * Overrides the attachment options to include a new action for creating a collaborative document.
   *
   * @param {any} id - The identifier object containing user or group information.
   * @returns {CometChatMessageComposerAction[]} The list of attachment options including the new document action.
   */
  override getAttachmentOptions(id: any, additionalConfigurations?: any) {
    if (!id?.parentMessageId && !additionalConfigurations?.hideCollaborativeDocumentOption) {
      let replyToMessageRef = additionalConfigurations.messageToReplyRef;
      const replyToMessage: CometChat.BaseMessage | undefined =replyToMessageRef ? replyToMessageRef.current : null;
      let isUser = id?.user ? true : false;
      let receiverType: string = isUser
        ? CometChatUIKitConstants.MessageReceiverType.user
        : CometChatUIKitConstants.MessageReceiverType.group;
      let receiverId: string | undefined = isUser ? id.user : id.group;
      const messageComposerActions: CometChatMessageComposerAction[] =
        super.getAttachmentOptions(id, additionalConfigurations);
      let newAction: CometChatMessageComposerAction =
        new CometChatMessageComposerAction({
          id: CollaborativeDocumentConstants.document,
          title: getLocalizedString("messsage_composer_collaborative_document"),
          iconURL: this.configuration?.getOptionIconURL()
            ? this.configuration?.getOptionIconURL()
            : DocumentIcon,
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
            CometChat.callExtension(CollaborativeDocumentConstants.document, CollaborativeDocumentConstants.post, CollaborativeDocumentConstants.v1_create, payload).then(
              (res: any) => {
                if(replyToMessageRef){
                  CometChatMessageEvents.ccReplyToMessage.next({message: replyToMessageRef.current, status: MessageStatus.success});
                }
              },
              (error: any) => { }
            );
          },
        });
      messageComposerActions.push(newAction);
      return messageComposerActions;
    } else {
      return super.getAttachmentOptions(id, additionalConfigurations);
    }
  }

  /**
   * Retrieves the last message from a conversation, checking if it's a collaborative document.
   *
   * @param {CometChat.Conversation} conversation - The conversation object containing the last message.
   * @param {CometChat.User} loggedInUser - The currently logged-in user.
   * @param {any} [additionalConfigurations] - Optional additional configurations for the message retrieval.
   * @returns {string} A string representing the last message, or a custom message if it's a collaborative document.
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
      message.getType() === CollaborativeDocumentConstants.extension_document &&
      message.getCategory() === CometChatUIKitConstants.MessageCategory.custom
    ) {
      return getLocalizedString("conversation_subtitle_collaborative_document");
    } else {
      return super.getLastConversationMessage(
        conversation,
        loggedInUser,
        additionalConfigurations
      );
    }
  }
}