import { MessageCategoryConstants, MessageTypeConstants } from "../..";

import { localize } from "../..";

import { CometChatMessageOptions } from "..";

import stickerIcon from "../CometChatMessageList/resources/stickers.svg";
import documentIcon from "../CometChatMessageList/resources/collaborativedocument.svg";
import whiteboardIcon from "../CometChatMessageList/resources/collaborativewhiteboard.svg";
import pollIcon from "../CometChatMessageList/resources/polls.svg";

import textIcon from "../CometChatMessageList/resources/editicon.svg";
import audioIcon from "../CometChatMessageList/resources/audio-file.svg";
import videoIcon from "../CometChatMessageList/resources/video-upload.svg";
import fileIcon from "../CometChatMessageList/resources/file-upload.svg";
import imageIcon from "../CometChatMessageList/resources/image.svg";

/**
 * @class CometChatMessageTemplate
 * @description CometChatMessageTemplate class is used for defining the message templates.
 * @param {String} type
 * @param {String} icon
 * @param {String} name
 * @param {Function} onActionClick
 * @param {Function} customView
 * @param {Array} options
 * @param {String} category
 */

class CometChatMessageTemplate {
  type = "";
  icon = "";
  name = "";
  onActionClick = null;
  customView = null;
  options = [];
  category = "";

  constructor({
    type = "",
    icon = "",
    name = "",
    onActionClick = null,
    customView = null,
    options = [],
  }) {
    this.type = type;
    this.icon = icon;
    this.name = name;
    this.onActionClick = onActionClick;
    this.customView = customView;
    this.options = options;
    this.category = CometChatMessageTemplate.getCategory(type);
  }

  static getCategory = (type) => {
    switch (type) {
      case MessageTypeConstants.text:
      case MessageTypeConstants.image:
      case MessageTypeConstants.video:
      case MessageTypeConstants.audio:
      case MessageTypeConstants.file: {
        return MessageCategoryConstants.message;
      }
      case MessageTypeConstants.poll:
      case MessageTypeConstants.sticker:
      case MessageTypeConstants.document:
      case MessageTypeConstants.whiteboard:
      case MessageTypeConstants.meeting: {
        return MessageCategoryConstants.custom;
      }
      case MessageTypeConstants.groupMember:
      case MessageTypeConstants.messageEdited:
      case MessageTypeConstants.messageDeleted: {
        return MessageCategoryConstants.action;
      }
      default: {
        return MessageCategoryConstants.custom;
      }
    }
  };

  static getMessageTemplate = (type) => {
    switch (type) {
      case MessageTypeConstants.text: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.text,
          icon: textIcon,
          name: localize("TEXT"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.text
          ),
        });
      }
      case MessageTypeConstants.image: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.image,
          icon: imageIcon,
          name: localize("ATTACH_IMAGE"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.image
          ),
        });
      }
      case MessageTypeConstants.video: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.video,
          icon: videoIcon,
          name: localize("ATTACH_VIDEO"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.video
          ),
        });
      }
      case MessageTypeConstants.audio: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.audio,
          icon: audioIcon,
          name: localize("ATTACH_AUDIO"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.audio
          ),
        });
      }
      case MessageTypeConstants.file: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.file,
          icon: fileIcon,
          name: localize("ATTACH_FILE"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.file
          ),
        });
      }
      case MessageTypeConstants.poll: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.poll,
          icon: pollIcon,
          name: localize("CREATE_POLL"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.poll
          ),
        });
      }
      case MessageTypeConstants.sticker: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.sticker,
          icon: stickerIcon,
          name: localize("STICKER"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.sticker
          ),
        });
      }
      case MessageTypeConstants.document: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.document,
          icon: documentIcon,
          name: localize("COLLABORATIVE_DOCUMENT"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.document
          ),
        });
      }
      case MessageTypeConstants.whiteboard: {
        return new CometChatMessageTemplate({
          type: MessageTypeConstants.whiteboard,
          icon: whiteboardIcon,
          name: localize("COLLABORATIVE_WHITEBOARD"),
          onActionClick: null,
          customView: null,
          options: CometChatMessageOptions.getDefaultOptions(
            MessageTypeConstants.whiteboard
          ),
        });
      }
      default:
        return null;
    }
  };
  static getDefaultTypes = () => {
    let types = [
      this.getMessageTemplate(MessageTypeConstants.text),
      this.getMessageTemplate(MessageTypeConstants.image),
      this.getMessageTemplate(MessageTypeConstants.file),
      this.getMessageTemplate(MessageTypeConstants.audio),
      this.getMessageTemplate(MessageTypeConstants.video),
      this.getMessageTemplate(MessageTypeConstants.poll),
      this.getMessageTemplate(MessageTypeConstants.sticker),
      this.getMessageTemplate(MessageTypeConstants.document),
      this.getMessageTemplate(MessageTypeConstants.whiteboard),
    ];

    return types;
  };
}

const getDefaultTypes = CometChatMessageTemplate.getDefaultTypes;

export { CometChatMessageTemplate, getDefaultTypes };