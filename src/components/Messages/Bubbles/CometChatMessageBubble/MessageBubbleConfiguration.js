import { DateConfiguration } from "../../../Shared/PrimaryComponents/CometChatConfiguration/DateConfiguration";
import {
  AvatarConfiguration,
  MessageReceiptConfiguration,
  MessageTimeAlignmentConstants,
} from "../../../Shared/";
import {
  TextBubbleConfiguration,
  AudioBubbleConfiguration,
  ImageBubbleConfiguration,
  VideoBubbleConfiguration,
  PollBubbleConfiguration,
  FileBubbleConfiguration,
  StickerBubbleConfiguration,
  CollaborativeWhiteboardConfiguration,
  CollaborativeDocumentConfiguration,
  DeletedBubbleConfiguration,
  MessageReactionsConfiguration,
} from "../../../";
import { MessageInputData } from "../../../Shared/InputData/MessageInputData";

import { MessageBubbleStyle } from "../../";

/**
 * @class messageBubbleConfiguration
 * @description MessageBubbleConfiguration class is used for defining the message bubble templates
 * @param {Object} messageBubbleData
 * @param {String} timeAlignment
 * @param {Object} dateConfiguration
 * @param {Object} avatarConfiguration
 * @param {Object} messageReceiptConfiguration
 * @param {Object} messageReactionConfiguration
 * @param {Object} textBubbleConfiguration
 * @param {Object} fileBubbleConfiguration
 * @param {Object} imageBubbleConfiguration
 * @param {Object} audioBubbleConfiguration
 * @param {Object} videoBubbleConfiguration
 * @param {Object} pollBubbleConfiguration
 * @param {Object} stickerBubbleConfiguration
 * @param {Object} deletedBubbleConfiguration
 * @param {Object} collaborativeWhiteboardConfiguration
 * @param {Object} collaborativeDocumentConfiguration
 * @param {object} style
 */
class MessageBubbleConfiguration {
  constructor({
    messageBubbleData = new MessageInputData({}),
    timeAlignment = MessageTimeAlignmentConstants.bottom,
    dateConfiguration = new DateConfiguration({}),
    avatarConfiguration = new AvatarConfiguration({}),
    messageReceiptConfiguration = new MessageReceiptConfiguration({}),
    messageReactionConfiguration = new MessageReactionsConfiguration({}),
    textBubbleConfiguration = new TextBubbleConfiguration({}),
    fileBubbleConfiguration = new FileBubbleConfiguration({}),
    imageBubbleConfiguration = new ImageBubbleConfiguration({}),
    audioBubbleConfiguration = new AudioBubbleConfiguration({}),
    videoBubbleConfiguration = new VideoBubbleConfiguration({}),
    pollBubbleConfiguration = new PollBubbleConfiguration({}),
    stickerBubbleConfiguration = new StickerBubbleConfiguration({}),
    deletedBubbleConfiguration = new DeletedBubbleConfiguration({}),
    collaborativeWhiteboardConfiguration = new CollaborativeWhiteboardConfiguration(
      {}
    ),
    collaborativeDocumentConfiguration = new CollaborativeDocumentConfiguration(
      {}
    ),
    style = new MessageBubbleStyle({}),
  }) {
    this.messageBubbleData = new MessageInputData(messageBubbleData || {});
    this.timeAlignment = timeAlignment;
    this.DateConfiguration = new DateConfiguration(dateConfiguration || {});
    this.AvatarConfiguration = new AvatarConfiguration(
      avatarConfiguration || {}
    );
    this.MessageReceiptConfiguration = new MessageReceiptConfiguration(
      messageReceiptConfiguration || {}
    );
    this.MessageReactionsConfiguration = new MessageReactionsConfiguration(
      messageReactionConfiguration || {}
    );
    this.TextBubbleConfiguration = new TextBubbleConfiguration(
      textBubbleConfiguration || {}
    );
    this.FileBubbleConfiguration = new FileBubbleConfiguration(
      fileBubbleConfiguration || {}
    );
    this.ImageBubbleConfiguration = new ImageBubbleConfiguration(
      imageBubbleConfiguration || {}
    );
    this.AudioBubbleConfiguration = new AudioBubbleConfiguration(
      audioBubbleConfiguration || {}
    );
    this.VideoBubbleConfiguration = new VideoBubbleConfiguration(
      videoBubbleConfiguration || {}
    );
    this.PollBubbleConfiguration = new PollBubbleConfiguration(
      pollBubbleConfiguration || {}
    );
    this.StickerBubbleConfiguration = new StickerBubbleConfiguration(
      stickerBubbleConfiguration || {}
    );
    this.DeletedBubbleConfiguration = new DeletedBubbleConfiguration(
      deletedBubbleConfiguration || {}
    );
    this.CollaborativeWhiteboardBubbleConfiguration =
      new CollaborativeWhiteboardConfiguration(
        collaborativeWhiteboardConfiguration || {}
      );
    this.CollaborativeDocumentBubbleConfiguration =
      new CollaborativeDocumentConfiguration(
        collaborativeDocumentConfiguration || {}
      );
    this.style = new MessageBubbleStyle(style || {});
  }
}

export { MessageBubbleConfiguration };
