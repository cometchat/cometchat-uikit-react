"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hooks = void 0;

var _react = _interopRequireDefault(require("react"));

var _ = require("../../");

var Hooks = function Hooks(props, setName, setAvatar, setDocumentURL) {
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
    if (props.documentURL && props.documentURL.length) {
      setDocumentURL(props.documentURL);
    } else if (props.messageObject) {
      var documentData = (0, _.getExtensionsData)(props.messageObject, _.metadataKey.extensions.document);

      if (documentData && documentData.document_url && documentData.document_url.trim().length) {
        setDocumentURL(documentData.document_url);
      }
    }
  }, [props.documentURL, props.messageObject, setDocumentURL]);
};

exports.Hooks = Hooks;