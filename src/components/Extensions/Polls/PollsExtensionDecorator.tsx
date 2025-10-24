import { CometChat } from "@cometchat/chat-sdk-javascript";
import React from "react";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import { DataSource } from "../../../utils/DataSource";
import { PollsConfiguration } from "./PollsConfiguration";
import PollsIcon from "../../../assets/poll.svg";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { PollsConstants } from "./PollsConstants";
import { PollsBubble } from "./PollsBubble";
import { CreatePoll } from "./CreatePolls";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { MessageBubbleAlignment } from "../../../Enums/Enums";
import { CometChatMessageComposerAction, CometChatMessageTemplate } from "../../../modals";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatUIEvents } from "../../../events/CometChatUIEvents";
import { ComposerId } from "../../../utils/MessagesDataSource";

/**
 * The PollsExtensionDecorator class extends the DataSourceDecorator to
 * handle custom poll messages in the CometChat UI.
 */
export class PollsExtensionDecorator extends DataSourceDecorator {


  /** The currently logged-in user. */
  private loggedInUser: CometChat.User | null = null;

  /** Configuration for the polls extension. */
  public configuration?: PollsConfiguration;

  /** The data source used by this decorator. */
  public newDataSource!: DataSource;

  /** The message that is being replied to. */
  public replyToMessage:CometChat.BaseMessage | undefined;
  /**
   * Constructs a PollsExtensionDecorator instance.
   * @param dataSource - The data source to decorate.
   * @param configuration - Optional configuration for the polls extension.
   */
  constructor(dataSource: DataSource, configuration?: PollsConfiguration) {
    super(dataSource);
    this.getLoggedInUser();
    this.newDataSource = dataSource;
    this.configuration = configuration;
  }

  /**
   * Fetches the currently logged-in user.
   */
  async getLoggedInUser() {
    this.loggedInUser = await CometChat.getLoggedinUser();
  }

  /**
   * Gets the unique ID of this decorator.
   * @returns The ID of the decorator.
   */
  override getId(): string {
    return "polls";
  }

  /**
   * Retrieves all message types, including the poll message type if not already present.
   * @returns An array of message types.
   */
  override getAllMessageTypes(): string[] {
    const types = super.getAllMessageTypes();
    if (!types.includes(PollsConstants.extension_poll)) {
      types.push(PollsConstants.extension_poll);
    }
    return types;
  }

  /**
  * Retrieves all message categories, including the custom message category if not already present.
  * @returns An array of message categories.
  */
  override getAllMessageCategories(additionalConfigurations?: Object | undefined): string[] {
    const categories = super.getAllMessageCategories(additionalConfigurations);
    if (!categories.includes(CometChatUIKitConstants.MessageCategory.custom)) {
      categories.push(CometChatUIKitConstants.MessageCategory.custom);
    }
    return categories;
  }

  /**
  * Checks if a template of a specific type exists.
  * @param template - The array of message templates.
  * @param type - The type of the template to check.
  * @returns True if the template exists, false otherwise.
  */
  checkIfTemplateExist(
    template: CometChatMessageTemplate[],
    type: string
  ): boolean {
    return template.some((obj) => obj.type === type);
  }

  /**
   * Retrieves all message templates, including the polls template if not already present.
   * @param _theme - Optional theme to apply.
   * @param additionalConfigurations - Optional additional configurations.
   * @returns An array of message templates.
   */
  override getAllMessageTemplates(
    additionalConfigurations?: any
  ): CometChatMessageTemplate[] {
    const templates = super.getAllMessageTemplates(
      additionalConfigurations
    );
    if (!this.checkIfTemplateExist(templates, PollsConstants.extension_poll)) {
      templates.push(this.getPollsTemplate());
    }
    return templates;
  }

  /**
  * Creates a template for poll messages.
  * @param _theme - The theme to apply to the template.
  * @returns A CometChatMessageTemplate for polls.
  */
  getPollsTemplate(): CometChatMessageTemplate {
    return new CometChatMessageTemplate({
      type: PollsConstants.extension_poll,
      category: CometChatUIKitConstants.MessageCategory.custom,
      statusInfoView: super.getStatusInfoView,
      replyView: (
        message: CometChat.BaseMessage,
        _alignment?: MessageBubbleAlignment,
        onReplyViewClicked?:(messageToReply: CometChat.BaseMessage) => void
      ) => {
        let documentMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        return ChatConfigurator.getDataSource().getReplyView(documentMessage, _alignment,onReplyViewClicked);
      },
      contentView: (
        message: CometChat.BaseMessage,
        _alignment: MessageBubbleAlignment
      ) => {
        let pollsMessage: CometChat.CustomMessage =
          message as CometChat.CustomMessage;
        if (pollsMessage.getDeletedAt()) {
          return super.getDeleteMessageBubble(pollsMessage,undefined,_alignment);
        }
        return this.getPollsContentView(pollsMessage,_alignment);
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
    * Generates the content view for a poll message.
    * @param message - The poll message.
    * @param _theme - The theme to apply.
    * @returns The content view for the poll message.
    */
  getPollsContentView(
    message: CometChat.CustomMessage,alignment?: MessageBubbleAlignment) {
    return (
      <PollsBubble
        pollQuestion={this.getPollBubbleData(message, "question")}
        pollId={this.getPollBubbleData(message, "id")}
        senderUid={this.getPollBubbleData(message)}
        loggedInUser={this.loggedInUser ?? undefined}
        metadata={message?.getMetadata()}
        alignment={alignment}
      />
    );
  }

  /**
   * Retrieves specific data from a poll message.
   * @param message - The poll message.
   * @param key - The key to retrieve data for.
   * @returns The requested data or the sender's UID if no key is specified.
   */
  getPollBubbleData(message: CometChat.CustomMessage, key?: string) {
    let data: any = message.getCustomData();
    if (key) {
      if (key === "options") {
        return Object.values(data[key]);
      } else {
        return data[key];
      }
    } else {
      return message.getSender().getUid();
    }
  }

  /**
   * Retrieves the attachment options for the poll extension.
   * @param theme - The theme to apply.
   * @param id - The ID for the attachment options.
   * @returns An array of message composer actions.
   */
  override getAttachmentOptions(id: any,additionalConfigurations?:any) {
    if (!id?.parentMessageId && !additionalConfigurations?.hidePollsOption) {
      let replyToMessageRef = additionalConfigurations.messageToReplyRef;
      const replyToMessage: CometChat.BaseMessage | undefined =replyToMessageRef ? replyToMessageRef.current : null;
      this.replyToMessage = replyToMessage;
      const messageComposerActions: CometChatMessageComposerAction[] =
        super.getAttachmentOptions(id,additionalConfigurations);
      let newAction: CometChatMessageComposerAction =
        new CometChatMessageComposerAction({
          id: PollsConstants.extension_poll,
          title: getLocalizedString("message_composer_polls"),
          iconURL: this.configuration?.getOptionIconURL()
            ? this.configuration?.getOptionIconURL()
            : PollsIcon,
          onClick: (...args) => {
            this.onPollsButtonClicked(...args);
          },
        });
      messageComposerActions.push(newAction);
      return messageComposerActions;
    } else {
      return super.getAttachmentOptions(id,additionalConfigurations);
    }
  }

  /**
   * Handles the click event for the polls button in the message composer.
   * Opens the poll creation modal with pre-defined styles.
   * 
   * @param theme - The current theme settings for the application.
   * @param args - Additional arguments passed during the button click.
   */
  onPollsButtonClicked(...args: any[]) {
    const [data] = args;
    let user = data[0];
    let group = data[1];
    let uid = user ? user.getUid() : null;
    let guid = group ? group.getGuid() : null;
    let composerId:ComposerId = {parentMessageId:null,user: uid,group:guid}; 
    CometChatUIEvents.ccShowModal.next({
      child: this.getPollView(user, group),
      composerId
    });
  }

  /**
   * Constructs the poll creation view with the given user and group details.
   * 
   * @param user - The user who is creating the poll.
   * @param group - The group in which the poll is being created.
   * @param createPollStyle - Style configurations for the poll creation modal.
   * @returns JSX element representing the poll creation modal.
   */
  getPollView(
    user: CometChat.User,
    group: CometChat.Group,
  ) {
    return (
      <div
        className="cometchat-backdrop cometchat-create-poll-backdrop"
      >
        <CreatePoll
          user={user}
          group={group}
          ccCloseClicked={this.triggerCloseEvent}
          replyToMessage={this.replyToMessage}
        />
      </div>
    );
  }

  /**
  * Triggers the event to close the poll creation modal.
  */
  triggerCloseEvent() {
    CometChatUIEvents.ccHideModal.next();
  }

  /**
  * Retrieves the last message in a conversation and checks if it is a poll message.
  * 
  * @param conversation - The conversation from which to retrieve the last message.
  * @param loggedInUser - The currently logged-in user.
  * @param additionalConfigurations - Any additional configurations to be used.
  * @returns The localized string for a poll message if it exists, otherwise a default string.
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
      message.getType() === PollsConstants.extension_poll &&
      message.getCategory() === CometChatUIKitConstants.MessageCategory.custom
    ) {
      return getLocalizedString("conversation_subtitle_poll");
    } else {
      return super.getLastConversationMessage(
        conversation,
        loggedInUser,
        additionalConfigurations
      );
    }
  }
}
