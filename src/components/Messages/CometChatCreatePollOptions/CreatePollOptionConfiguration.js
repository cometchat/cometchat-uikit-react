import deleteIcon from "./resources/delete.svg";

import { localize } from "../../../";

import { CreatePollOptionStyles } from "../";

/**
 * @class CreatePollOptionConfiguration
 * @description CreatePollOptionConfiguration class is used for defining the MessageComposer templates.
 * @param {Function} onDeleteClick
 * @param {Function} onChangeHandler
 * @param {String} option
 * @param {Boolean} hasDelete
 * @param {String} placeholderText
 * @param {String} deleteIconUrl
 * @param {Object} style
 */

class CreatePollOptionConfiguration {
  constructor({
    hasDelete = false,
    placeholderText = localize("ANSWER"),
    deleteIconURL = deleteIcon,
    onDeleteClick = null,
    onChangeHandler = null,
    option = null,
    style = new CreatePollOptionStyles({}),
  }) {
    this.hasDelete = hasDelete;
    this.placeholderText = placeholderText;
    this.deleteIconURL = deleteIconURL;
    this.onDeleteClick = onDeleteClick;
    this.onChangeHandler = onChangeHandler;
    this.option = option;
    this.style = new CreatePollOptionStyles(style ?? {});
  }
}

export { CreatePollOptionConfiguration };
