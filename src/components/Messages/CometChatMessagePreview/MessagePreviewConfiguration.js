import closeButton from "../CometChatMessageComposer/resources/close.svg";

import { localize } from "../../../";

import { MessagePreviewStyles } from "../";

/**
 * @class MessagePreviewConfiguration
 * @description MessagePreviewConfiguration class is used for defining the MessagePreview templates.
 * @param {String} iconURL
 * @param {String} text
 * @param {Object} tail
 * @param {Function} onItemClick
 * @param {Number} id
 */
class MessagePreviewConfiguration {
  constructor({
    messagePreviewTitle = localize("EDIT_MESSAGE"),
    messagePreviewSubtitle = null,
    closeIconURL = closeButton,
    onCloseClick = null,
    style = new MessagePreviewStyles({}),
  }) {
    this.messagePreviewTitle = messagePreviewTitle;
    this.messagePreviewSubtitle = messagePreviewSubtitle;
    this.closeIconURL = closeIconURL;
    this.onCloseClick = onCloseClick;
    this.style = new MessagePreviewStyles(style ?? {});
  }
}

export { MessagePreviewConfiguration };
