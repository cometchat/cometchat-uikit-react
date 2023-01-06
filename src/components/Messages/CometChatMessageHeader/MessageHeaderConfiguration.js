import backIcon from "../CometChatMessages//resources/back.svg";

import { DataItemConfiguration } from "../../Shared";

import { MessageHeaderStyle } from "..";

/**
 * @class MessageHeaderConfiguration
 * @description MessageHeaderConfiguration class is used for defining the MessageHeader templates.
 * @param {Boolean} showBackButton
 * @param {Boolean} enableTypingIndicator
 * @param {String} backButtonIconURL
 * @param {Array} options
 * @param {Object} style
 */
class MessageHeaderConfiguration {
  constructor({
    showBackButton = true,
    backButtonIconURL = backIcon,
    enableTypingIndicator = false,
    style = new MessageHeaderStyle({}),
    dataItemConfiguration = new DataItemConfiguration({}),
  }) {
    this.showBackButton = showBackButton;
    this.backButtonIconURL = backButtonIconURL;
    this.enableTypingIndicator = enableTypingIndicator;
    this.style = new MessageHeaderStyle(style || {});
    this.dataItemConfiguration = dataItemConfiguration;
  }
}

export { MessageHeaderConfiguration };
