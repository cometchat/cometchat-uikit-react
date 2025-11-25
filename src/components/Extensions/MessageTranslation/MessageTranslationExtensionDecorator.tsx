import { CometChat } from "@cometchat/chat-sdk-javascript";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import TranslateIcon from "../../../assets/translate.svg";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { MessageTranslationBubble } from "./MessageTranslationBubble";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatMentionsFormatter } from "../../../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../../../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatActionsIcon, CometChatActionsView } from "../../../modals";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import {getLocalizedString} from "../../../resources/CometChatLocalize/cometchat-localize";
import { MessageBubbleAlignment, MessageStatus } from "../../../Enums/Enums";
import { CometChatTextBubble } from "../../BaseComponents/CometChatTextBubble/CometChatTextBubble";
import { CometChatMessageEvents } from "../../../events/CometChatMessageEvents";

/**
 * Decorator class for extending the functionality of message translation in a chat application.
 * 
 * @extends {DataSourceDecorator}
 */
export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
  public newDataSource!: DataSource;

  /**
   * Creates an instance of MessageTranslationExtensionDecorator.
   * 
   * @param {DataSource} dataSource - The data source to decorate.
   * @param {MessageTranslationConfiguration} [configuration] - Optional configuration for message translation.
   */
  constructor(
    dataSource: DataSource) {
    super(dataSource);
    this.newDataSource = dataSource;
  }

  /**
   * Retrieves options for text message actions, including a translation option if not already present.
   * 
   * @override
   * @param {CometChat.User} loggedInUser - The currently logged-in user.
   * @param {CometChat.BaseMessage} messageObject - The message object for which options are retrieved.
   * @param {CometChat.Group} [group] - Optional group associated with the message.
   * @returns {(CometChatActionsIcon | CometChatActionsView)[]} The array of action options for the message.
   */
  override getTextMessageOptions(
    loggedInUser: CometChat.User,
    messageObject: CometChat.BaseMessage,
    group?: CometChat.Group,
    additionalParams?: { hideTranslateMessageOption: boolean }
  ): (CometChatActionsIcon | CometChatActionsView)[] {
    let options: (CometChatActionsIcon | CometChatActionsView)[] =
      super.getTextMessageOptions(loggedInUser, messageObject, group, additionalParams);
    if (
      !this.checkIfOptionExist(
        options,
        CometChatUIKitConstants.MessageOption.translateMessage
      ) &&
      !additionalParams?.hideTranslateMessageOption
    ) {
      let newOption: CometChatActionsIcon = new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.translateMessage,
        title: getLocalizedString("message_list_translate"),
        iconURL: TranslateIcon,
        onClick: function () {
          const browserLang = navigator.language || navigator.languages[0];

          CometChat.callExtension(
            "message-translation",
            "POST",
            "v2/translate",
            {
              msgId: messageObject.getId(),
              text: (messageObject as CometChat.TextMessage).getText(),
              languages: [browserLang],
            }
          )
            .then((message_translations: any) => {
              const translations = message_translations.translations;
              const translation = translations.find(
                (t: any) => t.language_translated.toLowerCase() === browserLang.toLowerCase()
              );
              let fallbackLangCode = browserLang.includes("-")
                ? browserLang.split("-")[0]
                : browserLang;
              if (browserLang === message_translations.language_original || fallbackLangCode == message_translations.language_original) {
                CometChatMessageEvents.ccMessageTranslated.next({
                  message: messageObject, status: MessageStatus.error
                });
              }
              else{
                const translatedMessage = translation.message_translated;
                if (!translation?.message_translated || translation?.error) {
                  return;
                }              
                const metadata: any =
                    (messageObject as CometChat.TextMessage).getMetadata() || {};
                  metadata["translated_message"] = translatedMessage;
                  (messageObject as CometChat.TextMessage).setMetadata(metadata);
                  CometChatMessageEvents.ccMessageTranslated.next({
                    message: messageObject, status: MessageStatus.success
                  });
              }
            })
            .catch((error: any) => {
              console.log("error", error);
            });
        },

      });
      options.push(newOption);
    }
    return options;
  }





  /**
   * Retrieves the content view for a text message, including translated content if available.
   * 
   * @override
   * @param {CometChat.TextMessage} message - The text message for which content view is retrieved.
   * @param {MessageBubbleAlignment} alignment - The alignment of the message bubble.
   * @param {any} [additionalConfigurations] - Optional additional configurations for the content view.
   * @returns {JSX.Element} The content view for the text message.
   */
  override getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: any
  ) {
    const metadata: any = message.getMetadata();
    if (
      metadata &&
      Object.prototype.hasOwnProperty.call(metadata, "translated_message") &&
      !message.getDeletedAt() &&
      message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember
    ) {
      const translatedText = metadata["translated_message"];

      let config = {
        ...additionalConfigurations,
        textFormatters:
          additionalConfigurations?.textFormatters &&
            additionalConfigurations?.textFormatters.length
            ? [...additionalConfigurations.textFormatters]
            : this.getAllTextFormatters({ alignment, disableMentions: additionalConfigurations.disableMentions }),
      };
      let textFormatters: Array<CometChatTextFormatter> = config.textFormatters;
      let urlTextFormatter!: CometChatUrlsFormatter;
      if (config && !config.disableMentions) {
        let mentionsTextFormatter!: CometChatMentionsFormatter;
        for (let i = 0; i < textFormatters.length; i++) {
          if (textFormatters[i] instanceof CometChatMentionsFormatter) {
            mentionsTextFormatter = textFormatters[
              i
            ] as unknown as CometChatMentionsFormatter;
            mentionsTextFormatter.setMessage(message);
            if (message.getMentionedUsers().length) {
              mentionsTextFormatter.setCometChatUserGroupMembers(
                message.getMentionedUsers()
              );
            }
            if (!message.getDeletedAt()) {
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
            urlTextFormatter = textFormatters[i] as unknown as CometChatUrlsFormatter;
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
              alignment
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
        urlTextFormatter = ChatConfigurator.getDataSource().getUrlTextFormatter(
          {
            alignment
          }
        );
        textFormatters.push(urlTextFormatter);
      }
      for (let i = 0; i < textFormatters.length; i++) {
        textFormatters[i].setMessageBubbleAlignment(alignment);
        textFormatters[i].setMessage(message);
      }
      return (
        <MessageTranslationBubble
          translatedText={translatedText}
          alignment={alignment}
          textFormatters={textFormatters}
          isSentByMe={alignment == MessageBubbleAlignment.right}
        >
          <CometChatTextBubble
            text={message.getText()}
            isSentByMe={alignment == MessageBubbleAlignment.right}
            textFormatters={textFormatters}
          />
        </MessageTranslationBubble>
      );
    } else {
      return super.getTextMessageContentView(
        message,
        alignment,
        additionalConfigurations
      );
    }
  }

  /**
   * Checks if an option with the specified ID already exists in the options list.
   * 
   * @param {(CometChatActionsIcon | CometChatActionsView)[]} template - The list of options to check.
   * @param {string} id - The ID of the option to check for.
   * @returns {boolean} `true` if the option exists, otherwise `false`.
   */
  checkIfOptionExist(
    template: (CometChatActionsIcon | CometChatActionsView)[],
    id: string
  ): boolean {
    return template.some((obj) => obj.id === id);
  }

  /**
   * Retrieves the unique ID for this decorator.
   * 
   * @returns {string} The ID of this decorator.
   */
  override getId(): string {
    return "messagetranslation";
  }
}
