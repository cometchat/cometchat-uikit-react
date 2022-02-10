"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CometChatStatusIndicator = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _hooks = require("./hooks");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

var CometChatStatusIndicator = function CometChatStatusIndicator(props) {
  var _React$useState = _react.default.useState(props.offlineBackgroundColor),
      _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
      color = _React$useState2[0],
      setColor = _React$useState2[1];

  var getStyle = function getStyle() {
    return _objectSpread({
      border: props.border,
      borderRadius: props.cornerRadius,
      backgroundColor: color,
      width: props.width,
      height: props.height,
      display: "inline-block"
    }, props.style);
  };

  (0, _hooks.Hooks)(setColor, props);
  return /*#__PURE__*/_react.default.createElement("span", {
    style: getStyle()
  });
}; // Specifies the default values for props:


exports.CometChatStatusIndicator = CometChatStatusIndicator;
CometChatStatusIndicator.defaultProps = {
  width: "14px",
  height: "14px",
  border: "2px solid white",
  cornerRadius: "50%",
  onlineBackgroundColor: "#3BDF2F",
  offlineBackgroundColor: "#C4C4C4",
  status: "offline",
  style: null
};
CometChatStatusIndicator.propTypes = {
  width: _propTypes.default.string,
  height: _propTypes.default.string,
  border: _propTypes.default.string,
  cornerRadius: _propTypes.default.string,
  onlineBackgroundColor: _propTypes.default.string,
  offlineBackgroundColor: _propTypes.default.string,
  status: _propTypes.default.oneOf(["online", "offline"]),
  style: _propTypes.default.object
};