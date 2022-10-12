import closeCreatePoll from "./resources/close.svg";
import addIcon from "../CometChatMessageComposer/resources/add-circle-filled.svg";
import deleteIcon from "../CometChatCreatePoll/resources/delete.svg";

import { CreatePollStyles } from "../";

/**
 * @class CreatePollConfiguration
 * @description CreatePollConfiguration class is used for defining the MessageComposer templates.
 * @param {callback} onClose
 * @param {callback} onCreatePoll
 * @param {string} closeIconURL
 * @param {string} deleteIconURL
 * @param {string} addAnswerIconURL
 * @param {object} style
 */

class CreatePollConfiguration {
  constructor({
    addAnswerIconURL = addIcon,
    closeIconURL = closeCreatePoll,
    deleteIconURL = deleteIcon,
    onCreatePoll = null,
    onClose = null,
    style = new CreatePollStyles({}),
  }) {
    this.onClose = onClose;
    this.onCreatePoll = onCreatePoll;
    this.deleteIconURL = deleteIconURL;
    this.closeIconURL = closeIconURL;
    this.addAnswerIconURL = addAnswerIconURL;
    this.style = new CreatePollStyles(style ?? {});
  }
}

export { CreatePollConfiguration };
