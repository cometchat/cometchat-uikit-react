"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatSmartReplyPreview = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

var _close = _interopRequireDefault(require("./resources/close.svg"));

var CometChatSmartReplyPreview = function CometChatSmartReplyPreview(props) {
  var options = props.options.map(function (option, key) {
    return /*#__PURE__*/_react.default.createElement("div", {
      key: key,
      style: (0, _style.previewOptionStyle)(),
      className: "option",
      onClick: function onClick() {
        return props.clicked(option);
      }
    }, option);
  });
  return /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewWrapperStyle)(),
    className: "reply__preview__wrapper"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewHeadingStyle)(),
    className: "preview__heading"
  }, /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewCloseStyle)(_close.default),
    onClick: props.close,
    className: "preview__close"
  })), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.previewOptionsWrapperStyle)(),
    className: "preview__options"
  }, options));
}; // Specifies the default values for props:


exports.CometChatSmartReplyPreview = CometChatSmartReplyPreview;
CometChatSmartReplyPreview.defaultProps = {};
CometChatSmartReplyPreview.propTypes = {};