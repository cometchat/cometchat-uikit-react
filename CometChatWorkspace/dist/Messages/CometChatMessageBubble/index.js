"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatMessageBubble = void 0;

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var _2 = require("../");

var _edit = _interopRequireDefault(require("./resources/edit.svg"));

var _delete = _interopRequireDefault(require("./resources/delete.svg"));

var _reactions = _interopRequireDefault(require("./resources/reactions.svg"));

var _messageTranslate = _interopRequireDefault(require("./resources/message-translate.svg"));

var _sendMessageInPrivate = _interopRequireDefault(require("./resources/send-message-in-private.svg"));

var CometChatMessageBubble = function CometChatMessageBubble(props) {
  var style = {
    cornerRadius: "12px",
    backgroundColor: "rgb(246, 246, 246)",
    titleColor: "rgb(20, 20, 20)",
    subTitleColor: "rgb(20, 20, 20, 60%)",
    iconColor: "rgb(20, 20, 20, 0.4)",
    usernameColor: "#39f",
    usernameFont: "600 13px Inter",
    voteCountColor: "rgb(20, 20, 20)",
    voteCountFont: "400 13px Inter,sans-serif",
    pollOptionsFont: "400 15px Inter,sans-serif",
    pollOptionsColor: "rgb(20, 20, 20)",
    pollOptionsBackgroundColor: "#fff",
    buttonTextColor: "#39f",
    buttonTextFont: "600 14px Inter,sans-serif",
    buttonBackgroundColor: "rgb(255, 255, 255)"
  };

  var hoverItemClickHandler = function hoverItemClickHandler(option) {
    props.onMessageOptionClick(option, props.messageObject);
  };

  var getCustomView = function getCustomView(customView) {
    return /*#__PURE__*/_react.default.createElement(customView, {
      key: props.messageKey,
      messageObject: props.messageObject,
      messageAlignment: props.messageAlignment,
      messageTimeAlignment: props.messageTimeAlignment,
      cornerRadius: style.cornerRadius,
      loggedInUser: props.loggedInUser,
      width: "100%",
      height: "auto"
    });
  };

  var getMessageOptions = function getMessageOptions(messageTemplate) {
    if (!messageTemplate.options || !messageTemplate.options.length) {
      return [];
    }

    var messageOptions = [];
    messageTemplate.options.forEach(function (option) {
      switch (option) {
        case _2.CometChatMessageOptions.edit:
          {
            messageOptions.push({
              id: option,
              iconURL: _edit.default,
              iconTint: "#808080",
              title: (0, _.localize)("EDIT_MESSAGE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.delete:
          {
            messageOptions.push({
              id: option,
              iconURL: _delete.default,
              iconTint: "red",
              title: (0, _.localize)("DELETE_MESSAGE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.reactToMessage:
          {
            messageOptions.push({
              id: option,
              iconURL: _reactions.default,
              iconTint: "#808080",
              title: (0, _.localize)("ADD_REACTION"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.translate:
          {
            messageOptions.push({
              id: option,
              iconURL: _messageTranslate.default,
              iconTint: "#808080",
              title: (0, _.localize)("TRANSLATE_MESSAGE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.replyInPrivate:
          {
            messageOptions.push({
              id: option,
              iconURL: _sendMessageInPrivate.default,
              iconTint: "#808080",
              title: (0, _.localize)("SEND_MESSAGE_IN_PRIVATE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        default:
          break;
      }
    });
    return messageOptions;
  };

  var getMessage = function getMessage() {
    var templateFound = props.configurations.find(function (messageTemplate) {
      return messageTemplate.type === props.messageObject.type;
    });

    if (!templateFound) {
      return null;
    }

    var messageOptions = getMessageOptions(templateFound);

    switch (props.messageObject.type) {
      case _2.CometChatMessageTypes.text:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatTextBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              textColor: props.messageStyle.textColor,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatMessageTypes.image:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatImageBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatMessageTypes.file:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatFileBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              titleColor: props.messageStyle.textColor,
              subTitleColor: props.messageStyle.subTitleColor,
              iconTint: props.messageStyle.iconTint,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatMessageTypes.audio:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatAudioBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              titleColor: props.messageStyle.titleColor,
              subTitleColor: props.messageStyle.subTitleColor,
              iconTint: props.messageStyle.iconTint,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatMessageTypes.video:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatVideoBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              titleColor: props.messageStyle.textColor,
              subTitleColor: props.messageStyle.textColor,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      default:
        break;
    }
  };

  var getCustomMessageOptions = function getCustomMessageOptions(messageTemplate) {
    if (!messageTemplate.options || !messageTemplate.options.length) {
      return [];
    }

    var messageOptions = [];
    messageTemplate.options.forEach(function (option) {
      switch (option) {
        case _2.CometChatMessageOptions.replyInPrivate:
          {
            messageOptions.push({
              id: option,
              iconURL: _sendMessageInPrivate.default,
              iconTint: "#808080",
              title: (0, _.localize)("SEND_MESSAGE_IN_PRIVATE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.delete:
          {
            messageOptions.push({
              id: option,
              iconURL: _delete.default,
              iconTint: "red",
              title: (0, _.localize)("DELETE_MESSAGE"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        case _2.CometChatMessageOptions.reactToMessage:
          {
            messageOptions.push({
              id: option,
              iconURL: _reactions.default,
              iconTint: "#808080",
              title: (0, _.localize)("ADD_REACTION"),
              width: "24px",
              height: "24px",
              onHoverItemClick: hoverItemClickHandler
            });
            break;
          }

        default:
          break;
      }
    });
    return messageOptions;
  };

  var getCustomMessage = function getCustomMessage() {
    var templateFound = props.configurations.find(function (messageTemplate) {
      return messageTemplate.type === props.messageObject.type;
    });

    if (!templateFound) {
      return null;
    }

    var messageOptions = getCustomMessageOptions(templateFound);

    switch (props.messageObject.type) {
      case _2.CometChatCustomMessageTypes.poll:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatPollBubble, {
              key: props.messageKey,
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              usernameFont: style.usernameFont,
              usernameColor: style.usernameColor,
              pollQuestionColor: props.messageStyle.titleColor,
              pollQuestionFont: style.pollQuestionFont,
              pollOptionsColor: style.pollOptionsColor,
              pollOptionsFont: style.pollOptionsFont,
              pollOptionsBackgroundColor: style.pollOptionsBackgroundColor,
              voteCountColor: style.voteCountColor,
              voteCountFont: style.voteCountFont,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatCustomMessageTypes.sticker:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatStickerBubble, {
              key: props.messageKey,
              width: "128px",
              height: "128px",
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              usernameFont: style.usernameFont,
              usernameColor: style.usernameColor,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatCustomMessageTypes.whiteboard:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatWhiteboardBubble, {
              key: props.messageKey,
              width: "100%",
              height: "auto",
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              usernameFont: props.messageStyle.usernameFont,
              usernameColor: props.messageStyle.usernameColor,
              title: props.messageStyle.whiteboardStyle.title,
              titleFont: props.messageStyle.whiteboardStyle.titleFont,
              titleColor: props.messageStyle.whiteboardStyle.titleColor,
              buttonText: props.messageStyle.whiteboardStyle.buttonText,
              buttonTextFont: props.messageStyle.whiteboardStyle.buttonTextFont,
              buttonTextColor: props.messageStyle.whiteboardStyle.buttonTextColor,
              buttonBackgroundColor: props.messageStyle.whiteboardStyle.buttonBackgroundColor,
              iconTint: props.messageStyle.whiteboardStyle.iconColor,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatCustomMessageTypes.document:
        {
          if (templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatDocumentBubble, {
              key: props.messageKey,
              width: "100%",
              height: "auto",
              messageObject: props.messageObject,
              messageAlignment: props.messageAlignment,
              messageTimeAlignment: props.messageTimeAlignment,
              cornerRadius: props.messageStyle.cornerRadius,
              backgroundColor: props.messageStyle.backgroundColor,
              usernameFont: props.messageStyle.usernameFont,
              usernameColor: props.messageStyle.usernameColor,
              title: props.messageStyle.documentStyle.title,
              titleFont: props.messageStyle.documentStyle.titleFont,
              titleColor: props.messageStyle.documentStyle.titleColor,
              buttonText: props.messageStyle.documentStyle.buttonText,
              buttonTextFont: props.messageStyle.documentStyle.buttonTextFont,
              buttonTextColor: props.messageStyle.documentStyle.buttonTextColor,
              buttonBackgroundColor: props.messageStyle.documentStyle.buttonBackgroundColor,
              iconTint: props.messageStyle.documentStyle.iconColor,
              loggedInUser: props.loggedInUser,
              messageOptions: messageOptions
            });
          }
        }

      case _2.CometChatCustomMessageTypes.location:
        {
          break; // if(templateFound.customView) {
          //     return getCustomView(templateFound.customView);
          // } else {
          //     return (
          //         <CometChatLocationBubble 
          //             key={props.messageKey}
          //             messageObject={props.messageObject}
          //             messageAlignment={props.messageAlignment}
          //             messageTimeAlignment={props.messageTimeAlignment}
          //             loggedInUser={props.loggedInUser}
          //             width="300px"
          //             height="250px"
          //             subTitle={localize("SHARED_LOCATION")}
          //             titleColor={style.titleColor}
          //             titleFont={style.titleFont}
          //             subTitleColor={style.subTitleColor}
          //             subTitleFont={style.voteCountFont}
          //             cornerRadius={style.cornerRadius} 
          //             backgroundColor={style.backgroundColor}
          //             usernameFont={style.usernameFont}
          //             usernameColor={style.usernameColor}
          //             messageOptions={messageOptions}
          //         />
          //     )
          // }
        }

      default:
        {
          if (templateFound && templateFound.customView) {
            return getCustomView(templateFound.customView);
          } else {
            return /*#__PURE__*/_react.default.createElement(_2.CometChatDefaultBubble, {
              key: props.messageKey,
              messageTemplate: templateFound,
              messageObject: props.messageObject
            });
          }
        }
    }
  }; //const renderItems = () => {


  if (props.messageObject.deletedAt) {
    return /*#__PURE__*/_react.default.createElement(_2.CometChatDeletedMessageBubble, {
      key: props.messageKey,
      loggedInUser: props.loggedInUser,
      messageObject: props.messageObject
    });
  }

  var component = null;

  switch (props.messageObject.category) {
    case _2.CometChatMessageCategories.message:
      {
        component = getMessage();
        break;
      }

    case _2.CometChatMessageCategories.custom:
      {
        component = getCustomMessage();
        break;
      }

    default:
      break;
  } //}


  return component;
};

exports.CometChatMessageBubble = CometChatMessageBubble;