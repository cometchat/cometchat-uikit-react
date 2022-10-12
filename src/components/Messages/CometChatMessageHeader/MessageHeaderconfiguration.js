import backIcon from "../CometChatMessages//resources/back.svg";

import { DataItemConfiguration } from "../../Shared";

/**
 * @class MessageHeaderConfiguration
 * @description MessageHeaderConfiguration class is used for defining the MessageHeader templates.
 * @param {Boolean} showBackButton
 * @param {Boolean} enableTypingIndicator
 * @param {String} backButtonIconURL
 * @param {Array} options
 */
class MessageHeaderConfiguration {
  constructor({
    showBackButton = true,
    backButtonIconURL = backIcon,
    enableTypingIndicator = false,
   //options = null,
    dataItemConfiguration = new DataItemConfiguration({}),
  }) {
    this.showBackButton = showBackButton;
    this.backButtonIconURL = backButtonIconURL;
    this.enableTypingIndicator = enableTypingIndicator;
    //this.options = options;
    this.dataItemConfiguration = dataItemConfiguration;
  }
}

export { MessageHeaderConfiguration };
