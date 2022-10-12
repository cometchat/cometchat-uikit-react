import {
  MessageOptionConstants,
  MessageTypeConstants,
  MessageOptionForConstants,
} from "../..";

import { localize } from "../../";

import deleteIcon from "../CometChatMessageList/resources/deleteicon.svg";
import editIcon from "../CometChatMessageList/resources/edit.svg";
import threadIcon from "../CometChatMessageList/resources/threadicon.svg";
import reaction from "../CometChatMessageList/resources/reactionsicon.svg";
import copy from "../CometChatMessageList/resources/copy.svg";
import translateIcon from "../CometChatMessageList/resources/messageTranslation.svg";

/**
 * @class CometChatMessageOptions
 * @description CometChatMessageOptions is a data model used for creating the various message actions with the id serving as the name of the action and the onClick as the handler function to be run on click.
 * @param {String} id
 * @param {String} icon
 * @param {String} title
 * @param {Function} onClick
 * @param {String} optionFor
 */

class CometChatMessageOptions {
  id = "";
  title = "";
  iconURL = "";
  onClick = null;
  optionFor = "";

  constructor({ id, iconURL, title, onClick, optionFor }) {
    this.id = id;
    this.iconURL = iconURL;
    this.title = title;
    this.onClick = onClick;
    this.optionFor = optionFor;
  }

  static getMessageOptions = (optionType) => {
    switch (optionType) {
      case MessageOptionConstants.deleteMessage: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.deleteMessage,
          title: localize("DELETE"),
          //inside style
          iconURL: deleteIcon,
          onClick: null,
          optionFor: MessageOptionForConstants.sender,
        });
      }
      case MessageOptionConstants.editMessage: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.editMessage,
          title: localize("EDIT_MESSAGE"),
          //inside style
          iconURL: editIcon,
          onClick: null,
          optionFor: MessageOptionForConstants.sender,
        });
      }
      case MessageOptionConstants.replyInThread: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.replyInThread,
          title: localize("REPLY_IN_THREAD"),
          //inside style
          iconURL: threadIcon,
          onClick: null,
          optionFor: "",
        });
      }
      case MessageOptionConstants.copyMessage: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.copyMessage,
          title: localize("COPY_MESSAGE"),
          iconURL: copy,
          onClick: null,
          optionFor: MessageOptionForConstants.both,
        });
      }
      case MessageOptionConstants.translateMessage: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.translateMessage,
          title: localize("TRANSLATE_MESSAGE"),
          //inside style
          iconURL: translateIcon,
          onClick: null,
          optionFor: MessageOptionForConstants.both,
        });
      }
      case MessageOptionConstants.reactToMessage: {
        return new CometChatMessageOptions({
          id: MessageOptionConstants.reactToMessage,
          title: localize("ADD_REACTION"),
          //inside style
          iconURL: reaction,
          onClick: null,
          optionFor: MessageOptionForConstants.both,
        });
      }
      default:
        return null;
    }
  };

  // Check for Options table once in notion

  static getDefaultOptions = (type) => {
    switch (type) {
      case MessageTypeConstants.text:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.editMessage),
          this.getMessageOptions(MessageOptionConstants.copyMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
          this.getMessageOptions(MessageOptionConstants.translateMessage),
        ];
      case MessageTypeConstants.file:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.audio:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.video:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];

      case MessageTypeConstants.image:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.document:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.poll:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.sticker:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      case MessageTypeConstants.whiteboard:
        return [
          this.getMessageOptions(MessageOptionConstants.reactToMessage),
          this.getMessageOptions(MessageOptionConstants.deleteMessage),
        ];
      default:
        return [];
    }
  };
}

export { CometChatMessageOptions };
