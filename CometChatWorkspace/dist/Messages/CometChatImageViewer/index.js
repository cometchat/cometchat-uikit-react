"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatImageViewer = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _ = require("../../");

var _style = require("./style");

var _ring = _interopRequireDefault(require("./resources/ring.svg"));

var _close = _interopRequireDefault(require("./resources/close.svg"));

var CometChatImageViewer = function CometChatImageViewer(props) {
  var _React$useState = _react.default.useState(null),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      image = _React$useState2[0],
      setImage = _React$useState2[1];

  var img = new Image();
  img.src = props.message.data.url;

  img.onload = function () {
    setImage(img.src);
  };

  var imageIcon = null;

  if (image) {
    imageIcon = image;
  } else {
    imageIcon = _ring.default;
  }

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_.CometChatBackdrop, {
    show: true,
    clicked: props.close
  }), /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.imageWrapperStyle)(_close.default, image),
    onClick: props.close,
    className: "image__wrapper"
  }, /*#__PURE__*/_react.default.createElement("img", {
    src: imageIcon,
    style: (0, _style.imgStyle)(image),
    alt: imageIcon
  })));
}; // Specifies the default values for props:


exports.CometChatImageViewer = CometChatImageViewer;
CometChatImageViewer.defaultProps = {
  close: function close() {}
};
CometChatImageViewer.propTypes = {
  show: _propTypes.default.bool,
  close: _propTypes.default.func
};