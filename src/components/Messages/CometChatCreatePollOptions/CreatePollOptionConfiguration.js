import deleteIcon from "./resources/delete.svg";

import { localize } from "../../../";

import { CreatePollOptionStyle } from "../";

/**
 * @class CreatePollOptionConfiguration
 * @description CreatePollOptionConfiguration class is used for defining the MessageComposer templates.
 * @param {function} onDeleteClick
 * @param {function} onChangeHandler
 * @param {string} option
 * @param {boolean} hasDelete
 * @param {string} placeholderText
 * @param {string} deleteIconUrl
 * @param {object} style
 */

class CreatePollOptionConfiguration {
  constructor({
    hasDelete = false,
    placeholderText = localize("ANSWER"),
    deleteIconURL = deleteIcon,
    onDeleteClick = null,
    onChangeHandler = null,
    option = null,
    style = new CreatePollOptionStyle({}),
  }) {
    this.hasDelete = hasDelete;
    this.placeholderText = placeholderText;
    this.deleteIconURL = deleteIconURL;
    this.onDeleteClick = onDeleteClick;
    this.onChangeHandler = onChangeHandler;
    this.option = option;
    this.style = new CreatePollOptionStyle(style ?? {});
  }
}

export { CreatePollOptionConfiguration };
