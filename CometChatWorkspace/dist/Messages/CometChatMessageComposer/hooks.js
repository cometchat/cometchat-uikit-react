"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _chat = require("@cometchat-pro/chat");

var _ = require("../");

var _fileUpload = _interopRequireDefault(require("./resources/file-upload.svg"));

var _image = _interopRequireDefault(require("./resources/image.svg"));

var _audioFile = _interopRequireDefault(require("./resources/audio-file.svg"));

var _video = _interopRequireDefault(require("./resources/video.svg"));

var _polls = _interopRequireDefault(require("./resources/polls.svg"));

var _collaborativeDocument = _interopRequireDefault(require("./resources/collaborative-document.svg"));

var _collaborativeWhiteboard = _interopRequireDefault(require("./resources/collaborative-whiteboard.svg"));

var _location = _interopRequireDefault(require("./resources/location.svg"));

var Hooks = function Hooks(props, setLoggedInUser, setChatWith, setChatWithId, chatRef, setViewAttachButton, setViewComposer, setViewSticker, setStickerTemplate, setActionSheetItems, actionSheetClickHandler) {
  _react.default.useEffect(function () {
    //fetch logged in user
    _chat.CometChat.getLoggedinUser().then(function (user) {
      return setLoggedInUser(user);
    });
  }, []);

  _react.default.useEffect(function () {
    //update receiver user
    if (props.user && props.user.uid) {
      chatRef.current = {
        chatWith: _chat.CometChat.RECEIVER_TYPE.USER,
        chatWithId: props.user.uid
      };
      setChatWith(_chat.CometChat.RECEIVER_TYPE.USER);
      setChatWithId(props.user.uid);
    } else if (props.group && props.group.guid) {
      chatRef.current = {
        chatWith: _chat.CometChat.RECEIVER_TYPE.USER,
        chatWithId: props.user.uid
      };
      setChatWith(_chat.CometChat.RECEIVER_TYPE.GROUP);
      setChatWithId(props.group.guid);
    }
  }, [props.user, props.group, setChatWith, setChatWithId, chatRef]);

  _react.default.useEffect(function () {
    //if message filter list is empty, hide attachment icon and show message input box
    if (props.configurations.length === 0) {
      setViewComposer(true);

      if (!props.hideAttachment) {
        setViewAttachButton(false);
      }
    } //if stickers is part of message filter list


    var stickerMessageTemplate = props.configurations.find(function (messageTemplate) {
      return messageTemplate.category === _.CometChatMessageCategories.custom && messageTemplate.type === _.CometChatCustomMessageTypes.sticker;
    });

    if (stickerMessageTemplate) {
      setViewSticker(true);
      setStickerTemplate(stickerMessageTemplate);
    }

    var actionItemFont = "400 13px Inter, sans-serif";
    var actionItemColor = "#141414";
    var actionItemIconTint = "#fff";
    var actionSheetItems = [];
    props.configurations.forEach(function (eachMessageTemplate) {
      var actionItemCallback = eachMessageTemplate.actionCallback ? eachMessageTemplate.actionCallback : actionSheetClickHandler;

      switch (eachMessageTemplate.type) {
        case _.CometChatMessageTypes.file:
          {
            actionSheetItems.push({
              id: _.CometChatMessageTypes.file,
              iconURL: eachMessageTemplate.icon || _fileUpload.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatMessageTypes.image:
          {
            actionSheetItems.push({
              id: _.CometChatMessageTypes.image,
              iconURL: eachMessageTemplate.icon || _image.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatMessageTypes.audio:
          {
            actionSheetItems.push({
              id: _.CometChatMessageTypes.audio,
              iconURL: eachMessageTemplate.icon || _audioFile.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatMessageTypes.video:
          {
            actionSheetItems.push({
              id: _.CometChatMessageTypes.video,
              iconURL: eachMessageTemplate.icon || _video.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatCustomMessageTypes.poll:
          {
            actionSheetItems.push({
              id: _.CometChatCustomMessageTypes.poll,
              iconURL: eachMessageTemplate.icon || _polls.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatCustomMessageTypes.document:
          {
            actionSheetItems.push({
              id: _.CometChatCustomMessageTypes.document,
              iconURL: eachMessageTemplate.icon || _collaborativeDocument.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatCustomMessageTypes.whiteboard:
          {
            actionSheetItems.push({
              id: _.CometChatCustomMessageTypes.whiteboard,
              iconURL: eachMessageTemplate.icon || _collaborativeWhiteboard.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatCustomMessageTypes.location:
          {
            actionSheetItems.push({
              id: _.CometChatCustomMessageTypes.location,
              iconURL: eachMessageTemplate.icon || _location.default,
              iconTint: actionItemIconTint,
              title: eachMessageTemplate.name,
              titleFont: actionItemFont,
              titleColor: actionItemColor,
              onActionItemClick: actionItemCallback
            });
            break;
          }

        case _.CometChatCustomMessageTypes.sticker:
          break;

        default:
          actionSheetItems.push({
            id: eachMessageTemplate.type,
            iconURL: eachMessageTemplate === null || eachMessageTemplate === void 0 ? void 0 : eachMessageTemplate.icon,
            iconTint: actionItemIconTint,
            title: eachMessageTemplate.name,
            titleFont: actionItemFont,
            titleColor: actionItemColor,
            onActionItemClick: eachMessageTemplate === null || eachMessageTemplate === void 0 ? void 0 : eachMessageTemplate.actionCallback
          });
          break;
      }
    }); //if message filters are set, show attachment button

    if (actionSheetItems.length && !props.hideAttachment) {
      setViewAttachButton(true);
      setActionSheetItems(actionSheetItems);
    }
  }, []);
};

exports.Hooks = Hooks;