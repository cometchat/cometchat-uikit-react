"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatBackdrop = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _style = require("./style");

var CometChatBackdrop = function CometChatBackdrop(props) {
  return props.show ? /*#__PURE__*/_react.default.createElement("div", {
    style: (0, _style.backdropStyle)(props),
    className: "modal__backdrop",
    onClick: props.clicked
  }) : null;
}; // Specifies the default values for props:


exports.CometChatBackdrop = CometChatBackdrop;
CometChatBackdrop.defaultProps = {
  show: false,
  style: {},
  clicked: function clicked() {}
};
CometChatBackdrop.propTypes = {
  show: _propTypes.default.bool,
  style: _propTypes.default.object,
  clicked: _propTypes.default.func
};