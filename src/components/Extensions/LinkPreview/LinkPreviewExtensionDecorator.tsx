import React from "react";
import { DataSource } from "../../../utils/DataSource";
import { DataSourceDecorator } from "../../../utils/DataSourceDecorator";
import { ChatConfigurator } from "../../../utils/ChatConfigurator";
import { CometChatUIKitLoginListener } from "../../../CometChatUIKit/CometChatUIKitLoginListener";
import { LinkPreviewConstants } from "./LinkPreviewConstants";
import { CometChatUIKitUtility } from "../../../CometChatUIKit/CometChatUIKitUtility";
import { LinkPreview } from "./LinkPreview";
import { CometChatTextFormatter } from "../../../formatters/CometChatFormatters/CometChatTextFormatter";
import { CometChatMentionsFormatter } from "../../../formatters/CometChatFormatters/CometChatMentionsFormatter/CometChatMentionsFormatter";
import { CometChatUrlsFormatter } from "../../../formatters/CometChatFormatters/CometChatUrlsFormatter/CometChatUrlsFormatter";
import { MessageBubbleAlignment } from "../../../Enums/Enums";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { CometChatTextBubble } from "../../BaseComponents/CometChatTextBubble/CometChatTextBubble";

/**
 * The `LinkPreviewExtensionDecorator` class is responsible for adding link preview functionality
 * to text messages within the chat. It decorates the data source with the ability to handle link previews.
 */
export class LinkPreviewExtensionDecorator extends DataSourceDecorator {


  /**
   * The data source that the decorator wraps, adding link preview capabilities.
   * @type {DataSource}
   */
  public newDataSource!: DataSource;

  /**
   * Creates an instance of the `LinkPreviewExtensionDecorator` class.
   *
   * @param {DataSource} dataSource - The data source that the decorator will wrap.
   * @param {LinkPreviewConfiguration} [configuration] - Optional configuration settings for the link preview extension.
   */
  constructor(
    dataSource: DataSource
  ) {
    super(dataSource);
    this.newDataSource = dataSource;
  }

  /**
   * Returns the unique identifier for this decorator.
   * @returns {string} The ID of the decorator.
   */
  override getId(): string {
    return "linkpreview";
  }

  /**
   * Retrieves the content view for a text message with potential link preview enhancements.
   * @param {CometChat.TextMessage} message - The text message to be displayed.
   * @param {MessageBubbleAlignment} alignment - The alignment of the message bubble.
   * @param {any} [additionalConfigurations] - Additional configurations for formatting.
   * @returns {JSX.Element} The JSX element representing the message content view.
   */
  override getTextMessageContentView(
    message: CometChat.TextMessage,
    alignment: MessageBubbleAlignment,
    additionalConfigurations?: any
  ) {
    const linkPreviewObject: any = this.getLinkPreview(message);
    if (
      linkPreviewObject &&
      !message.getDeletedAt() &&
      message.getType() !== CometChatUIKitConstants.MessageTypes.groupMember
    ) {
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
            ] as CometChatMentionsFormatter;
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
            alignment,
          }
        );
        textFormatters.push(urlTextFormatter);
      }

      for (let i = 0; i < textFormatters.length; i++) {
        textFormatters[i].setMessageBubbleAlignment(alignment);
        textFormatters[i].setMessage(message);
      }
      return (
        <LinkPreview
          title={this.getLinkPreviewDetails(linkPreviewObject, "title")}
          description={this.getLinkPreviewDetails(
            linkPreviewObject,
            "description"
          )}
          URL={this.getLinkPreviewDetails(linkPreviewObject, "url")}
          image={this.getLinkPreviewDetails(linkPreviewObject, "image")}
          favIconURL={this.getLinkPreviewDetails(linkPreviewObject, "favicon")}
          ccLinkClicked={(url) => this.openLink(url)}
          isSentByMe={alignment == MessageBubbleAlignment.right}
        >
          <CometChatTextBubble
            text={message.getText()}
            isSentByMe={alignment == MessageBubbleAlignment.right}
            textFormatters={textFormatters}
          />
        </LinkPreview>
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
   * Retrieves the style for the link preview wrapper.
   * @returns {object} The style object for the link preview wrapper.
   */
  getLinkPreviewWrapperStyle() {
    return { height: "inherit", width: "inherit" };
  }

  /**
   * Opens the provided URL in a new browser tab.
   * @param {string} url - The URL to open.
   */
  openLink(url: string) {
    window.open(url, "_blank");
  }

  /**
   * Extracts the link preview object from the message metadata, if available.
   * @param {CometChat.TextMessage} message - The message object containing metadata.
   * @returns {object|null} The link preview object if available, otherwise null.
   */
  getLinkPreview(message: CometChat.TextMessage): any {
    try {
      if (message?.getMetadata()) {
        const metadata: any = message.getMetadata();
        const injectedObject = metadata[LinkPreviewConstants.injected];
        if (injectedObject && injectedObject?.extensions) {
          const extensionsObject = injectedObject.extensions;
          if (
            extensionsObject &&
            CometChatUIKitUtility.checkHasOwnProperty(
              extensionsObject,
              LinkPreviewConstants.link_preview
            )
          ) {
            const linkPreviewObject =
              extensionsObject[LinkPreviewConstants.link_preview];
            if (
              linkPreviewObject &&
              CometChatUIKitUtility.checkHasOwnProperty(
                linkPreviewObject,
                LinkPreviewConstants.links
              ) &&
              linkPreviewObject[LinkPreviewConstants.links].length
            ) {
              return linkPreviewObject[LinkPreviewConstants.links][0];
            } else {
              return null;
            }
          } else {
            return null;
          }
        }
      } else {
        return null;
      }
    } catch (error: any) {
      console.log("error in getting link preview details", error);
    }
  }

  /**
   * Retrieves a specific detail from the link preview object.
   * @param {object} linkPreviewObject - The link preview object containing various details.
   * @param {string} key - The key corresponding to the detail to retrieve.
   * @returns {string} The detail value corresponding to the provided key.
   */
  getLinkPreviewDetails(linkPreviewObject: any, key: string): string {
    if (Object.keys(linkPreviewObject).length > 0) {
      return linkPreviewObject[key];
    } else {
      return "";
    }
  }
}
