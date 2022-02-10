"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatConversationListItem = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var React = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _chat = require("@cometchat-pro/chat");

var _hooks = require("./hooks");

var _receiptTypes = require("./receiptTypes");

var _CometChatAvatar = require("../../../Shared/SecondaryComponents/CometChatAvatar");

var _CometChatBadgeCount = require("../../../Shared/SecondaryComponents/CometChatBadgeCount");

var _CometChatStatusIndicator = require("../../../Shared/SecondaryComponents/CometChatStatusIndicator");

var _Shared = require("../../../Shared");

var _Chats = require("../../../Chats");

var _lastMessageRead = _interopRequireDefault(require("./resources/last-message-read.svg"));

var _lastMessageDelivered = _interopRequireDefault(require("./resources/last-message-delivered.svg"));

var _lastMessageSent = _interopRequireDefault(require("./resources/last-message-sent.svg"));

var _lastMessageWait = _interopRequireDefault(require("./resources/last-message-wait.svg"));

var _lastMessageError = _interopRequireDefault(require("./resources/last-message-error.svg"));

var _style2 = require("./style");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * 
 * CometChatConversationsListItem is comprised of title, subtitle, avatar, badgecount and more.
 * with additonal CometChat SDK conversation object
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatConversationListItem = function CometChatConversationListItem(props) {
  var _React$useState = React.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      avatar = _React$useState2[0],
      setAvatar = _React$useState2[1];

  var _React$useState3 = React.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      presence = _React$useState4[0],
      setPresence = _React$useState4[1];

  var _React$useState5 = React.useState(false),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      isHovering = _React$useState6[0],
      setIsHovering = _React$useState6[1];

  var _React$useState7 = React.useState(""),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      title = _React$useState8[0],
      setTitle = _React$useState8[1];

  var _React$useState9 = React.useState(""),
      _React$useState10 = (0, _slicedToArray2.default)(_React$useState9, 2),
      subTitle = _React$useState10[0],
      setSubTitle = _React$useState10[1];

  var _React$useState11 = React.useState(""),
      _React$useState12 = (0, _slicedToArray2.default)(_React$useState11, 2),
      time = _React$useState12[0],
      setTime = _React$useState12[1];

  var _React$useState13 = React.useState(0),
      _React$useState14 = (0, _slicedToArray2.default)(_React$useState13, 2),
      unreadCount = _React$useState14[0],
      setUnreadCount = _React$useState14[1];

  var _React$useState15 = React.useState(""),
      _React$useState16 = (0, _slicedToArray2.default)(_React$useState15, 2),
      receiptType = _React$useState16[0],
      setReceiptType = _React$useState16[1];

  var _React$useState17 = React.useState(null),
      _React$useState18 = (0, _slicedToArray2.default)(_React$useState17, 2),
      threadIndicator = _React$useState18[0],
      setThreadIndicator = _React$useState18[1];

  (0, _hooks.Hooks)(props, setAvatar, setPresence, setTitle, setSubTitle, setTime, setUnreadCount, setReceiptType, setThreadIndicator);

  var showConversationItemActions = function showConversationItemActions() {
    if (isHovering === false) {
      setIsHovering(true);
    }
  };

  var hideConversationItemActions = function hideConversationItemActions() {
    if (isHovering === true) {
      setIsHovering(false);
    }
  };

  var showToolTip = function showToolTip(event) {
    var elem = event.target;
    var scrollWidth = elem.scrollWidth;
    var clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.setAttribute("title", elem.textContent);
  };

  var hideToolTip = function hideToolTip(event) {
    var elem = event.target;
    var scrollWidth = elem.scrollWidth;
    var clientWidth = elem.clientWidth;

    if (scrollWidth <= clientWidth) {
      return false;
    }

    elem.removeAttribute("title");
  };

  var clickHandler = function clickHandler() {
    _Chats.CometChatConversationEvents.emit("onItemClick", props.conversation);
  };

  var getAvatar = function getAvatar() {
    var _props$configurations, _props$configurations2, _props$configurations3, _props$configurations4, _props$configurations5, _props$configurations6, _props$configurations7, _props$configurations8, _props$configurations9, _props$configurations10, _props$configurations11, _props$configurations12, _props$configurations13, _props$configurations14, _props$configurations15, _props$configurations16;

    if (!avatar) {
      return null;
    }

    var width = ((_props$configurations = props.configurations) === null || _props$configurations === void 0 ? void 0 : (_props$configurations2 = _props$configurations.avatarConfiguration) === null || _props$configurations2 === void 0 ? void 0 : _props$configurations2.width) || "36px";
    var height = ((_props$configurations3 = props.configurations) === null || _props$configurations3 === void 0 ? void 0 : (_props$configurations4 = _props$configurations3.avatarConfiguration) === null || _props$configurations4 === void 0 ? void 0 : _props$configurations4.height) || "36px";
    var cornerRadius = ((_props$configurations5 = props.configurations) === null || _props$configurations5 === void 0 ? void 0 : (_props$configurations6 = _props$configurations5.avatarConfiguration) === null || _props$configurations6 === void 0 ? void 0 : _props$configurations6.cornerRadius) || "50%";
    var borderWidth = ((_props$configurations7 = props.configurations) === null || _props$configurations7 === void 0 ? void 0 : (_props$configurations8 = _props$configurations7.avatarConfiguration) === null || _props$configurations8 === void 0 ? void 0 : _props$configurations8.borderWidth) || "1px";
    var borderStyle = ((_props$configurations9 = props.configurations) === null || _props$configurations9 === void 0 ? void 0 : (_props$configurations10 = _props$configurations9.avatarConfiguration) === null || _props$configurations10 === void 0 ? void 0 : _props$configurations10.borderStyle) || "solid";
    var outerViewWidth = ((_props$configurations11 = props.configurations) === null || _props$configurations11 === void 0 ? void 0 : (_props$configurations12 = _props$configurations11.avatarConfiguration) === null || _props$configurations12 === void 0 ? void 0 : _props$configurations12.outerViewWidth) || "2px";
    var outerViewStyle = ((_props$configurations13 = props.configurations) === null || _props$configurations13 === void 0 ? void 0 : (_props$configurations14 = _props$configurations13.avatarConfiguration) === null || _props$configurations14 === void 0 ? void 0 : _props$configurations14.outerViewStyle) || "2px";
    var outerViewSpacing = ((_props$configurations15 = props.configurations) === null || _props$configurations15 === void 0 ? void 0 : (_props$configurations16 = _props$configurations15.avatarConfiguration) === null || _props$configurations16 === void 0 ? void 0 : _props$configurations16.outerViewSpacing) || "4px";
    var border = "".concat(borderWidth, " ").concat(borderStyle, " rgba(20, 20, 20, 8%)");
    var outerView = "".concat(outerViewWidth, " ").concat(outerViewStyle, " #39f");

    if (props.hideAvatar === false && props.avatar && props.avatar.length) {
      return /*#__PURE__*/React.createElement(_CometChatAvatar.CometChatAvatar, {
        image: avatar,
        width: width,
        height: height,
        cornerRadius: cornerRadius,
        border: border,
        outerView: outerView,
        outerViewSpacing: outerViewSpacing
      });
    } else if (props.hideAvatar === false && props.conversation && props.conversation.conversationType && props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.USER) {
      return /*#__PURE__*/React.createElement(_CometChatAvatar.CometChatAvatar, {
        user: avatar,
        width: width,
        height: height,
        cornerRadius: cornerRadius,
        border: border,
        outerView: outerView,
        outerViewSpacing: outerViewSpacing
      });
    } else if (props.hideAvatar === false && props.conversation && props.conversation.conversationType && props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.GROUP) {
      return /*#__PURE__*/React.createElement(_CometChatAvatar.CometChatAvatar, {
        group: avatar,
        width: width,
        height: height,
        cornerRadius: cornerRadius,
        border: border,
        outerView: outerView,
        outerViewSpacing: outerViewSpacing
      });
    }

    return null;
  };

  var getPresence = function getPresence() {
    if (!presence) {
      return null;
    }

    if (props.hideStatusIndicator === false && (props.statusIndicator || props.conversation && props.conversation.conversationType && props.conversation.conversationWith && props.conversation.conversationWith.status && props.conversation.conversationType === _chat.CometChat.RECEIVER_TYPE.USER)) {
      var _props$configurations17, _props$configurations18, _props$configurations19, _props$configurations20, _props$configurations21, _props$configurations22, _props$configurations23, _props$configurations24, _props$configurations25, _props$configurations26, _props$configurations27, _props$configurations28, _props$configurations29, _props$configurations30;

      var width = ((_props$configurations17 = props.configurations) === null || _props$configurations17 === void 0 ? void 0 : (_props$configurations18 = _props$configurations17.statusIndicatorConfiguration) === null || _props$configurations18 === void 0 ? void 0 : _props$configurations18.width) || "14px";
      var height = ((_props$configurations19 = props.configurations) === null || _props$configurations19 === void 0 ? void 0 : (_props$configurations20 = _props$configurations19.statusIndicatorConfiguration) === null || _props$configurations20 === void 0 ? void 0 : _props$configurations20.height) || "14px";
      var cornerRadius = ((_props$configurations21 = props.configurations) === null || _props$configurations21 === void 0 ? void 0 : (_props$configurations22 = _props$configurations21.statusIndicatorConfiguration) === null || _props$configurations22 === void 0 ? void 0 : _props$configurations22.cornerRadius) || "50%";
      var border = ((_props$configurations23 = props.configurations) === null || _props$configurations23 === void 0 ? void 0 : (_props$configurations24 = _props$configurations23.statusIndicatorConfiguration) === null || _props$configurations24 === void 0 ? void 0 : _props$configurations24.border) || "2px solid #fff";
      var onlineBackgroundColor = ((_props$configurations25 = props.configurations) === null || _props$configurations25 === void 0 ? void 0 : (_props$configurations26 = _props$configurations25.statusIndicatorConfiguration) === null || _props$configurations26 === void 0 ? void 0 : _props$configurations26.onlineBackgroundColor) || "#3BDF2F";
      var offlineBackgroundColor = ((_props$configurations27 = props.configurations) === null || _props$configurations27 === void 0 ? void 0 : (_props$configurations28 = _props$configurations27.statusIndicatorConfiguration) === null || _props$configurations28 === void 0 ? void 0 : _props$configurations28.offlineBackgroundColor) || "#C4C4C4";

      var _style = ((_props$configurations29 = props.configurations) === null || _props$configurations29 === void 0 ? void 0 : (_props$configurations30 = _props$configurations29.statusIndicatorConfiguration) === null || _props$configurations30 === void 0 ? void 0 : _props$configurations30.style) || {
        position: "absolute",
        bottom: "1px",
        right: "0px"
      };

      return /*#__PURE__*/React.createElement(_CometChatStatusIndicator.CometChatStatusIndicator, {
        status: presence,
        width: width,
        height: height,
        cornerRadius: cornerRadius,
        border: border,
        onlineBackgroundColor: onlineBackgroundColor,
        offlineBackgroundColor: offlineBackgroundColor,
        style: _style
      });
    }

    return null;
  };

  var getTime = function getTime() {
    if (!time) {
      return null;
    }

    if (props.time || props.conversation && (props.conversation.lastMessage._composedAt || props.conversation.lastMessage.sentAt)) {
      return /*#__PURE__*/React.createElement("span", {
        style: (0, _style2.itemTimeStyle)(props),
        className: "list__item__timestamp"
      }, time);
    }

    return null;
  };

  var getTypingIndicator = function getTypingIndicator() {
    if (props.showTypingIndicator && props.typingIndicatorText.trim().length) {
      return /*#__PURE__*/React.createElement("div", {
        style: (0, _style2.typingTextStyle)(props),
        className: "item__typingtext"
      }, props.typingIndicatorText.trim());
    }
  };

  var getSubTitle = function getSubTitle() {
    if (!props.showTypingIndicator && subTitle) {
      return /*#__PURE__*/React.createElement("div", {
        style: (0, _style2.subTitleStyle)(props),
        className: "item__subtitle",
        onMouseEnter: showToolTip,
        onMouseLeave: hideToolTip
      }, subTitle);
    }

    return null;
  };

  var getUnreadCount = function getUnreadCount() {
    if (props.hideUnreadCount === false && (props.unreadCount || props.conversation && props.conversation.unreadMessageCount)) {
      var _props$configurations31, _props$configurations32, _props$configurations33, _props$configurations34, _props$configurations35, _props$configurations36, _props$configurations37, _props$configurations38, _props$configurations39, _props$configurations40;

      var width = ((_props$configurations31 = props.configurations) === null || _props$configurations31 === void 0 ? void 0 : (_props$configurations32 = _props$configurations31.badgeCountConfiguration) === null || _props$configurations32 === void 0 ? void 0 : _props$configurations32.width) || "24px";
      var height = ((_props$configurations33 = props.configurations) === null || _props$configurations33 === void 0 ? void 0 : (_props$configurations34 = _props$configurations33.badgeCountConfiguration) === null || _props$configurations34 === void 0 ? void 0 : _props$configurations34.height) || "20px";
      var cornerRadius = ((_props$configurations35 = props.configurations) === null || _props$configurations35 === void 0 ? void 0 : (_props$configurations36 = _props$configurations35.badgeCountConfiguration) === null || _props$configurations36 === void 0 ? void 0 : _props$configurations36.cornerRadius) || "11px";
      var borderWidth = ((_props$configurations37 = props.configurations) === null || _props$configurations37 === void 0 ? void 0 : (_props$configurations38 = _props$configurations37.badgeCountConfiguration) === null || _props$configurations38 === void 0 ? void 0 : _props$configurations38.borderWidth) || "1px";
      var borderStyle = ((_props$configurations39 = props.configurations) === null || _props$configurations39 === void 0 ? void 0 : (_props$configurations40 = _props$configurations39.badgeCountConfiguration) === null || _props$configurations40 === void 0 ? void 0 : _props$configurations40.borderStyle) || "solid";
      var border = "".concat(borderWidth, " ").concat(borderStyle, " transparent");
      return /*#__PURE__*/React.createElement(_CometChatBadgeCount.CometChatBadgeCount, {
        count: unreadCount,
        width: width,
        height: height,
        cornerRadius: cornerRadius,
        border: border
      });
    }

    return null;
  };

  var getReceiptType = function getReceiptType() {
    if (props.hideReceipt) {
      return null;
    }

    if (props.receipt && _receiptTypes.receiptTypes.hasOwnProperty(props.receipt)) {
      if (props.receipt === _receiptTypes.receiptTypes["sending"]) {
        return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
          messageWaitIcon: receiptType
        });
      } else if (props.receipt === _receiptTypes.receiptTypes["sent"]) {
        return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
          messageSentIcon: receiptType
        });
      } else if (props.receipt === _receiptTypes.receiptTypes["delivered"]) {
        return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
          messageDeliveredIcon: receiptType
        });
      } else if (props.receipt === _receiptTypes.receiptTypes["read"]) {
        return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
          messageReadIcon: receiptType
        });
      } else if (props.receipt === _receiptTypes.receiptTypes["error"]) {
        return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
          messageErrorIcon: receiptType
        });
      }
    } else if (props.conversation && props.conversation.lastMessage) {
      var _props$configurations41, _props$configurations42, _props$configurations43, _props$configurations44, _props$configurations45, _props$configurations46, _props$configurations47, _props$configurations48, _props$configurations49, _props$configurations50;

      var messageWaitIcon = ((_props$configurations41 = props.configurations) === null || _props$configurations41 === void 0 ? void 0 : (_props$configurations42 = _props$configurations41.messageReceiptConfiguration) === null || _props$configurations42 === void 0 ? void 0 : _props$configurations42.messageWaitIcon) || _lastMessageWait.default;
      var messageSentIcon = ((_props$configurations43 = props.configurations) === null || _props$configurations43 === void 0 ? void 0 : (_props$configurations44 = _props$configurations43.messageReceiptConfiguration) === null || _props$configurations44 === void 0 ? void 0 : _props$configurations44.messageSentIcon) || _lastMessageSent.default;
      var messageDeliveredIcon = ((_props$configurations45 = props.configurations) === null || _props$configurations45 === void 0 ? void 0 : (_props$configurations46 = _props$configurations45.messageReceiptConfiguration) === null || _props$configurations46 === void 0 ? void 0 : _props$configurations46.messageDeliveredIcon) || _lastMessageDelivered.default;
      var messageReadIcon = ((_props$configurations47 = props.configurations) === null || _props$configurations47 === void 0 ? void 0 : (_props$configurations48 = _props$configurations47.messageReceiptConfiguration) === null || _props$configurations48 === void 0 ? void 0 : _props$configurations48.messageReadIcon) || _lastMessageRead.default;
      var messageErrorIcon = ((_props$configurations49 = props.configurations) === null || _props$configurations49 === void 0 ? void 0 : (_props$configurations50 = _props$configurations49.messageReceiptConfiguration) === null || _props$configurations50 === void 0 ? void 0 : _props$configurations50.messageErrorIcon) || _lastMessageError.default;
      return /*#__PURE__*/React.createElement(_Shared.CometChatMessageReceipt, {
        messageObject: props.conversation.lastMessage,
        messageWaitIcon: messageWaitIcon,
        messageSentIcon: messageSentIcon,
        messageDeliveredIcon: messageDeliveredIcon,
        messageReadIcon: messageReadIcon,
        messageErrorIcon: messageErrorIcon
      });
    }

    return null;
  };

  var getThreadIndicator = function getThreadIndicator() {
    if (props.hideThreadIndicator === false && props.conversation && props.conversation.lastMessage && props.conversation.lastMessage.parentMessageId) {
      return /*#__PURE__*/React.createElement("div", {
        style: (0, _style2.itemThreadIndicatorStyle)(props),
        className: "item__thread"
      }, threadIndicator);
    }

    return null;
  };

  var showDeleteConversation = false;

  if (props.showDeleteConversation) {
    showDeleteConversation = isHovering ? true : false;
  }

  var leftRightPosition = _Shared.CometChatLocalize.isRTL() ? {
    left: "16px"
  } : {
    right: "16px"
  };

  var style = _objectSpread({
    position: "absolute",
    top: "0",
    minWidth: "70px",
    width: "auto",
    height: "100%"
  }, leftRightPosition);

  return /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.listItemStyle)(props),
    dir: _Shared.CometChatLocalize.getDir(),
    className: "list__item",
    onMouseEnter: showConversationItemActions,
    onMouseLeave: hideConversationItemActions,
    onClick: clickHandler
  }, /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.itemThumbnailStyle)(),
    className: "item__thumbnail"
  }, getAvatar(), getPresence()), /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.itemDetailStyle)(props),
    className: "item__details"
  }, /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.itemTitleStyle)(),
    className: "item__title"
  }, /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.titleStyle)(props),
    className: "item__title",
    onMouseEnter: showToolTip,
    onMouseLeave: hideToolTip
  }, title), getTime()), getThreadIndicator(), /*#__PURE__*/React.createElement("div", {
    style: (0, _style2.itemSubTitleStyle)(),
    className: "item__subtitle"
  }, getReceiptType(), getSubTitle(), getTypingIndicator(), getUnreadCount())), /*#__PURE__*/React.createElement(_Chats.CometChatConversationListItemActions, {
    conversation: props.conversation,
    isOpen: showDeleteConversation,
    style: style
  }));
};

exports.CometChatConversationListItem = CometChatConversationListItem;
CometChatConversationListItem.propTypes = {
  /**  Width of the component  */
  width: _propTypes.default.string,

  /**  Height of the component  */
  height: _propTypes.default.string,

  /** This property sets the component's border. It sets the values of border-width, border-style, and border-color. */
  border: _propTypes.default.string,

  /** Background of the component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
  background: _propTypes.default.string,

  /** Conversation object of CometChat SDK */
  conversation: _propTypes.default.object,

  /** Title for each conversation */
  title: _propTypes.default.string,

  /** This property sets the foreground color value for the title text  */
  titleColor: _propTypes.default.string,

  /** This property sets all the different properties of font for the title text */
  titleFont: _propTypes.default.string,

  /** Subtitle for each conversation */
  subTitle: _propTypes.default.string,

  /** This property sets the foreground color value for the subtitle text  */
  subTitleColor: _propTypes.default.string,

  /** This property sets all the different properties of font for the subtitle text */
  subTitleFont: _propTypes.default.string,

  /** timestamp of each conversation */
  time: _propTypes.default.string,

  /** This property sets the foreground color value of the timestamp */
  timeColor: _propTypes.default.string,

  /** This property sets all the different properties of font of the timestamp */
  timeFont: _propTypes.default.string,

  /** Disable user presence of the user in the conversation */
  hideStatusIndicator: _propTypes.default.bool,

  /** User presence of the user in the conversation */
  statusIndicator: _propTypes.default.oneOf(["online", "offline"]),

  /** Disable avatar for a conversation */
  hideAvatar: _propTypes.default.bool,

  /** Thumbnail URL for the avatar */
  avatar: _propTypes.default.string,

  /** Disable badge count of a conversation */
  hideUnreadCount: _propTypes.default.bool,

  /** Count of unread messages */
  unreadCount: _propTypes.default.number,

  /** Enable read receipt for a conversation */
  hideReceipt: _propTypes.default.bool,

  /** Read receipt for the last message */
  receipt: _propTypes.default.oneOf(["", "error", "sending", "sent", "delivered", "read"]),

  /** Enable typing text */
  showTypingIndicator: _propTypes.default.bool,

  /** Typing text to be shown */
  typingIndicatorText: _propTypes.default.string,

  /** This property sets the foreground color value of the typing text */
  typingIndicatorTextColor: _propTypes.default.string,

  /** This property sets all the different properties of font of the typing text */
  typingIndicatorTextFont: _propTypes.default.string,

  /** Disable indicator if the last message is part of a threaded conversation */
  hideThreadIndicator: _propTypes.default.bool,

  /** Text to be shown if the last message is part of a threaded conversation */
  threadIndicatorText: _propTypes.default.string,

  /** This property sets the foreground color value for the thread indicator */
  threadIndicatorTextColor: _propTypes.default.string,

  /** This property sets all the different properties of font of the thread indicator */
  threadIndicatorTextFont: _propTypes.default.string,

  /** Hide last message when the message is of category action and type groupMember */
  hideGroupActionMessages: _propTypes.default.bool,

  /** Hide last message when the last message was deleted */
  hideDeletedMessages: _propTypes.default.bool,

  /** Hide delete conversation button */
  showDeleteConversation: _propTypes.default.bool,

  /** Used to apply selected styling */
  isActive: _propTypes.default.bool,

  /** Configurable options of child component */
  configurations: _propTypes.default.object
}; // Specifies the default values for props:

CometChatConversationListItem.defaultProps = {
  conversation: null,
  width: "100%",
  height: "auto",
  border: "1px solid rgba(20, 20, 20, 10%)",
  background: "transparent",
  title: "",
  titleColor: "rgba(20,20,20)",
  titleFont: "600 15px Inter, sans-serif",
  subTitle: "",
  subTitleColor: "rgba(20, 20, 20, 60%)",
  subTitleFont: "400 13px Inter, sans-serif",
  time: "",
  timeColor: "#141414",
  timeFont: "400 12px Inter",
  statusIndicator: null,
  hideStatusIndicator: false,
  avatar: null,
  hideAvatar: false,
  unreadCount: 0,
  hideUnreadCount: false,
  receipt: "",
  hideReceipt: true,
  showTypingIndicator: false,
  typingIndicatorText: "",
  typingIndicatorTextColor: "rgba(20, 20, 20, 60%)",
  typingIndicatorTextFont: "400 13px Inter, sans-serif",
  hideThreadIndicator: false,
  threadIndicatorText: (0, _Shared.localize)("IN_A_THREAD"),
  threadIndicatorTextColor: "rgba(20, 20, 20, 60%)",
  threadIndicatorTextFont: "400 13px Inter, sans-serif",
  hideGroupActionMessages: false,
  hideDeletedMessages: false,
  showDeleteConversation: true,
  isActive: false,
  configurations: null
};