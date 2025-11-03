import { CometChat } from "@cometchat/chat-sdk-javascript";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import TranslateIcon from "../../../assets/translate.svg";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { MessageTranslationBubble } from "./MessageTranslationBubble";
import { CustomMessageTranslationBubble } from "./CustomMessageTranslationBubble";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatMentionsFormatter } from "../../../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../../../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { CometChatActionsIcon, CometChatActionsView } from "../../../modals";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";
import { MessageBubbleAlignment, MessageStatus } from "../../../Enums/Enums";
import { CometChatTextBubble } from "../../BaseComponents/CometChatTextBubble/CometChatTextBubble";
import {
  CometChatMessageEvents,
  ICustomTranslateLanguage,
  ICustomTranslatePayload,
} from "../../../events/CometChatMessageEvents";
import { Subscription } from "rxjs";

type CustomTranslationMetadata = {
  translatedText: string;
  language: ICustomTranslateLanguage;
  languages: ICustomTranslateLanguage[];
  isLoading?: boolean;
};

/**
 * Decorator class for extending the functionality of message translation in a chat application.
 *
 * @extends {DataSourceDecorator}
 */
export class MessageTranslationExtensionDecorator extends DataSourceDecorator {
  public newDataSource!: DataSource;
  private static customTranslateSubscription: Subscription | null = null;
  private static readonly CUSTOM_TRANSLATION_KEY = "custom_translation_data";

  /**
   * Creates an instance of MessageTranslationExtensionDecorator.
   *
   * @param {DataSource} dataSource - The data source to decorate.
   */
  constructor(dataSource: DataSource) {
    super(dataSource);
    this.newDataSource = dataSource;
    MessageTranslationExtensionDecorator.setupCustomTranslateListener();
  }

  /**
   * Retrieves options for text message actions, including translation options if not already present.
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
    additionalParams?: {
      hideTranslateMessageOption?: boolean;
      hideCustomTranslateMessageOption?: boolean;
    }
  ): (CometChatActionsIcon | CometChatActionsView)[] {
    const options: (CometChatActionsIcon | CometChatActionsView)[] =
      super.getTextMessageOptions(
        loggedInUser,
        messageObject,
        group,
        additionalParams
      );

    if (
      !this.checkIfOptionExist(
        options,
        CometChatUIKitConstants.MessageOption.translateMessage
      ) &&
      !additionalParams?.hideTranslateMessageOption
    ) {
      const translateOption = new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.translateMessage,
        title: getLocalizedString("message_list_translate"),
        iconURL: TranslateIcon,
        onClick: () => {
          const browserLang = navigator.language || navigator.languages[0];

          CometChat.callExtension("message-translation", "POST", "v2/translate", {
            msgId: messageObject.getId(),
            text: (messageObject as CometChat.TextMessage).getText(),
            languages: [browserLang],
          })
            .then((messageTranslations: any) => {
              const translations = messageTranslations?.translations || [];
              const translation = translations.find(
                (t: any) =>
                  t.language_translated?.toLowerCase() ===
                  browserLang.toLowerCase()
              );
              const fallbackLangCode = browserLang.includes("-")
                ? browserLang.split("-")[0]
                : browserLang;
              const originalLang = messageTranslations?.language_original;

              if (
                browserLang === originalLang ||
                fallbackLangCode === originalLang
              ) {
                CometChatMessageEvents.ccMessageTranslated.next({
                  message: messageObject,
                  status: MessageStatus.error,
                });
                return;
              }

              if (!translation?.message_translated || translation?.error) {
                return;
              }

              const translatedMessage = translation.message_translated;
              const metadata: any =
                (messageObject as CometChat.TextMessage).getMetadata() || {};
              metadata["translated_message"] = translatedMessage;
              (messageObject as CometChat.TextMessage).setMetadata(metadata);
              CometChatMessageEvents.ccMessageTranslated.next({
                message: messageObject,
                status: MessageStatus.success,
              });
            })
            .catch((error: any) => {
              console.log("error", error);
            });
        },
      });
      options.push(translateOption);
    }

    if (
      !this.checkIfOptionExist(
        options,
        CometChatUIKitConstants.MessageOption.translateCustomMessage
      ) &&
      !additionalParams?.hideCustomTranslateMessageOption &&
      messageObject instanceof CometChat.TextMessage
    ) {
      const customTranslateOption = new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.translateCustomMessage,
        title: getLocalizedString("message_list_translate_custom"),
        iconURL: TranslateIcon,
        onClick: () => {
          CometChatMessageEvents.ccCustomTranslateRequested.next(
            messageObject
          );
        },
      });
      options.push(customTranslateOption);
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
    const customTranslationMetadata: CustomTranslationMetadata | undefined =
      metadata?.[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY];

    if (
      customTranslationMetadata &&
      customTranslationMetadata.language &&
      !message.getDeletedAt() &&
      message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember
    ) {
      const textFormatters = this.prepareTextFormatters(
        message,
        alignment,
        additionalConfigurations
      );
      const availableLanguages =
        customTranslationMetadata.languages?.length
          ? customTranslationMetadata.languages
          : [customTranslationMetadata.language];

      return (
        <CustomMessageTranslationBubble
          translatedText={customTranslationMetadata.translatedText}
          alignment={alignment}
          textFormatters={textFormatters}
          isSentByMe={alignment === MessageBubbleAlignment.right}
          selectedLanguage={customTranslationMetadata.language}
          languages={availableLanguages}
          isLoading={customTranslationMetadata.isLoading}
          onLanguageChange={(language: ICustomTranslateLanguage) =>
            CometChatMessageEvents.ccCustomTranslateExecute.next({
              message,
              language,
              languages: availableLanguages,
            })
          }
        >
          <CometChatTextBubble
            text={message.getText()}
            isSentByMe={alignment === MessageBubbleAlignment.right}
            textFormatters={textFormatters}
          />
        </CustomMessageTranslationBubble>
      );
    }

    if (
      metadata &&
      Object.prototype.hasOwnProperty.call(metadata, "translated_message") &&
      !message.getDeletedAt() &&
      message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember
    ) {
      const translatedText = metadata["translated_message"];
      const textFormatters = this.prepareTextFormatters(
        message,
        alignment,
        additionalConfigurations
      );

      return (
        <MessageTranslationBubble
          translatedText={translatedText}
          alignment={alignment}
          textFormatters={textFormatters}
          isSentByMe={alignment === MessageBubbleAlignment.right}
        >
          <CometChatTextBubble
            text={message.getText()}
            isSentByMe={alignment === MessageBubbleAlignment.right}
            textFormatters={textFormatters}
          />
        </MessageTranslationBubble>
      );
    }

    return super.getTextMessageContentView(
      message,
      alignment,
      additionalConfigurations
    );
  }

  private prepareTextFormatters(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: any
  ): Array<CometChatTextFormatter> {
    const config = {
      ...additionalConfigurations,
      textFormatters:
        additionalConfigurations?.textFormatters &&
        additionalConfigurations.textFormatters.length
          ? [...additionalConfigurations.textFormatters]
          : this.getAllTextFormatters({
              alignment,
              disableMentions: additionalConfigurations?.disableMentions,
            }),
    };

    const textFormatters: Array<CometChatTextFormatter> =
      config.textFormatters || [];
    let urlTextFormatter: CometChatUrlsFormatter | undefined;

    if (!config.disableMentions) {
      let mentionsTextFormatter: CometChatMentionsFormatter | undefined;
      for (let i = 0; i < textFormatters.length; i++) {
        if (textFormatters[i] instanceof CometChatMentionsFormatter) {
          mentionsTextFormatter =
            textFormatters[i] as unknown as CometChatMentionsFormatter;
          mentionsTextFormatter.setMessage(message);
          if (message.getMentionedUsers().length) {
            mentionsTextFormatter.setCometChatUserGroupMembers(
              message.getMentionedUsers()
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
          urlTextFormatter =
            textFormatters[i] as unknown as CometChatUrlsFormatter;
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
          urlTextFormatter =
            textFormatters[i] as unknown as CometChatUrlsFormatter;
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

    textFormatters.forEach((formatter) => {
      formatter.setMessageBubbleAlignment(alignment);
      formatter.setMessage(message);
    });

    return textFormatters;
  }

  private static setupCustomTranslateListener(): void {
    if (this.customTranslateSubscription) {
      return;
    }

    this.customTranslateSubscription =
      CometChatMessageEvents.ccCustomTranslateExecute.subscribe(
        (payload: ICustomTranslatePayload) => {
          if (
            payload?.message instanceof CometChat.TextMessage &&
            payload.language?.code
          ) {
            MessageTranslationExtensionDecorator.performCustomTranslation(
              payload
            );
          }
        }
      );
  }

  private static performCustomTranslation(
    payload: ICustomTranslatePayload
  ): void {
    const { message, language, languages } = payload;
    if (!(message instanceof CometChat.TextMessage) || !language?.code) {
      return;
    }

    const metadata: any = message.getMetadata() || {};
    const existingData: CustomTranslationMetadata | undefined =
      metadata[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY];

    const mergedLanguages = this.mergeLanguages(
      existingData?.languages,
      languages,
      language
    );
    const selectedLanguage = this.findLanguageInList(mergedLanguages, language);
    const previousLanguage =
      existingData?.language ?? selectedLanguage ?? language;
    const previousTranslation = existingData?.translatedText ?? "";

    metadata[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY] = {
      translatedText: previousTranslation,
      languages: mergedLanguages,
      language: selectedLanguage,
      isLoading: true,
    };
    message.setMetadata(metadata);
    CometChatMessageEvents.ccMessageTranslated.next({
      message,
      status: MessageStatus.inprogress,
    });

    const targetCode = selectedLanguage?.code || language.code;
    const targetFallback = targetCode.includes("-")
      ? targetCode.split("-")[0]
      : targetCode;

    CometChat.callExtension("message-translation", "POST", "v2/translate", {
      msgId: message.getId(),
      text: message.getText(),
      languages: [targetCode],
    })
      .then((messageTranslations: any) => {
        const translations = messageTranslations?.translations || [];
        const targetLower = this.getCodeComparisionValue(targetCode);
        const fallbackLower = this.getCodeComparisionValue(targetFallback);
        const originalLower = this.getCodeComparisionValue(
          messageTranslations?.language_original
        );

        const translation =
          translations.find(
            (t: any) =>
              this.getCodeComparisionValue(t?.language_translated) ===
              targetLower
          ) ||
          translations.find(
            (t: any) =>
              this.getCodeComparisionValue(t?.language_translated) ===
              fallbackLower
          );

        if (
          !translation?.message_translated ||
          translation?.error ||
          targetLower === originalLower ||
          fallbackLower === originalLower
        ) {
          metadata[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY] =
            {
              translatedText: previousTranslation,
              languages: mergedLanguages,
              language: previousLanguage,
              isLoading: false,
            };
          message.setMetadata(metadata);
          CometChatMessageEvents.ccMessageTranslated.next({
            message,
            status: MessageStatus.error,
          });
          return;
        }

        const translatedMessage = translation.message_translated;
        const resolvedLanguage: ICustomTranslateLanguage = {
          ...selectedLanguage,
          name:
            selectedLanguage?.name ||
            translation.language_translated ||
            selectedLanguage.code,
        };

        const updatedLanguages = mergedLanguages.map((lang) =>
          this.getCodeComparisionValue(lang.code) ===
          this.getCodeComparisionValue(resolvedLanguage.code)
            ? { ...lang, ...resolvedLanguage }
            : lang
        );

        metadata[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY] =
          {
            translatedText: translatedMessage,
            languages: updatedLanguages,
            language: resolvedLanguage,
            isLoading: false,
          };
        metadata["translated_message"] = translatedMessage;
        message.setMetadata(metadata);

        CometChatMessageEvents.ccMessageTranslated.next({
          message,
          status: MessageStatus.success,
        });
      })
      .catch((error: any) => {
        console.log("error", error);
        metadata[MessageTranslationExtensionDecorator.CUSTOM_TRANSLATION_KEY] =
          {
            translatedText: previousTranslation,
            languages: mergedLanguages,
            language: previousLanguage,
            isLoading: false,
          };
        message.setMetadata(metadata);
        CometChatMessageEvents.ccMessageTranslated.next({
          message,
          status: MessageStatus.error,
        });
      });
  }

  private static mergeLanguages(
    existing: ICustomTranslateLanguage[] | undefined,
    incoming: ICustomTranslateLanguage[] | undefined,
    selected: ICustomTranslateLanguage
  ): ICustomTranslateLanguage[] {
    const languageMap = new Map<string, ICustomTranslateLanguage>();

    const addLanguage = (language?: ICustomTranslateLanguage) => {
      if (!language?.code) {
        return;
      }
      const key = this.getCodeComparisionValue(language.code);
      const current = languageMap.get(key) || {};
      languageMap.set(key, { ...current, ...language });
    };

    (existing || []).forEach(addLanguage);
    (incoming || []).forEach(addLanguage);
    addLanguage(selected);

    return Array.from(languageMap.values());
  }

  private static findLanguageInList(
    languages: ICustomTranslateLanguage[],
    candidate: ICustomTranslateLanguage
  ): ICustomTranslateLanguage {
    const key = this.getCodeComparisionValue(candidate?.code);
    return (
      languages.find(
        (language) => this.getCodeComparisionValue(language.code) === key
      ) || candidate
    );
  }

  private static getCodeComparisionValue(code: string | undefined): string {
    return (code || "").toLowerCase();
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
