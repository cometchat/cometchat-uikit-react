"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _react = _interopRequireDefault(require("react"));

var _ = require("../");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var Hooks = function Hooks(props, setName, setAvatar, setVideoURL) {
  var getVideoFile = _react.default.useCallback(function () {
    var fileMetadata = (0, _.getMetadataByKey)(props.messageObject, _.metadataKey.file);

    if (fileMetadata instanceof Blob) {
      return {
        fileName: fileMetadata["name"]
      };
    } else if (props.messageObject.data.hasOwnProperty("attachments") && Array.isArray(props.messageObject.data.attachments) && props.messageObject.data.attachments.length) {
      // const fileName = props.messageObject.data.attachments[0]?.name;
      // const fileUrl = props.messageObject.data.attachments[0]?.url;
      // return { fileName, fileUrl: fileUrl };
      return _objectSpread({}, props.messageObject.data.attachments[0]);
    }
  }, [props.messageObject]);

  _react.default.useEffect(function () {
    if (props.userName && props.userName.length) {
      setName(props.userName);
    } else if (props.messageObject && props.messageObject.sender && props.messageObject.sender.name) {
      setName(props.messageObject.sender.name);
    }
  }, [props.userName, props.messageObject, setName]);

  _react.default.useEffect(function () {
    if (props.avatar && props.avatar.length) {
      //avatarSource.current = "url";
      setAvatar(props.avatar);
    } else if (props.messageObject && props.messageObject.sender) {
      //avatarSource.current = "user";
      setAvatar(props.messageObject.sender);
    }
  }, [props.avatar, props.messageObject, setAvatar]);

  _react.default.useEffect(function () {
    if (props.videoURL && props.videoURL.length) {
      setVideoURL(props.videoURL);
    } else if (props.messageObject) {
      var videoFileData = getVideoFile();

      if (videoFileData) {
        getVideoFile(videoFileData.url);
      }
    }
  }, [props.videoURL, props.messageObject, getVideoFile, setVideoURL]);
};

exports.Hooks = Hooks;