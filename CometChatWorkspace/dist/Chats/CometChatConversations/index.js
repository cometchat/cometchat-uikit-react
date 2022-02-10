"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConversations = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../");

var _2 = require("../");

var _hooks = require("./hooks");

var _style = require("./style");

var _back = _interopRequireDefault(require("./resources/back.svg"));

var _create = _interopRequireDefault(require("./resources/create.svg"));

/**
 *
 * CometChatConversations is a container component that wraps and 
 * formats CometChatListBase and CometChatConversationList component, with no behavior of its own.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
var CometChatConversations = function CometChatConversations(props) {
  var _props$configurations, _props$configurations2;

  var conversationListRef = _react.default.useRef(null);

  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      user = _React$useState2[0],
      setUser = _React$useState2[1];

  var _React$useState3 = _react.default.useState(false),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      isDelete = _React$useState4[0],
      setIsDelete = _React$useState4[1];

  var _React$useState5 = _react.default.useState(null),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      conversationToBeDeleted = _React$useState6[0],
      setConversationToBeDeleted = _React$useState6[1];

  var getStartConversationButtonElem = function getStartConversationButtonElem() {
    if (!props.hideStartConversation) {
      return /*#__PURE__*/_react.default.createElement("div", {
        style: (0, _style.startConversationBtnStyle)(props)
      });
    }

    return null;
  };

  var deleteConversation = function deleteConversation() {
    return new Promise(function (resolve, reject) {
      var _conversationToBeDele, _conversationToBeDele2;

      var conversationWith = conversationToBeDeleted.conversationType === _chat.CometChat.RECEIVER_TYPE.GROUP ? conversationToBeDeleted === null || conversationToBeDeleted === void 0 ? void 0 : (_conversationToBeDele = conversationToBeDeleted.conversationWith) === null || _conversationToBeDele === void 0 ? void 0 : _conversationToBeDele.guid : conversationToBeDeleted === null || conversationToBeDeleted === void 0 ? void 0 : (_conversationToBeDele2 = conversationToBeDeleted.conversationWith) === null || _conversationToBeDele2 === void 0 ? void 0 : _conversationToBeDele2.uid;

      _chat.CometChat.deleteConversation(conversationWith, conversationToBeDeleted.conversationType).then(function (deletedConversation) {
        _2.CometChatConversationEvents.emit("onDeleteConversationSuccess", conversationToBeDeleted);

        removeConversation(conversationToBeDeleted);
        resolve(deletedConversation);
      }).catch(function (error) {
        _2.CometChatConversationEvents.emit("onError", conversationToBeDeleted);

        reject(error);
      });
    });
  };

  var removeConversation = function removeConversation(deletedConversation) {
    conversationListRef.current.removeConversation(deletedConversation);
    setConversationToBeDeleted(null);
    setIsDelete(false);
  };

  var confirmDelete = function confirmDelete(conversation) {
    setConversationToBeDeleted(conversation);
    setIsDelete(true);
  };

  var cancelDelete = function cancelDelete() {
    return setIsDelete(false);
  };

  var searchHandler = function searchHandler(searchText) {
    //search is not implemented
    return false;
  };

  _2.CometChatConversationEvents.addListener("onDeleteConversation", "deletelistener1", confirmDelete);

  _2.CometChatConversationEvents.addListener("onItemClick", "clicklistener1", function () {
    console.log("onItemClick called");
  }); // CometChatConversationEvents.addListener({"event": "onItemClick", "id": "clicklistener2", "callback": () => {
  // 	console.log("onItemClick called");
  // }});


  (0, _hooks.Hooks)(setUser);
  var listBackground = ((_props$configurations = props.configurations) === null || _props$configurations === void 0 ? void 0 : _props$configurations.background) || "transparent";
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.containerStyle)(props),
    className: "cometchat__conversations"
  }, getStartConversationButtonElem(), /*#__PURE__*/_react.default.createElement(_.CometChatListBase, {
    width: "100%",
    height: "100%",
    background: props.background,
    border: props.border,
    cornerRadius: props.cornerRadius,
    title: props.title,
    titleFont: props.titleFont,
    titleColor: props.titleColor,
    hideSearch: props.hideSearch,
    searchBorder: props.searchBorder,
    searchBackground: props.searchBackground,
    searchCornerRadius: props.searchCornerRadius,
    searchPlaceholder: props.searchPlaceholder,
    searchTextFont: props.searchTextFont,
    searchTextColor: props.searchTextColor,
    showBackButton: props.showBackButton,
    backIcon: props.backIcon,
    backIconTint: props.backIconTint,
    onSearch: searchHandler
  }, /*#__PURE__*/_react.default.createElement(_2.CometChatConversationList, {
    ref: conversationListRef,
    width: "100%",
    height: "100%",
    loggedInUser: user,
    conversationType: props.conversationType,
    activeConversation: props.activeConversation,
    background: listBackground,
    configurations: (_props$configurations2 = props.configurations) === null || _props$configurations2 === void 0 ? void 0 : _props$configurations2.ConversationListConfiguration
  }), /*#__PURE__*/_react.default.createElement(_.CometChatConfirmDialog, {
    isOpen: isDelete,
    onConfirm: deleteConversation,
    onCancel: cancelDelete,
    width: "50%"
  })));
};

exports.CometChatConversations = CometChatConversations;
CometChatConversations.propTypes = {
  /**  Width of the component  */
  width: _propTypes.default.string,

  /**  Height of the component  */
  height: _propTypes.default.string,

  /** Background of the listbase component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
  background: _propTypes.default.string,

  /** This property sets the listbase component's border. It sets the values of border-width, border-style, and border-color. */
  border: _propTypes.default.string,

  /** This property rounds the corners of the listbase component's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
  cornerRadius: _propTypes.default.string,

  /** Title of the listbase component */
  title: _propTypes.default.string,

  /** This property sets all the different properties of the listbase component's font */
  titleFont: _propTypes.default.string,

  /** This property sets the foreground color value of the listbase component's title text  */
  titleColor: _propTypes.default.string,

  /** Disable search in the listbase component */
  hideSearch: _propTypes.default.bool,

  /** This property sets the border of the search element. It sets the values of border-width, border-style, and border-color. */
  searchBorder: _propTypes.default.string,

  /** This property sets the background color of the search element in the listbase component  */
  searchBackground: _propTypes.default.string,

  /** This property rounds the corners of the search element's outer border edge in the listbase component. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
  searchCornerRadius: _propTypes.default.string,

  /** This property sets the placeholder text of the search element in the listbase component. The placeholder is text shown when the input is empty  */
  searchPlaceholder: _propTypes.default.string,

  /** This property sets all the different properties of the search element's font in the listbase component */
  searchTextFont: _propTypes.default.string,

  /** This property sets the foreground color value of the search text in the listbase component  */
  searchTextColor: _propTypes.default.string,

  /** Enable back button in the listbase component */
  showBackButton: _propTypes.default.bool,

  /** URL for the back button icon in the listbase component */
  backIcon: _propTypes.default.string,

  /** Color of the back button icon in the listbase component */
  backIconTint: _propTypes.default.string,

  /** Enable start conversation button */
  startConversation: _propTypes.default.bool,

  /** URL for the start conversation button icon */
  startConversationIcon: _propTypes.default.string,

  /** Color of the start conversation button icon */
  startConversationIconTint: _propTypes.default.string,

  /** Filter conversation list, fetch only user/group conversations */
  conversationType: _propTypes.default.oneOf(["users", "groups", "both"]).isRequired,

  /** Active conversation */
  activeConversation: _propTypes.default.objectOf(_chat.CometChat.Conversation),

  /** Configurable options of child component */
  configurations: _propTypes.default.object
};
CometChatConversations.defaultProps = {
  width: "100%",
  height: "100vh",
  background: "white",
  border: "1px solid #808080",
  cornerRadius: "0",
  title: "Chats",
  titleFont: "700 22px Inter, sans-serif",
  titleColor: "#141414",
  hideSearch: true,
  searchBorder: "none",
  searchBackground: "rgba(20, 20, 20, 4%)",
  searchCornerRadius: "8px",
  searchPlaceholder: "Search",
  searchTextFont: "400 15px Inter, sans-serif",
  searchTextColor: "rgba(20, 20, 20, 40%)",
  showBackButton: false,
  backIcon: _back.default,
  backIconTint: "#3399FF",
  hideStartConversation: true,
  startConversationIcon: _create.default,
  startConversationIconTint: "#3399ff",
  conversationType: "both",
  activeConversation: null,
  configurations: null
};