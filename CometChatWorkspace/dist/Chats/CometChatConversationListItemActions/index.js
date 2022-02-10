"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConversationListItemActions = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../../");

var _2 = require("../");

var _style = require("./style.js");

var _delete = _interopRequireDefault(require("./resources/delete.svg"));

/**
 *
 * CometChatConversationListItemActions is a container for actions available for each conversation.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
var CometChatConversationListItemActions = function CometChatConversationListItemActions(props) {
  var showToolTip = function showToolTip(event) {
    var title = event.target.dataset.title;
    event.target.setAttribute("title", title);
  };

  var hideToolTip = function hideToolTip(event) {
    event.target.removeAttribute("title");
  };

  var deleteConversation = function deleteConversation(event) {
    _2.CometChatConversationEvents.emit("onDeleteConversation", props.conversation);

    event.stopPropagation();
  };

  var getOptions = function getOptions() {
    var optionToDelete = null;

    if (props.isOpen) {
      optionToDelete = /*#__PURE__*/_react.default.createElement("li", null, /*#__PURE__*/_react.default.createElement("button", {
        type: "button",
        style: (0, _style.deleteActionStyle)(_delete.default),
        className: "action__button button__delete",
        "data-title": (0, _.localize)("DELETE"),
        onMouseEnter: showToolTip,
        onMouseLeave: hideToolTip,
        onClick: deleteConversation
      }));
    }

    return optionToDelete;
  };

  return getOptions() ? /*#__PURE__*/_react.default.createElement("ul", {
    style: (0, _style.actionWrapperStyle)(props),
    className: "list__item__actions"
  }, getOptions()) : null;
};

exports.CometChatConversationListItemActions = CometChatConversationListItemActions;
CometChatConversationListItemActions.propTypes = {
  /** Conversation object of CometChat SDK */
  conversation: _propTypes.default.objectOf(_chat.CometChat.Conversation),

  /** Enable to hide the delete conversation button */
  isOpen: _propTypes.default.bool,
  style: _propTypes.default.object
};
CometChatConversationListItemActions.defaultProps = {
  conversation: {},
  isOpen: false,
  style: {}
};