"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageComposer = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _chat = require("@cometchat-pro/chat");

require("emoji-mart/css/emoji-mart.css");

var _ = require("../../");

var _2 = require("../");

var _hooks = require("./hooks");

var _style = require("./style");

var _addCircleFilled = _interopRequireDefault(require("./resources/add-circle-filled.svg"));

var _emoji = _interopRequireDefault(require("./resources/emoji.svg"));

var _sendMessage = _interopRequireDefault(require("./resources/send-message.svg"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

/**
 * 
 * CometChatMessageComposer is comprised of title, subtitle, avatar, badgecount and more.
 * with additonal CometChat SDK conversation object
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
var CometChatMessageComposer = function CometChatMessageComposer(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      loggedInUser = _React$useState2[0],
      setLoggedInUser = _React$useState2[1];

  var _React$useState3 = _react.default.useState(null),
      _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
      chatWith = _React$useState4[0],
      setChatWith = _React$useState4[1];

  var _React$useState5 = _react.default.useState(null),
      _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
      chatWithId = _React$useState6[0],
      setChatWithId = _React$useState6[1];

  var _React$useState7 = _react.default.useState(""),
      _React$useState8 = (0, _slicedToArray2.default)(_React$useState7, 2),
      messageInput = _React$useState8[0],
      setMessageInput = _React$useState8[1];

  var _React$useState9 = _react.default.useState(false),
      _React$useState10 = (0, _slicedToArray2.default)(_React$useState9, 2),
      viewComposer = _React$useState10[0],
      setViewComposer = _React$useState10[1];

  var _React$useState11 = _react.default.useState(false),
      _React$useState12 = (0, _slicedToArray2.default)(_React$useState11, 2),
      viewAttachButton = _React$useState12[0],
      setViewAttachButton = _React$useState12[1];

  var _React$useState13 = _react.default.useState(false),
      _React$useState14 = (0, _slicedToArray2.default)(_React$useState13, 2),
      viewSticker = _React$useState14[0],
      setViewSticker = _React$useState14[1];

  var _React$useState15 = _react.default.useState(null),
      _React$useState16 = (0, _slicedToArray2.default)(_React$useState15, 2),
      stickerTemplate = _React$useState16[0],
      setStickerTemplate = _React$useState16[1];

  var _React$useState17 = _react.default.useState(null),
      _React$useState18 = (0, _slicedToArray2.default)(_React$useState17, 2),
      viewStickerTray = _React$useState18[0],
      setViewStickerTray = _React$useState18[1];

  var _React$useState19 = _react.default.useState(false),
      _React$useState20 = (0, _slicedToArray2.default)(_React$useState19, 2),
      viewActionSheet = _React$useState20[0],
      setViewActionSheet = _React$useState20[1];

  var _React$useState21 = _react.default.useState([]),
      _React$useState22 = (0, _slicedToArray2.default)(_React$useState21, 2),
      actionSheetItems = _React$useState22[0],
      setActionSheetItems = _React$useState22[1];

  var _React$useState23 = _react.default.useState(false),
      _React$useState24 = (0, _slicedToArray2.default)(_React$useState23, 2),
      viewCreatePoll = _React$useState24[0],
      setViewCreatePoll = _React$useState24[1];

  var _React$useState25 = _react.default.useState(false),
      _React$useState26 = (0, _slicedToArray2.default)(_React$useState25, 2),
      viewEmojiTray = _React$useState26[0],
      setViewEmojiTray = _React$useState26[1];

  var _React$useState27 = _react.default.useState(null),
      _React$useState28 = (0, _slicedToArray2.default)(_React$useState27, 2),
      messagePreview = _React$useState28[0],
      setMessagePreview = _React$useState28[1];

  var isTyping = null;
  var liveReactionTimeout = 0;
  var disabledState = false;

  var messageInputRef = _react.default.useRef(null);

  var fileInputRef = _react.default.useRef(null);

  var chatRef = _react.default.useRef(chatWith);

  var previewMessageForEdit = function previewMessageForEdit(message) {
    setMessagePreview({
      message: message,
      mode: "edit"
    });
    setMessageInput(message);
    var element = messageInputRef.current;
    var messageText = message.text; //xss extensions data

    var xssData = (0, _2.getExtensionsData)(message, _2.metadataKey.extensions.xssfilter);

    if (xssData && xssData.hasOwnProperty("sanitized_text") && xssData.hasOwnProperty("hasXSS") && xssData.hasXSS === "yes") {
      messageText = xssData.sanitized_text;
    }

    element.focus();
    element.textContent = "";
    pasteHtmlAtCaret(messageText, false);
  };

  var closeMessagePreview = function closeMessagePreview() {
    return setMessagePreview(null);
  };

  var draftMessage = function draftMessage(message) {
    setMessageInput(message);
  };

  var sendMessageOnEnter = function sendMessageOnEnter(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  };

  var sendTextMessage = function sendTextMessage(message) {
    if (!viewEmojiTray) {
      setViewEmojiTray(false);
    }

    if (!messageInput.trim().length) {
      return false;
    }

    if (messagePreview && messagePreview.mode === "edit") {
      editMessage(messagePreview.message);
      return false;
    }

    var textMessage = new _chat.CometChat.TextMessage(chatWithId, messageInput, chatWith); // if (this.props.parentMessageId) {
    // 	textMessage.setParentMessageId(this.props.parentMessageId);
    // }

    textMessage.setSender(loggedInUser);
    textMessage.setReceiver(chatWith);
    textMessage.setText(messageInput);
    textMessage._composedAt = (0, _2.getUnixTimestamp)();
    textMessage._id = (0, _2.ID)();

    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.messageSent, {
      message: textMessage,
      status: _2.messageStatus.inprogress
    });

    _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.outgoingMessage);

    setMessageInput("");
    messageInputRef.current.textContent = "";

    _chat.CometChat.sendMessage(textMessage).then(function (message) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread(_objectSpread({}, message), {}, {
        _id: textMessage._id
      }));

      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageSent, {
        message: messageObject,
        status: _2.messageStatus.success
      });
    }).catch(function (error) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageError, {
        message: textMessage,
        error: error
      });
    });
  };

  var sendMediaMessage = function sendMediaMessage(messageInput, messageType) {
    var mediaMessage = new _chat.CometChat.MediaMessage(chatWithId, messageInput, messageType, chatWith); // if (this.props.parentMessageId) {
    // 	mediaMessage.setParentMessageId(this.props.parentMessageId);
    // }

    console.log("mediaMessage", messageInput, messageType);
    mediaMessage.setSender(loggedInUser);
    mediaMessage.setReceiver(chatWith);
    mediaMessage.setType(messageType);
    mediaMessage.setMetadata((0, _defineProperty2.default)({}, _2.metadataKey.file, messageInput));
    mediaMessage._composedAt = (0, _2.getUnixTimestamp)();
    mediaMessage._id = (0, _2.ID)();

    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.messageSent, {
      message: mediaMessage,
      status: _2.messageStatus.inprogress
    });

    _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.outgoingMessage);

    _chat.CometChat.sendMessage(mediaMessage).then(function (message) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread(_objectSpread({}, message), {}, {
        _id: mediaMessage._id
      }));

      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageSent, {
        message: messageObject,
        status: _2.messageStatus.success
      });
    }).catch(function (error) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageError, {
        message: mediaMessage,
        error: error
      });
    });
  };

  var sendSticker = function sendSticker(stickerMessage) {
    var customData = {
      sticker_url: stickerMessage.stickerUrl,
      sticker_name: stickerMessage.stickerName
    };
    var customMessage = new _chat.CometChat.CustomMessage(chatWithId, chatWith, _2.CometChatCustomMessageTypes.sticker, customData); // if (props.parentMessage && props.parentMessage.id) {
    // 	customMessage.setParentMessageId(this.props.parentMessageId);
    // }

    customMessage.setSender(loggedInUser);
    customMessage.setReceiver(chatWith);
    customMessage.setMetadata({
      incrementUnreadCount: true
    });
    customMessage._composedAt = (0, _2.getUnixTimestamp)();
    customMessage._id = (0, _2.ID)();

    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.messageSent, {
      message: customMessage,
      status: _2.messageStatus.inprogress
    });

    _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.outgoingMessage);

    _chat.CometChat.sendCustomMessage(customMessage).then(function (message) {
      var messageObject = new _chat.CometChat.BaseMessage(_objectSpread(_objectSpread({}, message), {}, {
        _id: customMessage._id
      }));

      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageSent, {
        message: messageObject,
        status: _2.messageStatus.success
      });
    }).catch(function (error) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageError, {
        message: customMessage,
        error: error
      });
    });
  };

  var editMessage = function editMessage(message) {
    endTyping(null, null);
    var messageText = messageInput.trim();
    var textMessage = new _chat.CometChat.TextMessage(chatWithId, messageText, chatWith);
    textMessage.setId(messagePreview.message.id);

    var newMessage = _objectSpread(_objectSpread({}, textMessage), {}, {
      messageFrom: messagePreview.message.messageFrom
    });

    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.messageEdited, newMessage);

    setMessageInput("");
    messageInputRef.current.textContent = "";

    _.CometChatSoundManager.play(_.CometChatSoundManager.Sound.outgoingMessage);

    setMessagePreview(null);

    _chat.CometChat.editMessage(textMessage).then(function (message) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.messageEdited, message);
    }).catch(function (error) {
      _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.onMessageError, {
        error: error,
        message: textMessage
      });
    });
  };

  var replyToMessage = function replyToMessage(message) {};

  var startTyping = function startTyping(endTypingTimeout, typingMetadata) {
    //if typing is disabled
    if (!props.enableTyping) {
      return false;
    } //if typing is in progress


    if (isTyping) {
      return false;
    }

    var typingInterval = endTypingTimeout || 5000;
    var metadata = typingMetadata || undefined;
    var typingNotification = new _chat.CometChat.TypingIndicator(chatWithId, chatWith, metadata);

    _chat.CometChat.startTyping(typingNotification);

    isTyping = setTimeout(function () {
      endTyping(null, typingMetadata);
    }, typingInterval);
  };

  var endTyping = function endTyping(event, typingMetadata) {
    //fixing synthetic issue
    if (event) {
      event.persist();
    } //if typing is disabled


    if (!props.enableTyping) {
      return false;
    }

    var metadata = typingMetadata || undefined;
    var typingNotification = new _chat.CometChat.TypingIndicator(chatWithId, chatWith, metadata);

    _chat.CometChat.endTyping(typingNotification);

    clearTimeout(isTyping);
    isTyping = null;
  };

  var fileInputHandler = function fileInputHandler(id) {
    if (!fileInputRef.current) {
      return false;
    }

    fileInputRef.current.id = id;
    fileInputRef.current.click();
  };

  var fileInputChangeHandler = function fileInputChangeHandler(event) {
    var uploadedFile = event.target.files["0"];
    var reader = new FileReader(); // Creating reader instance from FileReader() API

    reader.addEventListener("load", function (event) {
      var newFile = new File([reader.result], uploadedFile.name, uploadedFile);
      sendMediaMessage(newFile, fileInputRef.current.id);
      fileInputRef.current.value = "";
    }, false);
    reader.readAsArrayBuffer(uploadedFile);
  };

  var closeCreatePoll = function closeCreatePoll() {
    setViewCreatePoll(false);
  };

  var onPollSubmit = function onPollSubmit() {
    setViewCreatePoll(false);
  };

  var shareCollaborativeDocument = function shareCollaborativeDocument() {
    _chat.CometChat.callExtension("document", "POST", "v1/create", {
      receiver: chatRef.current.chatWithId,
      receiverType: chatRef.current.chatWith
    }).catch(function (error) {});
  };

  var shareCollaborativeWhiteboard = function shareCollaborativeWhiteboard() {
    _chat.CometChat.callExtension("whiteboard", "POST", "v1/create", {
      receiver: chatRef.current.chatWithId,
      receiverType: chatRef.current.chatWith
    }).catch(function (error) {});
  };

  var inputChangeHandler = function inputChangeHandler(event) {
    startTyping();
    var elem = event.currentTarget;
    var messageInput = elem.textContent.trim();

    if (!messageInput.length) {
      event.currentTarget.textContent = messageInput;
    }

    setMessageInput(elem.innerText);
  };

  var toggleStickersTray = function toggleStickersTray() {
    setViewStickerTray(function (prevViewStickerOption) {
      return !prevViewStickerOption;
    });
  };

  var onEmojiSelect = function onEmojiSelect(emoji) {
    var element = messageInputRef.current;
    element.focus();
    pasteHtmlAtCaret(emoji.native, false);
    setMessageInput(element.innerText);
  };

  var pasteHtmlAtCaret = function pasteHtmlAtCaret(html, selectPastedContent) {
    var sel, range;
    var chatWindow = window;

    if (chatWindow.getSelection) {
      // IE9 and non-IE
      sel = chatWindow.getSelection();

      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents(); // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)

        var el = document.createElement("div");
        el.innerText = html;
        var frag = document.createDocumentFragment(),
            node,
            lastNode;

        while (node = el.firstChild) {
          lastNode = frag.appendChild(node);
        }

        var firstNode = frag.firstChild;
        range.insertNode(frag); // Preserve the selection

        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);

          if (selectPastedContent) {
            range.setStartBefore(firstNode);
          } else {
            range.collapse(true);
          }

          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    } else if ((sel = document.selection) && sel.type !== "Control") {
      // IE < 9
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);

      if (selectPastedContent) {
        range = sel.createRange();
        range.setEndPoint("StartToStart", originalRange);
        range.select();
      }
    }
  };

  var attachmentClickHandler = function attachmentClickHandler() {
    setViewActionSheet(function (prevViewActionSheet) {
      return !prevViewActionSheet;
    });
  };

  var actionSheetClickHandler = function actionSheetClickHandler(actionSheetItemProps) {
    switch (actionSheetItemProps.id) {
      case _2.CometChatMessageTypes.file:
      case _2.CometChatMessageTypes.image:
      case _2.CometChatMessageTypes.audio:
      case _2.CometChatMessageTypes.video:
        fileInputHandler(actionSheetItemProps.id);
        break;

      case _2.CometChatCustomMessageTypes.poll:
        {
          setViewActionSheet(false);
          setViewCreatePoll(true);
          break;
        }

      case _2.CometChatCustomMessageTypes.document:
        {
          shareCollaborativeDocument();
          break;
        }

      case _2.CometChatCustomMessageTypes.whiteboard:
        {
          shareCollaborativeWhiteboard();
          break;
        }

      case _2.CometChatCustomMessageTypes.location:
        break;

      default:
        break;
    }
  };

  var emojiClickHandler = function emojiClickHandler() {
    setViewEmojiTray(function (prevViewEmojiOption) {
      return !prevViewEmojiOption;
    });
  };

  var stickerClickHandler = function stickerClickHandler() {
    if (stickerTemplate.actionCallback) {
      stickerTemplate.actionCallback();
    } else {
      toggleStickersTray();
    }
  };

  var shareLiveReaction = function shareLiveReaction() {
    //if already live reaction in progress
    if (liveReactionTimeout) {
      return false;
    } //fetching the metadata type from constants


    var metadata = {
      type: _2.metadataKey.liveReaction,
      reaction: props.liveReaction
    }; //send transient message

    var transientMessage = new _chat.CometChat.TransientMessage(chatWithId, chatWith, metadata);

    _chat.CometChat.sendTransientMessage(transientMessage); //set timeout till the next share


    liveReactionTimeout = setTimeout(clearTimeout(liveReactionTimeout), _2.messageConstants.liveReactionTimeout); //emit event to share live reaction

    _2.CometChatMessageEvents.emit(_2.CometChatMessageEvents.shareLiveReaction, {
      reaction: props.liveReaction
    });
  };

  var attachOption = viewAttachButton ? /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.stickyAttachButtonStyle)(props),
    className: "attachment__icon",
    onClick: attachmentClickHandler,
    title: (0, _.localize)("ATTACH")
  }, /*#__PURE__*/_react.default.createElement("i", null)) : null;
  var actionSheet = viewActionSheet ? /*#__PURE__*/_react.default.createElement(_.CometChatActionSheet, {
    actions: actionSheetItems,
    style: {
      position: "relative",
      zIndex: "3",
      left: "15px",
      bottom: "-75px"
    }
  }) : null;
  var createPoll = null; //viewCreatePoll ? <CometChatCreatePoll onClose={closeCreatePoll} onSubmit={onPollSubmit} /> : null;

  var stickerButton = viewSticker ? /*#__PURE__*/_react.default.createElement("div", {
    title: (0, _.localize)("STICKER"),
    style: (0, _style.stickerBtnStyle)(props, stickerTemplate),
    className: "button__sticker",
    onClick: stickerClickHandler
  }, /*#__PURE__*/_react.default.createElement("i", null)) : null;
  var previewTray = messagePreview ? /*#__PURE__*/_react.default.createElement(_2.CometChatMessagePreview, {
    messageObject: messagePreview.message,
    onClose: closeMessagePreview
  }) : null;
  var stickerTray = viewStickerTray ? /*#__PURE__*/_react.default.createElement(_2.CometChatStickerKeyboard, {
    onClick: sendSticker,
    onClose: toggleStickersTray
  }) : null;
  var emojiButton = !props.hideEmoji ? /*#__PURE__*/_react.default.createElement("div", {
    title: (0, _.localize)("EMOJI"),
    style: (0, _style.emojiButtonStyle)(props),
    className: "button__emoji",
    onClick: emojiClickHandler
  }, /*#__PURE__*/_react.default.createElement("i", null)) : null;
  var emojiTray = viewEmojiTray ? /*#__PURE__*/_react.default.createElement(_2.CometChatEmojiKeyboard, {
    emojiClicked: onEmojiSelect
  }) : null;
  var liveReactionButton = !props.hideLiveReaction ? /*#__PURE__*/_react.default.createElement("div", {
    title: (0, _.localize)("LIVE_REACTION"),
    style: (0, _style.reactionBtnStyle)(),
    className: "button__reactions",
    onClick: shareLiveReaction
  }, /*#__PURE__*/_react.default.createElement("i", {
    title: props.liveReaction
  }, props.liveReaction)) : null;
  var sendButton = messageInput.length ? /*#__PURE__*/_react.default.createElement("div", {
    title: (0, _.localize)("SEND_MESSAGE"),
    style: (0, _style.sendButtonStyle)(props),
    className: "button__send",
    onClick: sendTextMessage
  }, /*#__PURE__*/_react.default.createElement("i", null)) : null;

  _2.CometChatMessageEvents.addListener(_2.CometChatMessageEvents.previewMessageForEdit, previewMessageForEdit);

  (0, _hooks.Hooks)(props, setLoggedInUser, setChatWith, setChatWithId, chatRef, setViewAttachButton, setViewComposer, setViewSticker, setStickerTemplate, setActionSheetItems, actionSheetClickHandler);
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.chatComposerStyle)(props),
    className: "chat__composer"
  }, previewTray, stickerTray, emojiTray, actionSheet, /*#__PURE__*/_react.default.createElement("input", {
    type: "file",
    ref: fileInputRef,
    style: (0, _style.fileInputStyle)(),
    onChange: fileInputChangeHandler
  }), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.composerInputStyle)(props),
    className: "composer__input"
  }, /*#__PURE__*/_react.default.createElement("div", {
    tabIndex: "-1",
    style: (0, _style.inputInnerStyle)(props),
    className: "input__inner"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.messageInputStyle)(props, disabledState),
    className: "input__message-input",
    contentEditable: "true",
    placeholder: (0, _.localize)("ENTER_YOUR_MESSAGE_HERE"),
    dir: _.CometChatLocalize.getDir(),
    onInput: inputChangeHandler,
    onBlur: function onBlur(event) {
      return endTyping(event);
    },
    onKeyDown: sendMessageOnEnter,
    ref: messageInputRef
  }), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.inputStickyStyle)(disabledState, attachOption, props),
    className: "input__sticky"
  }, attachOption, /*#__PURE__*/_react.default.createElement("div", {
    className: "input__sticky__buttons"
  }, stickerButton, emojiButton, liveReactionButton, sendButton)))), createPoll);
};

exports.CometChatMessageComposer = CometChatMessageComposer;
CometChatMessageComposer.propTypes = {
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  background: _propTypes.default.string,
  border: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  placeholder: _propTypes.default.string,
  placeholderFont: _propTypes.default.string,
  placeholderColor: _propTypes.default.string,
  hideEmoji: _propTypes.default.bool,
  emojiIconURL: _propTypes.default.string,
  emojiIconTint: _propTypes.default.string,
  hideLiveReaction: _propTypes.default.bool,
  liveReaction: _propTypes.default.string,
  hideAttachment: _propTypes.default.bool,
  attachmentIconURL: _propTypes.default.string,
  attachmentIconTint: _propTypes.default.string,
  hideMicrophone: _propTypes.default.bool,
  microphoneIconURL: _propTypes.default.string,
  microphoneIconTint: _propTypes.default.string,
  sendButtonIconURL: _propTypes.default.string,
  sendButtonIconTint: _propTypes.default.string,
  enableTyping: _propTypes.default.bool,
  user: _propTypes.default.object,
  group: _propTypes.default.object,
  configurations: _propTypes.default.array
};
CometChatMessageComposer.defaultProps = {
  width: "100%",
  height: "105px",
  background: "rgb(255, 255, 255)",
  border: "1px solid rgba(20, 20, 20, 0.04)",
  cornerRadius: "0 0 8px 8px",
  inputCornerRadius: "8px",
  placeholder: "Enter your message here",
  placeholderFont: "15px 400 Inter",
  placeholderColor: "rgba(20, 20, 20, 0.6)",
  hideEmoji: false,
  emojiIconURL: _emoji.default,
  emojiIconTint: "rgba(20, 20, 20, 0.46)",
  hideLiveReaction: false,
  liveReaction: "❤️",
  hideAttachment: false,
  attachmentIconURL: _addCircleFilled.default,
  attachmentIconTint: "rgba(20, 20, 20, 0.46)",
  hideMicrophone: true,
  microphoneIconURL: "",
  microphoneIconTint: "rgba(20, 20, 20, 0.46)",
  sendButtonIconURL: _sendMessage.default,
  sendButtonIconTint: "#39f",
  typingIndicator: true,
  user: null,
  group: null,
  configurations: []
};