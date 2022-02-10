"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var Hooks = function Hooks(props, setName, setAvatar, setStickerURL) {
  _react.default.useEffect(function () {
    if (props.userName && props.userName.length) {
      setName(props.userName);
    } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
      setName(props.messageObject.sender.name);
    }
  }, [props.userName, props.messageObject, setName]);

  _react.default.useEffect(function () {
    if (props.avatar && props.avatar.length) {
      setAvatar(props.avatar);
    } else if (props.messageObject && props.messageObject.sender) {
      setAvatar(props.messageObject.sender);
    }
  }, [props.avatar, props.messageObject, setAvatar]);

  _react.default.useEffect(function () {
    if (props.stickerURL && props.stickerURL.length) {
      setStickerURL(props.stickerURL);
    } else if (props.messageObject) {
      if (props.messageObject.data && props.messageObject.data.customData && props.messageObject.data.customData.sticker_url) {
        setStickerURL(props.messageObject.data.customData.sticker_url);
      }
    }
  }, [props.stickerURL, props.messageObject, setStickerURL]);
};

exports.Hooks = Hooks;