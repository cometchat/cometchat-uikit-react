
import { CometChatMessageBubble } from "../components/BaseComponents/CometChatMessageBubble/CometChatMessageBubble";
import { CometChatUIKitConstants } from "../constants/CometChatUIKitConstants";
import { MessageBubbleAlignment } from "../Enums/Enums";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import {getLocalizedString} from "../resources/CometChatLocalize/cometchat-localize";
import { CometChatMessageTemplate } from "../modals";
import { CalendarObject } from "./CalendarObject";
import { CometChatTextFormatter } from "../formatters";
import {CometChatModerationView} from "../components/BaseComponents/CometChatModerationView/CometChatModerationView";

/**
 * Utility class for handling message display and styling.
 * It is used in CometChatMessageInformation component.
 */

export class MessageUtils {
  
  /**
   * Retrieves the content view for a message based on the provided template.
   *
   * @param {CometChat.BaseMessage} message - The message object for which to get the content view.
   * @param {CometChatMessageTemplate} template - The message template to use for rendering the content view.
   * @returns {object | null} - The content view for the message, or null if not found.
   */
  getContentView(
    message: CometChat.BaseMessage,
    template: CometChatMessageTemplate,
    alignment?:MessageBubbleAlignment,
    textFormatters?:CometChatTextFormatter[]
  ) {
    let view;
    const messageTypesMap: any = {};
    messageTypesMap[`${template.category}_${template.type}`] = template;

    if (
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`] &&
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`]
        ?.contentView
    ) {
      view = messageTypesMap[
        `${message?.getCategory()}_${message?.getType()}`
      ]?.contentView(message, alignment,textFormatters);
      // default would be html string using lit components
      if (typeof view === "string") {
        return {
          html: view,
        };
      }
      return view;
    } else {
      return null;
    }
  }
  /**
   * Retrieves the content view for a message based on the provided template.
   *
   * @param {CometChat.BaseMessage} message - The message object for which to get the content view.
   * @param {CometChatMessageTemplate} template - The message template to use for rendering the content view.
   * @returns {object | null} - The content view for the message, or null if not found.
   */
  getStatusInfoView(
    message: CometChat.BaseMessage,
    template: CometChatMessageTemplate,
    alignment?: MessageBubbleAlignment,
    messageSentAtDateTimeFormat?:CalendarObject,
    hideReceipts:boolean = false
  ) {
    let view;
    const messageTypesMap: any = {};
    messageTypesMap[`${template.category}_${template.type}`] = template;

    if (
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`] &&
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`]
        ?.statusInfoView
    ) {
      view = messageTypesMap[
        `${message?.getCategory()}_${message?.getType()}`
      ]?.statusInfoView(message, alignment,hideReceipts,messageSentAtDateTimeFormat);
      if (typeof view === "string") {
        return {
          html: view,
        };
      }
      return view;
    } else {
      return null;
    }
  }

/**
 * Retrieves the bottom view for moderated messages
 *
 * @returns {JSX.Element} The default view for moderated messages.
 */

  getModeratedMessageBottomView(): JSX.Element {
    return <CometChatModerationView/>
  }

  /**
   * Retrieves the bubble wrapper for a message based on the provided template.
   *
   * @param {CometChat.BaseMessage} message - The message object for which to get the bubble wrapper.
   * @param {CometChatMessageTemplate} template - The message template to use for rendering the bubble wrapper.
   * @returns {object | null} - The bubble wrapper for the message, or null if not found.
   */
  getBubbleWrapper(
    message: CometChat.BaseMessage,
    template: CometChatMessageTemplate
  ) {
    let view;
    const messageTypesMap: any = {};
    messageTypesMap[`${template.category}_${template.type}`] = template;

    if (
      messageTypesMap &&
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`] &&
      messageTypesMap[`${message?.getCategory()}_${message?.getType()}`]
        .bubbleView
    ) {
      view =
        messageTypesMap[`${message?.getCategory()}_${message?.getType()}`]
          .bubbleView(message);
      return view;
    } else {
      view = null;
      return view;
    }
  }

  /**
   * Constructs a message bubble component based on the message, template, style, and alignment.
   *
   * @param {CometChat.BaseMessage} baseMessage - The message object to be displayed in the bubble.
   * @param {CometChatMessageTemplate} template - The message template to use for rendering the bubble.
   * @param {object} messageBubbleStyle - The style object for the message bubble.
   * @param {MessageBubbleAlignment} alignment - The alignment of the message bubble (left or right).
   * @returns {JSX.Element} - The message bubble component.
   */
  getMessageBubble(
    baseMessage: CometChat.BaseMessage,
    template: CometChatMessageTemplate,
    alignment: MessageBubbleAlignment,
    messageSentAtDateTimeFormat?:CalendarObject,
    hideReceipts?:boolean,
    textFormatters?:CometChatTextFormatter[],
    replyView?: JSX.Element | null
  ) {
    return this.getBubbleWrapper(baseMessage, template)
      ? this.getBubbleWrapper(baseMessage, template)
      : <CometChatMessageBubble bottomView={null} headerView={null} options={[]} footerView={null} leadingView={null} statusInfoView={this.getStatusInfoView(baseMessage, template, alignment,messageSentAtDateTimeFormat,hideReceipts)} contentView={this.getContentView(baseMessage, template,alignment,textFormatters)} replyView={replyView ?? null} threadView={null} alignment={alignment} id={baseMessage?.getId() || baseMessage?.getMuid()} />
  }
  /**
   *
   * @param {(CometChat.User | CometChat.GroupMember | any)} user
   * @returns {boolean}
   */
  getUserStatusVisible(
    user: CometChat.User | CometChat.GroupMember | any
  ) {
    let userBlockedFlag = false;
    if (user instanceof (CometChat.User || CometChat.GroupMember)) {
      if (user.getBlockedByMe() || user.getHasBlockedMe()) {
        userBlockedFlag = true;
      }
    }
    return userBlockedFlag;
  }
  /**
   * Description placeholder
   *
   * @param {*} message
   * @returns {string}
   */
  getActionMessage(message: CometChat.Action): string {
    let actionMessage = "";
    if (
      message.hasOwnProperty("actionBy") === false ||
      message.hasOwnProperty("actionOn") === false
    ) {
      return actionMessage;
    }
    if (
      message.getAction() !== CometChatUIKitConstants.groupMemberAction.JOINED &&
      message.getAction() !== CometChatUIKitConstants.groupMemberAction.LEFT &&
      (message.getActionBy().hasOwnProperty("name") === false ||
        message.getActionOn().hasOwnProperty("name") === false)
    ) {
      return actionMessage;
    }
    if (
      message.getAction() === CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE
    ) {
      if (
        message.hasOwnProperty("data") &&
        message.getData().hasOwnProperty("extras")
      ) {
        if (message.getData().extras.hasOwnProperty("scope")) {
          if (message.getData().extras.scope.hasOwnProperty("new") === false) {
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
      message.getAction() ===
      CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE &&
      message.getData().extras.hasOwnProperty("scope") === false
    ) {
      return actionMessage;
    }
    if (
      message.getAction() ===
      CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE &&
      message.getData().extras.scope.hasOwnProperty("new") === false
    ) {
      return actionMessage;
    }
    const byEntity: any = message.getActionBy();
    const onEntity: any = message.getActionOn();
    const byString = byEntity.name;
    const forString =
      message.getAction() !== CometChatUIKitConstants.groupMemberAction.JOINED &&
        message.getAction() !== CometChatUIKitConstants.groupMemberAction.LEFT
        ? onEntity.name
        : "";
    switch (message.getAction()) {
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
        )} ${forString} ${newScope}`;
        break;
      }
      default:
        break;
    }
    return actionMessage;
  }
}
